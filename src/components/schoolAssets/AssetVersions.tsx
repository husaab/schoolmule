'use client';

// The earlier versions of one school asset (logo, principal signature or
// stamp), under its card on School Assets. Replacing or deleting an asset
// keeps the old file as a version; this lists them and puts one back. A
// restore keeps the file it replaces as a version too, so it can be undone
// the same way. Renders nothing while there are none.

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowUturnLeftIcon, ChevronDownIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { getSchoolAssetVersions, restoreSchoolAssetVersion } from '@/services/schoolAssetService';
import type { AssetType, SchoolAssetVersion } from '@/services/types/schoolAsset';
import { versionCaption, versionSize, versionsHeading } from '@/lib/schoolAssetVersions';
import { useNotificationStore } from '@/store/useNotificationStore';

interface AssetVersionsProps {
  schoolId: string;
  assetType: AssetType;
  /** The asset's name as the page shows it ("School Stamp"). */
  title: string;
  /** Changes whenever the asset was uploaded, deleted or restored. */
  refreshKey: number;
  onRestored: () => void | Promise<void>;
}

const AssetVersions: React.FC<AssetVersionsProps> = ({ schoolId, assetType, title, refreshKey, onRestored }) => {
  const [versions, setVersions] = useState<SchoolAssetVersion[]>([]);
  const [open, setOpen] = useState(false);
  // The version waiting for "Yes, restore", and the one being restored.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    let current = true;
    getSchoolAssetVersions(schoolId, assetType)
      .then((response) => {
        if (current) setVersions(response.data ?? []);
      })
      .catch(() => {
        // The list is an extra: without it the card works as it always did.
        if (current) setVersions([]);
      });
    return () => {
      current = false;
    };
  }, [schoolId, assetType, refreshKey]);

  if (versions.length === 0) return null;

  const restore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      await restoreSchoolAssetVersion(schoolId, assetType, versionId);
      setConfirming(null);
      await onRestored();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Try again.';
      showNotification(`${title} couldn't be restored. ${reason}`, 'error');
    } finally {
      setRestoring(null);
    }
  };

  const listId = `${assetType}-versions`;

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={listId}
        className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800"
      >
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        {versionsHeading(versions.length)}
      </button>

      {open && (
        <ul id={listId} className="mt-3 space-y-2">
          {versions.map((version) => {
            const size = versionSize(version.byteSize);
            const busy = restoring === version.versionId;
            return (
              <li key={version.versionId} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                {version.previewUrl ? (
                  <Image
                    src={version.previewUrl}
                    alt={`${title}: an earlier version`}
                    className="h-14 w-20 shrink-0 rounded border border-gray-200 bg-white object-contain"
                    width={80}
                    height={56}
                    unoptimized={true}
                  />
                ) : (
                  <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-gray-300">
                    <PhotoIcon className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">{versionCaption(version)}</p>
                  {size && <p className="text-xs text-gray-500">{size}</p>}
                </div>
                {confirming === version.versionId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Use this one on new reports?</span>
                    <button
                      type="button"
                      onClick={() => void restore(version.versionId)}
                      disabled={busy}
                      className="cursor-pointer rounded-md bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-400"
                    >
                      {busy ? 'Restoring…' : 'Yes, restore'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      disabled={busy}
                      className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(version.versionId)}
                    disabled={restoring !== null}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                    Restore
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AssetVersions;
