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