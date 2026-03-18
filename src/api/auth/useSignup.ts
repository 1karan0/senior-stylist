import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface CustomerSignupData {
  name: string;
  email: string;
  phone: string;
  phone_country_code: string;
  password: string;
  referral_code?: string;
}

interface ConsultantSignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  phone_country_code: string;
  cv?: {
    uri: string;
    name: string;
    type: string;
  };
  salon_code?: string;
  salon_name?: string;
  referral_code?: string;
  photo_id?: {
    uri: string;
    name: string;
    type: string;
  };
  has_minimum_salon_experience?: boolean;
  is_tech_capable?: boolean;
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
          formData.append('phone_country_code', data.phone_country_code);
          formData.append('password', data.password);

          if ('cv' in data && data.cv) {
            formData.append('cv', data.cv as any);
          }
          if ('salon_code' in data && data.salon_code) {
            formData.append('salon_code', data.salon_code);
          }
          if ('salon_name' in data && data.salon_name) {
            formData.append('salon_name', data.salon_name);
          }
          if ('referral_code' in data && data.referral_code) {
            formData.append('referral_code', data.referral_code);
          }
          if ('photo_id' in data && data.photo_id) {
            formData.append('photo_id', data.photo_id as any);
          }
          if (
            'has_minimum_salon_experience' in data &&
            typeof data.has_minimum_salon_experience === 'boolean'
          ) {
            formData.append(
              'has_minimum_salon_experience',
              String(data.has_minimum_salon_experience)
            );
          }
          if ('is_tech_capable' in data && typeof data.is_tech_capable === 'boolean') {
            formData.append('is_tech_capable', String(data.is_tech_capable));
          }
          const res = await axios.post(`${BASE_URL}/api/consultant/register`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          console.log('res.data===========', res.data);
          return res.data;
        } else {
          // Customer signup with JSON payload
          const payload: CustomerSignupData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            phone_country_code: data.phone_country_code,
            password: data.password,
          };

          if ('referral_code' in data && data.referral_code) {
            payload.referral_code = data.referral_code;
          }

          const res = await axios.post(`${BASE_URL}/api/register`, payload);
          return res.data;
        }
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
