import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import axios from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';

const buildQueryString = (params: Record<string, string | undefined>) => {
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
  month?: string,
  year?: string
) => {
  return useQuery({
    queryKey: ['statement-download', taxYear, type, period, month ?? '', year ?? ''],
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
  taxYear: string; // UK tax year label like "2025-26"
  type: 'pdf' | 'csv';
  period: 'tax_year' | 'month' | 'year';
  month?: string; // "1".."12" (required when period="month")
  year?: string; // "2026" (required when period="month" or "year")
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

      const { taxYear, type, period, month, year } = params;
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
  });
};
