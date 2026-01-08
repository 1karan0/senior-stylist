import axios from 'axios';
import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';

// Type declaration for atob (available in React Native but not in TypeScript types)
declare const atob: ((encoded: string) => string) | undefined;

// Upload image to Firebase Storage using Laravel signed URL
// Uses XMLHttpRequest for maximum control over headers (fetch may add extra headers)
// CRITICAL: For GCS signed URLs, we must ONLY set headers that are part of the signature
const uploadImageToSignedUrl = async (
  imageUri: string,
  uploadUrl: string,
  headers: Record<string, string>
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let body: Uint8Array;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (__DEV__) {
          console.log('[consultation] image upload successful', { status: xhr.status });
        }
        resolve();
      } else {
        const errorText = xhr.responseText || xhr.statusText || 'Unknown error';
        if (__DEV__) {
          console.error('[consultation] upload failed', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: errorText.substring(0, 500),
            uploadUrl: uploadUrl.substring(0, 100) + '...',
            headersUsed: Object.keys(headers),
          });
        }
        reject(new Error(`Failed to upload image: ${xhr.status} ${errorText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading image'));
    };

    xhr.open('PUT', uploadUrl, true);

    // CRITICAL: For GCS signed URLs, we MUST set ONLY the headers that are part of the signature
    // Setting extra headers or headers in wrong case will break the signature
    // Set headers exactly as provided by Laravel
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });

    // Prepare body
    const prepareAndSend = (imageData: Uint8Array) => {
      body = imageData;
      if (__DEV__) {
        console.log('[consultation] sending PUT request', {
          bodySize: body.length,
          headers: headers,
        });
      }
      xhr.send(body);
    };

    if (imageUri.startsWith('data:image')) {
      // Extract base64 string from data URI
      const base64String = imageUri.split(',')[1];
      if (!base64String) {
        reject(new Error('Invalid data URI: missing base64 data'));
        return;
      }

      // Convert base64 to binary
      if (typeof atob === 'undefined') {
        reject(new Error('Base64 decoding not available'));
        return;
      }

      try {
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        prepareAndSend(bytes);
      } catch (error) {
        reject(new Error(`Failed to process image: ${error}`));
      }
    } else {
      // For file:// or content:// URIs
      fetch(imageUri)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          prepareAndSend(new Uint8Array(arrayBuffer));
        })
        .catch((error) => {
          reject(new Error(`Failed to read image file: ${error}`));
        });
    }
  });
};

export const createConsultation = async (problem_description: string, image: any | null) => {
  const token = await storage.getToken();
  if (!token) throw new Error('Auth token missing');

  let imageStoragePath: string | null = null;
  let imagePublicUrl: string | null = null;

  // Upload image using Laravel signed URL (if provided)
  if (image?.uri) {
    try {
      if (__DEV__) {
        console.log('[consultation] getting signed URL for image upload', { imageUri: image.uri });
      }

      // Step 1: Get signed URL from Laravel
      const signedUrlResponse = await axios.post(
        `${BASE_URL}/api/customer/consultations/upload-url`,
        {
          content_type: 'image/jpeg',
          expires_in_seconds: 900, // 15 minutes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Response structure: { status, code, message, data: { upload_url, storage_path, download_url, headers, expires_at } }
      const responseData = signedUrlResponse.data?.data;
      if (!responseData) {
        throw new Error('Invalid signed URL response: missing data');
      }

      const { upload_url, download_url, storage_path, headers: uploadHeaders } = responseData;

      if (!upload_url || !storage_path) {
        throw new Error('Invalid signed URL response: missing upload_url or storage_path');
      }

      if (__DEV__) {
        // Log full URL to debug signature issues (truncate for security)
        // Extract query parameter keys manually from URL string
        const queryParams: string[] = [];
        const queryIndex = upload_url.indexOf('?');
        if (queryIndex !== -1) {
          const searchString = upload_url.substring(queryIndex + 1);
          const pairs = searchString.split('&');
          for (const pair of pairs) {
            const key = pair.split('=')[0];
            if (key && !queryParams.includes(key)) {
              queryParams.push(key);
            }
          }
        }
        console.log('[consultation] got signed URL, uploading image...', {
          uploadUrl: upload_url.substring(0, 100) + '...',
          hasHeaders: !!uploadHeaders,
          headers: uploadHeaders,
          storagePath: responseData.storage_path,
          signedUrlQueryParams: queryParams, // Shows which params are in the signed URL
          fullUrlLength: upload_url.length,
        });
      }

      // Step 2: Upload image to signed URL
      // Use headers from response (e.g., { "Content-Type": "image/jpeg" })
      await uploadImageToSignedUrl(image.uri, upload_url, uploadHeaders || {});

      // Step 3: Store storage_path (required) and download_url (optional) for consultation creation
      imageStoragePath = storage_path;
      imagePublicUrl = download_url || null;

      if (__DEV__) {
        console.log('[consultation] image uploaded successfully', {
          storagePath: imageStoragePath,
          downloadUrl: imagePublicUrl?.substring(0, 80) + '...',
        });
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[consultation] failed to upload image:', error);
      }
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to upload image. Please try again.'
      );
    }
  }

  // Step 3: Create consultation with image_storage_path (required) and optionally image_public_url
  const requestData: {
    problem_description: string;
    image_storage_path?: string;
    image_public_url?: string;
  } = {
    problem_description,
  };

  if (imageStoragePath) {
    requestData.image_storage_path = imageStoragePath;
    // Optionally include public URL (API can generate it if not provided)
    if (imagePublicUrl) {
      requestData.image_public_url = imagePublicUrl;
    }
  }

  if (__DEV__) {
    console.log('[consultation] creating consultation request', {
      hasImage: !!imageStoragePath,
      storagePath: imageStoragePath,
    });
  }

  try {
    const res = await axios.post(`${BASE_URL}/api/customer/consultations/create`, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
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
