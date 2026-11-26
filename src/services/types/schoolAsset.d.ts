// School Asset Types

export interface SchoolAsset {
  schoolCode: string;
  schoolId: string;
  logoPath: string | null;
  principalSignaturePath: string | null;
  schoolStampPath: string | null;
  createdAt: string;
  updatedAt: string;
  // For joined queries
  schoolName?: string;
}

export interface SchoolAssetUploadRequest {
  schoolCode: string;
  assetType: 'logo' | 'principal_signature' | 'school_stamp';
  file: File;
}

export interface SchoolAssetUploadResponse {
  status: string;
  message: string;
  data: {
    schoolCode: string;
    schoolId: string;
    logoPath: string | null;
    principalSignaturePath: string | null;
    schoolStampPath: string | null;
    createdAt: string;
    updatedAt: string;
    uploadedAsset: string;
    filePath: string;
  };
}

export interface SchoolAssetResponse {
  status: string;
  data: SchoolAsset | null;
}

/**
 * The file that was live until it was replaced, deleted or written over by a
 * restore. School Assets lists the newest ten of each asset and can put one back.
 */
export interface SchoolAssetVersion {
  versionId: string;
  assetType: 'logo' | 'principal_signature' | 'school_stamp';
  reason: 'replaced' | 'deleted' | 'restored_over';
  replacedAt: string;
  replacedByName: string | null;
  contentType: string | null;
  byteSize: number | null;
  /** A link to the image that works for ten minutes; null when it couldn't be made. */
  previewUrl: string | null;
}

export interface SchoolAssetVersionsResponse {
  status: string;
  data: SchoolAssetVersion[];
}

export interface SchoolAssetRestoreResponse {
  status: string;
  message: string;
  data: SchoolAsset & { restoredAsset: string; filePath: string };
}

export interface SchoolAssetsListResponse {
  status: string;
  data: SchoolAsset[];
}

export interface SignedUrlResponse {
  status: string;
  data: {
    signedUrl: string;
    expiresIn: number;
  };
}

export interface FolderUrlResponse {
  status: string;
  data: {
    baseUrl: string;
    schoolFolder: string;
    fullPath: string;
    expiresIn: null;
  };
}

export interface DeleteAssetResponse {
  status: string;
  message: string;
  data: SchoolAsset;
}

export type AssetType = 'logo' | 'principal_signature' | 'school_stamp';