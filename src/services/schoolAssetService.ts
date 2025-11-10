// File: src/services/schoolAssetService.ts

import apiClient from './apiClient';
import type {
  SchoolAssetResponse,
  SchoolAssetsListResponse,
  SchoolAssetUploadResponse,
  SignedUrlResponse,
  FolderUrlResponse,
  DeleteAssetResponse,
  AssetType
} from './types/schoolAsset';

// URL Cache for public bucket URLs (cache for 1 hour since they don't change)
interface UrlCache {
  baseUrl: string;
  schoolFolder: string;
  fullPath: string;
  cachedAt: number;
}

const urlCache = new Map<string, UrlCache>();

/**
 * Clear URL cache for a specific school (used after upload/delete operations)
 */
export const clearSchoolUrlCache = (schoolCode: string) => {
  urlCache.delete(schoolCode);
};

/**
 * GET /school-assets/school-code/:schoolCode
 * Get school assets by school code
 */
export const getSchoolAssetsBySchoolCode = async (
  schoolCode: string
): Promise<SchoolAssetResponse> => {
  return apiClient<SchoolAssetResponse>(
    `/school-assets/school-code/${encodeURIComponent(schoolCode)}`
  );
};

/**
 * GET /school-assets/school-id/:schoolId
 * Get school assets by school ID
 */
export const getSchoolAssetsBySchoolId = async (
  schoolId: string
): Promise<SchoolAssetResponse> => {
  return apiClient<SchoolAssetResponse>(
    `/school-assets/school-id/${encodeURIComponent(schoolId)}`
  );
};

/**
 * GET /school-assets/all
 * Get all schools with their assets (admin view)
 */
export const getAllSchoolsWithAssets = async (): Promise<SchoolAssetsListResponse> => {
  return apiClient<SchoolAssetsListResponse>(`/school-assets/all`);
};

/**
 * POST /school-assets/upload
 * Upload single asset (logo, principal_signature, or school_stamp)
 * Note: This function uses FormData instead of JSON
 */
export const uploadSchoolAsset = async (
  schoolCode: string,
  assetType: AssetType,
  file: File
): Promise<SchoolAssetUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('schoolCode', schoolCode);
  formData.append('assetType', assetType);

  // Get token for authorization
  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };

  const token = getToken();
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const response = await fetch(`${baseURL}/school-assets/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      // Don't set Content-Type for FormData - let browser set it
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json();
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        const { useUserStore } = await import('@/store/useUserStore');
        const { useNotificationStore } = await import('@/store/useNotificationStore');
        useUserStore.getState().clearUser();
        useNotificationStore.getState().showNotification("Your login session has expired, please login again", "error");
        window.location.href = '/';
      }
    }
    
    throw new Error(errorBody.message || 'Upload failed');
  }

  return response.json() as Promise<SchoolAssetUploadResponse>;
};

/**
 * DELETE /school-assets/:schoolId/:assetType
 * Delete specific asset
 */
export const deleteSchoolAsset = async (
  schoolId: string,
  assetType: AssetType
): Promise<DeleteAssetResponse> => {
  return apiClient<DeleteAssetResponse>(
    `/school-assets/${encodeURIComponent(schoolId)}/${encodeURIComponent(assetType)}`,
    {
      method: 'DELETE',
    }
  );
};

/**
 * GET /school-assets/folder-url/:schoolCode
 * Get cached public bucket URL for school assets (1 hour cache)
 */
export const getSchoolAssetsFolderUrl = async (
  schoolCode: string
): Promise<UrlCache | null> => {
  try {
    // Check cache first (cache for 1 hour since public URLs don't change)
    const cached = urlCache.get(schoolCode);
    if (cached && Date.now() - cached.cachedAt < 3600000) { // 1 hour
      return cached;
    }

    // Fetch public bucket URL
    const response = await apiClient<FolderUrlResponse>(
      `/school-assets/folder-url/${encodeURIComponent(schoolCode)}`
    );

    const urlData: UrlCache = {
      baseUrl: response.data.baseUrl,
      schoolFolder: response.data.schoolFolder,
      fullPath: response.data.fullPath,
      cachedAt: Date.now()
    };

    // Cache the URL
    urlCache.set(schoolCode, urlData);
    return urlData;
  } catch (error) {
    console.error('Error getting folder URL:', error);
    return null;
  }
};

/**
 * Build asset URL using cached public bucket URL
 */
export const buildAssetUrl = async (
  schoolCode: string,
  assetPath: string
): Promise<string | null> => {
  try {
    const folderUrl = await getSchoolAssetsFolderUrl(schoolCode);
    if (!folderUrl) return null;

    // Extract filename from full path
    const fileName = assetPath.split('/').pop();
    
    // Add cache busting parameter to prevent browser caching of old images
    const timestamp = Date.now();
    return `${folderUrl.baseUrl}/${folderUrl.schoolFolder}/${fileName}?v=${timestamp}`;
  } catch (error) {
    console.error('Error building asset URL:', error);
    return null;
  }
};

/**
 * GET /school-assets/signed-url?filePath=... (legacy)
 * Get signed URL for asset file
 */
export const getAssetSignedUrl = async (
  filePath: string
): Promise<string | null> => {
  try {
    const response = await apiClient<SignedUrlResponse>(
      `/school-assets/signed-url?filePath=${encodeURIComponent(filePath)}`
    );
    return response.data.signedUrl || null;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};

/**
 * Helper function to get current user's school code from store
 * This assumes you have the school code in your user store
 */
export const getCurrentUserSchoolCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useUserStore } = require('@/store/useUserStore');
    const user = useUserStore.getState().user;
    return user?.school || null;
  } catch (error) {
    console.error('Error getting user school code:', error);
    return null;
  }
};

/**
 * Convenience function to get current user's school assets
 */
export const getCurrentUserSchoolAssets = async (): Promise<SchoolAssetResponse> => {
  const schoolCode = getCurrentUserSchoolCode();
  if (!schoolCode) {
    throw new Error('No school code found for current user');
  }
  return getSchoolAssetsBySchoolCode(schoolCode);
};

/**
 * Convenience function to upload asset for current user's school
 */
export const uploadAssetForCurrentSchool = async (
  assetType: AssetType,
  file: File
): Promise<SchoolAssetUploadResponse> => {
  const schoolCode = getCurrentUserSchoolCode();
  if (!schoolCode) {
    throw new Error('No school code found for current user');
  }
  return uploadSchoolAsset(schoolCode, assetType, file);
};