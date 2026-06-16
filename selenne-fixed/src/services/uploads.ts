import { postForm, getAccessToken } from './api';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Upload a proof of payment (comprobante) file for an order or payment
 * @param file - The file to upload (PDF, image, etc.)
 * @param orderId - Optional order ID to associate with the upload
 * @param onProgress - Optional callback for upload progress
 * @returns Object with file URL and response data from backend
 */
export async function uploadComprobante(
  file: File,
  orderId?: string | number,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; data: any }> {
  const form = new FormData();
  form.append('file', file);
  if (orderId) form.append('orderId', String(orderId));

  // XMLHttpRequest for progress tracking
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress({ loaded: e.loaded, total: e.total, percent });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve({
              url: result.url || result.fileUrl || result.comprobantePath,
              data: result,
            });
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      // Set Authorization header if token exists
      const token = getAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      const endpoint = `/api/pedidos/upload-comprobante${orderId ? `/${orderId}` : ''}`;
      xhr.open('POST', apiBase + endpoint);
      xhr.withCredentials = true;
      xhr.send(form);
    });
  }

  // Fallback: use postForm without progress tracking
  const result = await postForm(
    `/api/pedidos/upload-comprobante${orderId ? `/${orderId}` : ''}`,
    form
  );
  return {
    url: result?.url || result?.fileUrl || result?.comprobantePath,
    data: result,
  };
}

/**
 * Upload a profile picture or product image
 * @param file - The file to upload
 * @param endpoint - API endpoint (e.g., '/api/usuarios/upload-avatar', '/api/productos/upload-image')
 * @param onProgress - Optional progress callback
 * @returns Object with image URL and response data
 */
export async function uploadImage(
  file: File,
  endpoint: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; data: any }> {
  const form = new FormData();
  form.append('file', file);

  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress({ loaded: e.loaded, total: e.total, percent });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve({
              url: result.url || result.imageUrl || result.imagePath,
              data: result,
            });
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      const token = getAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.open('POST', apiBase + endpoint);
      xhr.withCredentials = true;
      xhr.send(form);
    });
  }

  const result = await postForm(endpoint, form);
  return {
    url: result?.url || result?.imageUrl || result?.imagePath,
    data: result,
  };
}

export default { uploadComprobante, uploadImage };
