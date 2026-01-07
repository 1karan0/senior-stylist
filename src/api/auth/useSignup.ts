import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface CustomerSignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  referral_code?: string;
}

interface ConsultantSignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  cv?: {
    uri: string;
    name: string;
    type: string;
  };
}

interface SignupParams {
  data: CustomerSignupData | ConsultantSignupData;
  isConsultant: boolean;
}

export const useSignupApi = () => {
  return useMutation({
    mutationFn: async ({ data, isConsultant }: SignupParams) => {
      try {
        if (isConsultant) {
          // Consultant signup with FormData for CV upload
          const formData = new FormData();
          formData.append('name', data.name);
          formData.append('email', data.email);
          formData.append('phone', data.phone);
          formData.append('password', data.password);

          if ('cv' in data && data.cv) {
            formData.append('cv', data.cv as any);
          }

          const res = await axios.post(`${BASE_URL}/api/consultant/register`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          console.log('res======>', res.data);
          return res.data;
        } else {
          // Customer signup with JSON payload
          const payload: CustomerSignupData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
          };

          if ('referral_code' in data && data.referral_code) {
            payload.referral_code = data.referral_code;
          }

          const res = await axios.post(`${BASE_URL}/api/register`, payload);
          console.log('res======>', res.data);
          return res.data;
        }
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
