import { Platform } from 'react-native';

import type { ConsultantConsultation } from '@/api/consultant/consultations';
import type { ChatMessage } from '@/types/chat';

type Consultation = ConsultantConsultation;

// Only import SQLite on native platforms
let SQLite: any = null;
let db: any = null;
const isWeb = Platform.OS === 'web';

// Write queue for database operations to prevent transaction conflicts
class WriteQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async enqueue(operation: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          if (__DEV__) {
            console.error('Write queue operation failed:', error);
          }
        }
      }
    }

    this.processing = false;
  }
}

const writeQueue = new WriteQueue();

if (!isWeb) {
  try {
    SQLite = require('react-native-nitro-sqlite');
    if (SQLite?.enableSimpleNullHandling) {
      SQLite.enableSimpleNullHandling(true);
      if (__DEV__) {
        console.log('[SQLite]', 'Simple null handling enabled');
      }
    }
  } catch (error) {
    // SQLite not available (e.g., Expo Go without native modules)
    if (__DEV__) {
      console.warn('SQLite not available, using in-memory cache');
    }
  }
}

// In-memory fallback for web/Expo Go
const inMemoryCache = new Map<number, ChatMessage[]>();

// Wrapper to provide expo-sqlite-like API for react-native-nitro-sqlite
const createDatabaseWrapper = (nitroSqliteDb: any) => {
  const extractRows = (result: any): any[] => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.rows)) return result.rows;
    if (result.rows?._array && Array.isArray(result.rows._array)) {
      return result.rows._array;
    }
    if (
      result.rows &&
      typeof result.rows.length === 'number' &&
      typeof result.rows.item === 'function'
    ) {
      const arr = [];
      for (let i = 0; i < result.rows.length; i += 1) {
        arr.push(result.rows.item(i));
      }
      return arr;
    }
    if (__DEV__) {
      console.warn('[SQLite] Unable to extract rows from result:', result);
    }
    return [];
  };

  const wrapper: any = {};

  wrapper.execAsync = async (sql: string, params?: any[]) => {
    await nitroSqliteDb.executeAsync(sql, params || []);
  };

  wrapper.runAsync = async (sql: string, params?: any[]) => {
    nitroSqliteDb.execute(sql, params || []);
  };

  wrapper.getAllAsync = async (sql: string, params?: any[]): Promise<any[]> => {
    const result = await nitroSqliteDb.executeAsync(sql, params || []);
    return extractRows(result);
  };

  wrapper.getFirstAsync = async (sql: string, params?: any[]): Promise<any | null> => {
    const rows = await wrapper.getAllAsync(sql, params);
    return rows.length > 0 ? rows[0] : null;
  };

  return wrapper;
};

const logDatabaseIntrospection = async (database: any) => {
  try {
    const tables = await database.getAllAsync(
      `SELECT name, sql 
       FROM sqlite_master 
       WHERE type='table' 
       ORDER BY name`
    );
    if (__DEV__) {
      console.log('[SQLite] Existing tables:');
      tables.forEach((table: any) => {
        console.log(` - ${table?.name}: ${table?.sql}`);
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[SQLite] Failed to introspect tables', error);
    }
  }
};

export const initChatDatabase = async (): Promise<any> => {
  if (isWeb || !SQLite) {
    // Return a mock database object for web/Expo Go
    return {
      execAsync: async () => {},
      runAsync: async () => {},
      getAllAsync: async () => [],
      getFirstAsync: async () => null,
    };
  }

  if (db) {
    return db;
  }

  try {
    const nitroSqliteDb = SQLite.open({ name: 'chat.db', location: 'default' });

    // Enable WAL mode for better write performance
    nitroSqliteDb.execute(`PRAGMA journal_mode = WAL;`);
    nitroSqliteDb.execute(`PRAGMA synchronous = NORMAL;`);
    nitroSqliteDb.execute(`PRAGMA temp_store = MEMORY;`);

    // Create messages table
    nitroSqliteDb.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        consultation_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        message TEXT,
        message_type TEXT NOT NULL,
        attachment_url TEXT,
        link_preview TEXT,
        is_read INTEGER DEFAULT 0,
        status TEXT DEFAULT 'sent',
        temp_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create indexes for better query performance
    nitroSqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS idx_consultation_created 
      ON messages(consultation_id, created_at)
    `);

    nitroSqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS idx_message_status 
      ON messages(consultation_id, status)
    `);

    // Wrap the database to provide expo-sqlite-like API
    db = createDatabaseWrapper(nitroSqliteDb);
    logDatabaseIntrospection(db);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to initialize SQLite, using in-memory cache:', error);
    }
    // Return mock database
    return {
      execAsync: async () => {},
      runAsync: async () => {},
      getAllAsync: async () => [],
      getFirstAsync: async () => null,
    };
  }

  return db;
};

export const getChatDatabase = async (): Promise<any> => {
  if (!db) {
    return await initChatDatabase();
  }
  return db;
};

export const saveMessage = async (consultationId: number, message: ChatMessage): Promise<void> => {
  if (isWeb || !SQLite) {
    // Use in-memory cache for web/Expo Go
    const messages = inMemoryCache.get(consultationId) || [];
    const index = messages.findIndex(
      (m) => m.id === message.id || (!!message.temp_id && m.temp_id === message.temp_id)
    );
    if (index >= 0) {
      messages[index] = message;
    } else {
      messages.push(message);
    }
    inMemoryCache.set(consultationId, messages);
    return;
  }

  const database = await getChatDatabase();

  const linkPreviewJson = message.link_preview ? JSON.stringify(message.link_preview) : null;

  await database.runAsync(
    `INSERT OR REPLACE INTO messages (
      id, consultation_id, user_id, user_name, message, message_type,
      attachment_url, link_preview, is_read, status, temp_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      consultationId,
      message.user_id,
      message.user_name,
      message.message || null,
      message.message_type,
      message.attachment_url || null,
      linkPreviewJson,
      message.is_read ? 1 : 0,
      message.status || 'sent',
      message.temp_id || null,
      message.created_at,
      new Date().toISOString(),
    ]
  );
};

// Helper function to chunk array
const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const saveMessages = async (
  consultationId: number,
  messages: ChatMessage[]
): Promise<void> => {
  if (isWeb || !SQLite) {
    // Use in-memory cache for web/Expo Go
    const existing = inMemoryCache.get(consultationId) || [];
    const messageMap = new Map<string, ChatMessage>();
    existing.forEach((m) => messageMap.set(m.id, m));
    messages.forEach((m) => messageMap.set(m.id, m));
    inMemoryCache.set(consultationId, Array.from(messageMap.values()));
    return;
  }

  if (messages.length === 0) return;

  // Use write queue to prevent transaction conflicts
  return writeQueue.enqueue(async () => {
    const database = await getChatDatabase();

    const insertQuery = `
    INSERT OR REPLACE INTO messages (
      id, consultation_id, user_id, user_name, message, message_type,
      attachment_url, link_preview, is_read, status, temp_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    try {
      const now = new Date().toISOString();

      // Chunk large batches to avoid UI freezing
      if (messages.length > 100) {
        const chunks = chunk(messages, 50);

        for (const chunk of chunks) {
          await database.execAsync('BEGIN TRANSACTION');

          try {
            for (const message of chunk) {
              const linkPreviewJson = message.link_preview
                ? JSON.stringify(message.link_preview)
                : null;

              await database.runAsync(insertQuery, [
                message.id,
                consultationId,
                message.user_id,
                message.user_name,
                message.message ?? null,
                message.message_type,
                message.attachment_url ?? null,
                linkPreviewJson,
                message.is_read ? 1 : 0,
                message.status || 'sent',
                message.temp_id ?? null,
                message.created_at,
                now,
              ]);
            }

            await database.execAsync('COMMIT');
          } catch (e) {
            await database.execAsync('ROLLBACK');
            throw e;
          }
        }
      } else {
        // Small batches - single transaction
        await database.execAsync('BEGIN TRANSACTION');

        try {
          for (const message of messages) {
            const linkPreviewJson = message.link_preview
              ? JSON.stringify(message.link_preview)
              : null;

            await database.runAsync(insertQuery, [
              message.id,
              consultationId,
              message.user_id,
              message.user_name,
              message.message ?? null,
              message.message_type,
              message.attachment_url ?? null,
              linkPreviewJson,
              message.is_read ? 1 : 0,
              message.status || 'sent',
              message.temp_id ?? null,
              message.created_at,
              now,
            ]);
          }

          await database.execAsync('COMMIT');
        } catch (e) {
          await database.execAsync('ROLLBACK');
          throw e;
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save messages to SQLite:', error);
      }
      // Fallback to in-memory cache on error
      const existing = inMemoryCache.get(consultationId) || [];
      const messageMap = new Map<string, ChatMessage>();
      existing.forEach((m) => messageMap.set(m.id, m));
      messages.forEach((m) => messageMap.set(m.id, m));
      inMemoryCache.set(consultationId, Array.from(messageMap.values()));
      throw error; // Re-throw to let queue handle it
    }
  });
};

export const getMessages = async (
  consultationId: number,
  limit: number = 30,
  before?: string
): Promise<ChatMessage[]> => {
  if (isWeb || !SQLite) {
    // Use in-memory cache for web/Expo Go
    const messages = inMemoryCache.get(consultationId) || [];
    let filtered = messages;

    if (before) {
      filtered = filtered.filter((m) => m.created_at < before);
    }

    filtered = filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered.reverse(); // Reverse to get chronological order
  }

  const database = await getChatDatabase();

  // Optimized query - only fetch needed fields, use SQL sorting instead of JS
  const query = `
    SELECT id, user_id, user_name, message, message_type, attachment_url,
           link_preview, is_read, status, temp_id, created_at
    FROM messages
    WHERE consultation_id = ?
    ${before ? `AND created_at < ?` : ''}
    ORDER BY created_at DESC
    LIMIT ?
  `;

  const params = before ? [consultationId, before, limit] : [consultationId, limit];

  try {
    const result = await database.getAllAsync(query, params);

    if (__DEV__) {
      console.log('[SQLite] getMessages result count:', result?.length);
    }

    // Parse results and reverse to get chronological order
    // Parse link_preview lazily (only when needed, not on every scroll)
    return (
      result
        .filter((row: any, index: number) => {
          if (!row) {
            if (__DEV__) {
              console.warn(`[SQLite] Row at index ${index} is undefined`, result);
            }
            return false;
          }
          return true;
        })
        .map((row: any) => {
          // Only parse link_preview if it exists and is a string
          // Most messages won't have link_preview, so this avoids unnecessary parsing
          let linkPreview;
          if (row.link_preview) {
            try {
              linkPreview =
                typeof row.link_preview === 'string'
                  ? JSON.parse(row.link_preview)
                  : row.link_preview;
            } catch (e) {
              // Invalid JSON, skip it
              if (__DEV__) {
                console.warn('Failed to parse link_preview:', e, row?.link_preview);
              }
            }
          }

          return {
            id: row.id,
            user_id: row.user_id,
            user_name: row.user_name,
            message: row.message || undefined,
            message_type: row.message_type,
            attachment_url: row.attachment_url || undefined,
            link_preview: linkPreview,
            is_read: Boolean(row.is_read),
            status: (row.status || 'sent') as 'pending' | 'sent' | 'failed',
            temp_id: row.temp_id || undefined,
            created_at: row.created_at,
          };
        })
        // Filter out any messages that are still marked failed with a temp_id and
        // no corresponding Firestore ID (id starts with 'temp_' or has temp_id set).
        .filter((msg: ChatMessage) => {
          if (msg.status !== 'failed') {
            return true;
          }
          if (msg.temp_id || String(msg.id).startsWith('temp_')) {
            // Drop permanent failed temp messages from cache
            return false;
          }
          return true;
        })
        .reverse()
    ); // Reverse to get chronological order (oldest first)
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to get messages from SQLite:', error);
    }
    // Fallback to in-memory cache
    const messages = inMemoryCache.get(consultationId) || [];
    return messages.slice(0, limit);
  }
};

export const getLatestMessageTime = async (consultationId: number): Promise<string | null> => {
  if (isWeb || !SQLite) {
    const messages = inMemoryCache.get(consultationId) || [];
    if (messages.length === 0) return null;
    const sorted = messages.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0]?.created_at || null;
  }

  const database = await getChatDatabase();

  try {
    const result = await database.getAllAsync(
      `SELECT created_at FROM messages
       WHERE consultation_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [consultationId]
    );

    return result && result.length > 0 && result[0] ? (result[0] as any).created_at || null : null;
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to get latest message time:', error);
    }
    return null;
  }
};

export const clearMessages = async (consultationId: number): Promise<void> => {
  if (isWeb || !SQLite) {
    inMemoryCache.delete(consultationId);
    return;
  }

  const database = await getChatDatabase();
  await database.runAsync(`DELETE FROM messages WHERE consultation_id = ?`, [consultationId]);
};

export const clearAllMessages = async (): Promise<void> => {
  if (isWeb || !SQLite) {
    inMemoryCache.clear();
    return;
  }

  const database = await getChatDatabase();
  await database.runAsync(`DELETE FROM messages`);
};

export const markMessageAsRead = async (
  consultationId: number,
  messageId: string
): Promise<void> => {
  if (isWeb || !SQLite) {
    const messages = inMemoryCache.get(consultationId) || [];
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      message.is_read = true;
      inMemoryCache.set(consultationId, messages);
    }
    return;
  }

  const database = await getChatDatabase();
  await database.runAsync(`UPDATE messages SET is_read = 1 WHERE consultation_id = ? AND id = ?`, [
    consultationId,
    messageId,
  ]);
};

export const markAllAsRead = async (consultationId: number): Promise<void> => {
  if (isWeb || !SQLite) {
    const messages = inMemoryCache.get(consultationId) || [];
    messages.forEach((m) => {
      m.is_read = true;
    });
    inMemoryCache.set(consultationId, messages);
    return;
  }

  const database = await getChatDatabase();
  await database.runAsync(`UPDATE messages SET is_read = 1 WHERE consultation_id = ?`, [
    consultationId,
  ]);
};

export const updateMessageStatus = async (
  consultationId: number,
  messageId: string,
  status: 'pending' | 'sent' | 'failed',
  firestoreId?: string
): Promise<void> => {
  if (isWeb || !SQLite) {
    const messages = inMemoryCache.get(consultationId) || [];
    const message = messages.find((m) => m.id === messageId || m.temp_id === messageId);
    if (message) {
      message.status = status;
      if (firestoreId) {
        message.id = firestoreId;
        message.temp_id = undefined;
      }
      inMemoryCache.set(consultationId, messages);
    }
    return;
  }

  // Use write queue to prevent transaction conflicts
  return writeQueue.enqueue(async () => {
    const database = await getChatDatabase();

    if (firestoreId) {
      // Check if a message with the firestoreId already exists (from real-time listener)
      const existing = await database.getFirstAsync(
        `SELECT id FROM messages WHERE consultation_id = ? AND id = ?`,
        [consultationId, firestoreId]
      );

      if (existing) {
        // Real message already exists (from real-time listener), just delete the temp message
        await database.runAsync(
          `DELETE FROM messages WHERE consultation_id = ? AND (id = ? OR temp_id = ?)`,
          [consultationId, messageId, messageId]
        );
      } else {
        // Real message doesn't exist yet, update temp message with real Firestore ID
        // Use a transaction to ensure atomicity
        await database.execAsync('BEGIN TRANSACTION');
        try {
          // First, check again if it exists (race condition check)
          const checkAgain = await database.getFirstAsync(
            `SELECT id FROM messages WHERE consultation_id = ? AND id = ?`,
            [consultationId, firestoreId]
          );

          if (checkAgain) {
            // It was just created, delete temp message
            await database.runAsync(
              `DELETE FROM messages WHERE consultation_id = ? AND (id = ? OR temp_id = ?)`,
              [consultationId, messageId, messageId]
            );
          } else {
            // Safe to update
            await database.runAsync(
              `UPDATE messages SET id = ?, status = ?, temp_id = NULL WHERE consultation_id = ? AND (id = ? OR temp_id = ?)`,
              [firestoreId, status, consultationId, messageId, messageId]
            );
          }
          await database.execAsync('COMMIT');
        } catch (e) {
          await database.execAsync('ROLLBACK');
          throw e;
        }
      }
    } else {
      // Just update status, no ID change
      await database.runAsync(
        `UPDATE messages SET status = ? WHERE consultation_id = ? AND (id = ? OR temp_id = ?)`,
        [status, consultationId, messageId, messageId]
      );
    }
  });
};

export const getPendingMessages = async (consultationId: number): Promise<ChatMessage[]> => {
  if (isWeb || !SQLite) {
    const messages = inMemoryCache.get(consultationId) || [];
    const pending = messages.filter((m) => m.status === 'pending' || m.status === 'failed');
    // Sort by created_at ascending (oldest first for retry order)
    return pending.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  const database = await getChatDatabase();

  try {
    const result = await database.getAllAsync(
      `SELECT id, user_id, user_name, message, message_type, attachment_url,
              link_preview, is_read, status, temp_id, created_at
       FROM messages
       WHERE consultation_id = ? AND status IN ('pending', 'failed')
       ORDER BY created_at ASC`,
      [consultationId]
    );

    // Parse link_preview lazily (only when needed, not on every load)
    return result.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      message: row.message || undefined,
      message_type: row.message_type,
      attachment_url: row.attachment_url || undefined,
      // Store raw JSON string - parse lazily when message is displayed
      link_preview: row.link_preview
        ? typeof row.link_preview === 'string'
          ? JSON.parse(row.link_preview)
          : row.link_preview
        : undefined,
      is_read: Boolean(row.is_read),
      status: row.status as 'pending' | 'sent' | 'failed',
      temp_id: row.temp_id || undefined,
      created_at: row.created_at,
    }));
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to get pending messages:', error);
    }
    return [];
  }
};

// Consultation list caching
let consultationsCache: Map<number, Consultation> = new Map();

export const saveConsultations = async (consultations: Consultation[]): Promise<void> => {
  if (isWeb || !SQLite) {
    consultations.forEach((c) => consultationsCache.set(c.id, c));
    return;
  }

  if (consultations.length === 0) return;

  // Use write queue to prevent transaction conflicts
  return writeQueue.enqueue(async () => {
    const database = await getChatDatabase();

    const insertQuery = `
      INSERT OR REPLACE INTO consultations (id, data, updated_at) VALUES (?, ?, ?)
    `;

    try {
      // Create consultations table if it doesn't exist
      await database.runAsync(`
        CREATE TABLE IF NOT EXISTS consultations (
          id INTEGER PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Use explicit transaction management
      await database.execAsync('BEGIN TRANSACTION');

      try {
        const now = new Date().toISOString();

        for (const consultation of consultations) {
          await database.runAsync(insertQuery, [
            consultation.id,
            JSON.stringify(consultation),
            now,
          ]);
        }

        await database.execAsync('COMMIT');
      } catch (e) {
        await database.execAsync('ROLLBACK');
        throw e;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save consultations to SQLite:', error);
      }
      // Fallback to in-memory cache
      consultations.forEach((c) => consultationsCache.set(c.id, c));
      throw error; // Re-throw to let queue handle it
    }
  });
};

export const getCachedConsultations = async (): Promise<Consultation[]> => {
  if (isWeb || !SQLite) {
    return Array.from(consultationsCache.values());
  }

  const database = await getChatDatabase();

  try {
    const result = await database.getAllAsync(
      `SELECT data FROM consultations ORDER BY updated_at DESC`
    );

    return result.map((row: any) => JSON.parse(row.data));
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to get cached consultations:', error);
    }
    return [];
  }
};

export const clearConsultationsCache = async (): Promise<void> => {
  if (isWeb || !SQLite) {
    consultationsCache.clear();
    return;
  }

  const database = await getChatDatabase();
  await database.runAsync(`DELETE FROM consultations`);
};

// Individual consultation caching
export const saveConsultation = async (consultation: Consultation): Promise<void> => {
  return saveConsultations([consultation]);
};

export const getCachedConsultation = async (
  consultationId: number
): Promise<Consultation | null> => {
  if (isWeb || !SQLite) {
    return consultationsCache.get(consultationId) || null;
  }

  const database = await getChatDatabase();

  try {
    const result = await database.getFirstAsync(`SELECT data FROM consultations WHERE id = ?`, [
      consultationId,
    ]);

    if (result) {
      return JSON.parse(result.data);
    }
    return null;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to get cached consultation:', error);
    }
    return null;
  }
};

// User data caching
let userCache: { id: string; name: string; email: string } | null = null;

export const saveUser = async (user: {
  id: number;
  name: string;
  email: string;
}): Promise<void> => {
  const userData = {
    id: String(user.id),
    name: user.name,
    email: user.email,
  };

  if (isWeb || !SQLite) {
    userCache = userData;
    return;
  }

  const database = await getChatDatabase();

  try {
    // Create user table if it doesn't exist
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await database.runAsync(
      `INSERT OR REPLACE INTO user (id, name, email, updated_at) VALUES (?, ?, ?, ?)`,
      [userData.id, userData.name, userData.email, new Date().toISOString()]
    );

    userCache = userData;
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to save user to SQLite:', error);
    }
    userCache = userData; // Fallback to in-memory
  }
};

export const getCachedUser = async (): Promise<{
  id: string;
  name: string;
  email: string;
} | null> => {
  if (isWeb || !SQLite) {
    return userCache;
  }

  const database = await getChatDatabase();

  try {
    const result = await database.getFirstAsync(
      `SELECT id, name, email FROM user ORDER BY updated_at DESC LIMIT 1`
    );

    if (result) {
      userCache = {
        id: result.id,
        name: result.name,
        email: result.email,
      };
      return userCache;
    }
    return userCache;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to get cached user:', error);
    }
    return userCache;
  }
};
