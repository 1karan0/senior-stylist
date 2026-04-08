import * as Sentry from '@sentry/react-native';
import axios, { type AxiosError } from 'axios';
import type { User } from '@/common/types';
import { ENV, SENTRY_DSN } from '@/config';

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  const withoutQuery = url.split('?')[0] ?? url;
  const path = withoutQuery.replace(/^https?:\/\/[^/]+/i, '');
  const out = path || withoutQuery;
  return out.length > 200 ? `${out.slice(0, 200)}…` : out;
}

function registerAxiosInterceptors(): void {
  axios.interceptors.request.use((config) => {
    const method = (config.method ?? 'GET').toUpperCase();
    Sentry.addBreadcrumb({
      category: 'http',
      type: 'http',
      level: 'info',
      data: {
        method,
        url: sanitizeUrl(config.url),
      },
    });
    return config;
  });

  axios.interceptors.response.use(
    (response) => {
      Sentry.addBreadcrumb({
        category: 'http',
        type: 'http',
        level: 'info',
        data: {
          status_code: response.status,
          url: sanitizeUrl(response.config.url),
        },
      });
      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data;
      let errorDetail = '';
      try {
        if (typeof data === 'string') {
          errorDetail = data.slice(0, 500);
        } else if (data != null) {
          errorDetail = JSON.stringify(data).slice(0, 500);
        }
      } catch {
        errorDetail = '';
      }
      Sentry.addBreadcrumb({
        category: 'http',
        type: 'http',
        level: 'error',
        data: {
          status_code: status,
          url: sanitizeUrl(error.config?.url),
          error_detail: errorDetail,
        },
      });
      return Promise.reject(error);
    }
  );
}

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV ?? 'unknown',
    enableAutoSessionTracking: true,
    sendDefaultPii: false,
    integrations: [Sentry.reactNativeTracingIntegration(), navigationIntegration],
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
  registerAxiosInterceptors();
}

export function isSentryEnabled(): boolean {
  return Boolean(SENTRY_DSN);
}

export function syncSentryUser(user: User | null, isGuest: boolean): void {
  if (!SENTRY_DSN) {
    return;
  }
  if (user) {
    Sentry.setUser({
      id: String(user.id),
      email: user.email,
      username: user.name,
    });
    Sentry.setTag('is_guest', 'false');
    Sentry.setTag('user_role', user.role);
  } else {
    Sentry.setUser(null);
    Sentry.setTag('is_guest', isGuest ? 'true' : 'false');
  }
}

export function registerSentryNavigationContainer(ref: unknown): void {
  if (!SENTRY_DSN || !ref) {
    return;
  }
  navigationIntegration.registerNavigationContainer(ref);
}
