import axios from 'axios';
import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';

export const createConsultation = async (problem_description: string, image: any | null) => {
  const token = await storage.getToken();
  if (!token) throw new Error('Auth token missing');

  const formData = new FormData();
  formData.append('problem_description', problem_description);

  if (image) {
    formData.append('image', {
      uri: image.uri.replace('file://', ''),
      type: image.type || 'image/jpeg',
      name: image.fileName || `image_${Date.now()}.jpg`,
    });
  }

  try {
    const res = await axios.post(`${BASE_URL}/api/customer/consultations/create`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  } catch (err: any) {
    // If backend sends validation error (422)
    if (err?.response?.status === 422) {
      const apiErrors = err?.response?.data?.errors;

      if (apiErrors && typeof apiErrors === 'object') {
        // get first validation message
        const firstKey = Object.keys(apiErrors)[0];
        const firstMsg = apiErrors[firstKey][0];

        throw new Error(firstMsg);
      }
    }

    // Any other API/network error fallback
    throw new Error(err?.response?.data?.message || err?.message || 'Something went wrong');
  }
};
