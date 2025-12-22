import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { storage } from '@/services/storage';

export interface LeaderboardEntry {
  rank: number;
  consultant_id: number;
  name: string;
  photo_url: string | null;
  consultations_count: number;
}

export interface LeaderboardData {
  month: number;
  year: number;
  month_name: string;
  calculated_at: string;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardResponse {
  status: string;
  code: number;
  message: string;
  data: LeaderboardData;
}

export const useGetLeaderboard = () => {
  return useQuery<LeaderboardData>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      try {
        const token = await storage.getToken();
        if (!token) throw new Error('Auth token missing');

        const res = await axios.get<LeaderboardResponse>(`${BASE_URL}/api/leaderboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Device-Type': 'android',
            'X-App-Version': '1.0.0',
          },
        });

        return res.data.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
