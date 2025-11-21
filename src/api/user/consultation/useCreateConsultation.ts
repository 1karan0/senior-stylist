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

  const res = await axios.post(`${BASE_URL}/api/customer/consultations/create`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};
