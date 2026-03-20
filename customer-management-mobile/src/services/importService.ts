import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { ApiResponse, ImportResult } from '../types';

export const importService = {
  /**
   * Upload an Excel file (.xlsx/.xls) and bulk-import customer records.
   * The file must be sent as multipart/form-data with field name "file".
   */
  importCustomers: async (
    fileUri: string,
    fileName: string,
    mimeType: string
  ): Promise<ApiResponse<ImportResult>> => {
    const formData = new FormData();
    // React Native FormData accepts a plain object for file blobs
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    return api.postFormData<ImportResult>(API_ENDPOINTS.CUSTOMERS.IMPORT, formData);
  },
};
