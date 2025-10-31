'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { PhotoIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { 
  getCurrentUserSchoolAssets, 
  uploadAssetForCurrentSchool, 
  deleteSchoolAsset,
  buildAssetUrl,
  getCurrentUserSchoolCode
} from '@/services/schoolAssetService';
import type { AssetType, SchoolAsset } from '@/services/types/schoolAsset';
import { useNotificationStore } from '@/store/useNotificationStore';

interface AssetUpload {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  error: string | null;
  success: boolean;
  existingUrl?: string | null;
}

const SchoolAssetsPage = () => {
  const [assets, setAssets] = useState({
    logo: { file: null, preview: null, uploading: false, error: null, success: false, existingUrl: null } as AssetUpload,
    principal_signature: { file: null, preview: null, uploading: false, error: null, success: false, existingUrl: null } as AssetUpload,
    school_stamp: { file: null, preview: null, uploading: false, error: null, success: false, existingUrl: null } as AssetUpload,
  });

  const [schoolAssets, setSchoolAssets] = useState<SchoolAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const showNotification = useNotificationStore((state) => state.showNotification);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  // Load existing assets on component mount
  const loadSchoolAssets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCurrentUserSchoolAssets();
      const schoolAssetData = response.data;
      setSchoolAssets(schoolAssetData);

      if (schoolAssetData) {
        // Load existing asset URLs using cached folder URL
        const updatedAssets = { ...assets };
        const schoolCode = getCurrentUserSchoolCode();
        
        if (schoolCode) {
          if (schoolAssetData.logoPath) {
            const logoUrl = await buildAssetUrl(schoolCode, schoolAssetData.logoPath);
            updatedAssets.logo.existingUrl = logoUrl;
          }
          
          if (schoolAssetData.principalSignaturePath) {
            const signatureUrl = await buildAssetUrl(schoolCode, schoolAssetData.principalSignaturePath);
            updatedAssets.principal_signature.existingUrl = signatureUrl;
          }
          
          if (schoolAssetData.schoolStampPath) {
            const stampUrl = await buildAssetUrl(schoolCode, schoolAssetData.schoolStampPath);
            updatedAssets.school_stamp.existingUrl = stampUrl;
          }
        }

        setAssets(updatedAssets);
      }
    } catch (error) {
      showNotification('Failed to load school assets', 'error');
      console.error('Error loading school assets:', error);
    } finally {
      setLoading(false);
    }
  }, [assets, showNotification]);
  
  useEffect(() => {
    loadSchoolAssets();
  }, [loadSchoolAssets]);

  const assetConfigs = [
    {
      key: 'logo' as keyof typeof assets,
      title: 'School Logo',
      description: 'Upload your school logo for progress reports and official documents',
      inputRef: logoInputRef,
      acceptedFormats: 'PNG, JPG, JPEG, GIF',
      maxSize: '5MB'
    },
    {
      key: 'principal_signature' as keyof typeof assets,
      title: 'Principal Signature',
      description: 'Upload the principal&apos;s signature for document validation',
      inputRef: signatureInputRef,
      acceptedFormats: 'PNG, JPG, JPEG, GIF',
      maxSize: '5MB'
    },
    {
      key: 'school_stamp' as keyof typeof assets,
      title: 'School Stamp',
      description: 'Upload the official school stamp or seal',
      inputRef: stampInputRef,
      acceptedFormats: 'PNG, JPG, JPEG, GIF',
      maxSize: '5MB'
    }
  ];

  const handleFileSelect = (assetType: keyof typeof assets, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setAssets(prev => ({
        ...prev,
        [assetType]: {
          ...prev[assetType],
          error: 'Invalid file type. Please select a PNG, JPG, JPEG, or GIF file.',
          success: false
        }
      }));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAssets(prev => ({
        ...prev,
        [assetType]: {
          ...prev[assetType],
          error: 'File size too large. Please select a file smaller than 5MB.',
          success: false
        }
      }));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAssets(prev => ({
        ...prev,
        [assetType]: {
          ...prev[assetType],
          file,
          preview: e.target?.result as string,
          error: null,
          success: false
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (assetType: keyof typeof assets) => {
    const asset = assets[assetType];
    if (!asset.file) return;

    setAssets(prev => ({
      ...prev,
      [assetType]: {
        ...prev[assetType],
        uploading: true,
        error: null,
        success: false
      }
    }));

    try {
      await uploadAssetForCurrentSchool(assetType as AssetType, asset.file);
      
      setAssets(prev => ({
        ...prev,
        [assetType]: {
          file: null,
          preview: null,
          uploading: false,
          success: true,
          error: null,
          existingUrl: null
        }
      }));

      // Clear file input
      const inputRef = assetConfigs.find(config => config.key === assetType)?.inputRef;
      if (inputRef?.current) {
        inputRef.current.value = '';
      }

      showNotification(`${assetConfigs.find(c => c.key === assetType)?.title} uploaded successfully!`, 'success');
      
      // Reload assets to get the new uploaded file
      await loadSchoolAssets();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setAssets(prev => ({
        ...prev,
        [assetType]: {
          ...prev[assetType],
          uploading: false,
          error: errorMessage,
          success: false
        }
      }));
      showNotification(`Failed to upload ${assetConfigs.find(c => c.key === assetType)?.title}`, 'error');
    }
  };

  const handleRemove = (assetType: keyof typeof assets) => {
    setAssets(prev => ({
      ...prev,
      [assetType]: {
        file: null,
        preview: null,
        uploading: false,
        error: null,
        success: false
      }
    }));

    // Clear file input
    const inputRef = assetConfigs.find(config => config.key === assetType)?.inputRef;
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
  };

  const handleDelete = async (assetType: keyof typeof assets) => {
    if (!schoolAssets?.schoolId) {
      showNotification('School ID not found', 'error');
      return;
    }

    try {
      await deleteSchoolAsset(schoolAssets.schoolId, assetType as AssetType);
      showNotification(`${assetConfigs.find(c => c.key === assetType)?.title} deleted successfully!`, 'success');
      
      // Reload assets to reflect the deletion
      await loadSchoolAssets();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      showNotification(`Failed to delete ${assetConfigs.find(c => c.key === assetType)?.title}: ${errorMessage}`, 'error');
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-32 lg:pt-40 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">School Assets</h1>
            <p className="text-gray-600">
              Upload and manage your school&apos;s branding assets that will appear on progress reports and official documents.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              <span className="ml-3 text-gray-600">Loading school assets...</span>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {assetConfigs.map((config) => {
                const asset = assets[config.key];
                
                return (
                  <div key={config.key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Accepted formats: {config.acceptedFormats} &bull; Max size: {config.maxSize}
                      </p>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div className="mb-4">
                    <input
                      ref={config.inputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(config.key, e)}
                      className="hidden"
                      id={`${config.key}-input`}
                    />
                    
                    {!asset.preview && !asset.existingUrl ? (
                      <label
                        htmlFor={`${config.key}-input`}
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">{config.acceptedFormats} (MAX. {config.maxSize})</p>
                        </div>
                      </label>
                    ) : (
                      <div className="relative">
                        <Image
                          src={asset.preview || asset.existingUrl || ''}
                          alt={`${config.title} ${asset.preview ? 'preview' : 'current'}`}
                          className="w-full h-32 object-contain bg-gray-50 rounded-lg border"
                          width={400}
                          height={128}
                          unoptimized={true}
                        />
                        <button
                          onClick={() => asset.preview ? handleRemove(config.key) : handleDelete(config.key)}
                          className="cursor-pointer absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title={asset.preview ? 'Remove preview' : 'Delete asset'}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        {asset.existingUrl && !asset.preview && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                            Current
                          </div>
                        )}
                        {asset.preview && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                            Preview
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Messages */}
                  {asset.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-400 mr-2" />
                        <span className="text-sm text-red-700">{asset.error}</span>
                      </div>
                    </div>
                  )}

                  {asset.success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-sm text-green-700">
                          {config.title} uploaded successfully!
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {asset.file && (
                      <button
                        onClick={() => handleUpload(config.key)}
                        disabled={asset.uploading}
                        className="cursor-pointer flex-1 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {asset.uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                    
                    <label
                      htmlFor={`${config.key}-input`}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 cursor-pointer text-center transition-colors"
                    >
                      {asset.preview ? 'Change File' : 'Select File'}
                    </label>

                    {asset.existingUrl && !asset.preview && (
                      <button
                        onClick={() => handleDelete(config.key)}
                        className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete Current
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How These Assets Are Used</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• <strong>School Logo:</strong> Appears in the header of progress reports next to the school name</li>
              <li>• <strong>Principal Signature:</strong> Displayed in the footer of progress reports for document validation</li>
              <li>• <strong>School Stamp:</strong> Added to progress reports as an official seal or verification mark</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
};

export default SchoolAssetsPage;