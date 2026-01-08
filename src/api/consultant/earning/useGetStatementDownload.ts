import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import axios from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';

// Type declaration for btoa (available in React Native but not in TypeScript types)
declare const btoa: ((str: string) => string) | undefined;

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
};

/**
 * Legacy query hook (kept for compatibility).
 * Prefer `useDownloadStatement` for button-click downloads.
 */
export const useGetStatementDownload = (
  taxYear: string,
  type: string,
  period: string,
  month?: number,
  year?: number
) => {
  return useQuery({
    queryKey: ['statement-download', taxYear, type, period, month ?? undefined, year ?? undefined],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Token not found');
      const qs = buildQueryString({
        tax_year: taxYear,
        type,
        period,
        month,
        year,
      });

      const res = await axios.get(`${BASE_URL}/api/stylist/statements/download?${qs}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    },
    enabled: !!taxYear && !!type && !!period,
  });
};

export type StatementDownloadParams = {
  type: 'csv';
  period: 'tax_year' | 'month' | 'year';
  tax_year?: string; // "2025-26" (required when period="tax_year")
  month?: number; // 1-12 (required when period="month")
  year?: number; // e.g., 2026 (required when period="month" or "year")
};

/**
 * Prefer this over `useGetStatementDownload` for button-click downloads.
 * It's an action, so a mutation fits better than a query.
 */
export const useDownloadStatement = () => {
  return useMutation({
    mutationFn: async (params: StatementDownloadParams) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Token not found');

      const { type, period, tax_year, month, year } = params;

      // Build query params based on period type
      const queryParams: Record<string, string | number | undefined> = {
        type,
        period,
      };

      if (period === 'tax_year') {
        queryParams.tax_year = tax_year;
      } else if (period === 'month') {
        queryParams.month = month;
        queryParams.year = year;
      } else if (period === 'year') {
        queryParams.year = year;
      }

      const qs = buildQueryString(queryParams);

      // Request file as arraybuffer to handle binary data
      const res = await axios.get(`${BASE_URL}/api/stylist/statements/download?${qs}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'arraybuffer', // Get raw binary data
        // axios automatically handles gzip decompression by default
      });

      // Extract filename from content-disposition header
      const contentDisposition =
        res.headers['content-disposition'] || res.headers['Content-Disposition'] || '';
      let filename = 'statement.csv';
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }

      // Convert arraybuffer to base64 for React Native File System
      const arrayBuffer = res.data;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      if (typeof btoa === 'undefined') {
        throw new Error('Base64 encoding not available');
      }
      const base64 = btoa(binary);

      return {
        base64,
        filename,
        mime: res.headers['content-type'] || 'text/csv',
      };
    },
  });
};
