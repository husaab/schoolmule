'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { SheetShare, SheetTarget, ShareRole } from '@/services/types/googleSheets';

interface Props {
  target: SheetTarget;
}

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', writer: 'Editor', reader: 'Viewer' };

/** Who a permission is for. Link- and domain-wide shares are shown, not hidden:
 *  a list captioned "Shared with" that omitted them would be misleading. */
const whoLabel = (share: SheetShare) => {
  if (share.type === 'anyone') return 'Anyone with the link';
  if (share.type === 'domain') return 'Everyone in the organization';
  return share.email || share.displayName || 'Unknown';
};

/**
 * Who the linked spreadsheet is shared with, and a way to add or remove people.
 *
 * These are real Drive permissions on the connected account's file — the same
 * thing the Share button in Google Sheets does — so whoever is added can see
 * every tab, including the school's own columns.
 */
export default function SheetSharing({ target }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [shares, setShares] = useState<SheetShare[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('writer');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await target.listShares();
      setShares(res.data.shares);
      setError(null);
    } catch (err) {
      setShares([]);
      setError((err as Error).message || 'Could not load who this sheet is shared with');
    }
  }, [target]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await target.addShare(trimmed, role);
      showNotification(`Shared with ${trimmed}`, 'success');
      setEmail('');
      await load();
    } catch (err) {
      showNotification((err as Error).message || 'Could not share the sheet', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (share: SheetShare) => {
    if (!confirm(`Remove ${share.email || 'this person'}'s access to the sheet?`)) return;
    setRemovingId(share.id);
    try {
      await target.removeShare(share.id);
      showNotification('Access removed', 'success');
      await load();
    } catch (err) {
      showNotification((err as Error).message || 'Could not remove access', 'error');
    } finally {
      setRemovingId(null);
    }
  };


  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-800">Shared with</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Anyone added here can open the whole spreadsheet, every tab included. Google emails them a link.
        </p>
      </div>

      {shares === null ? (
        <p className="text-xs text-slate-400">Loading…</p>
      ) : error ? (
        <p className="text-xs text-amber-700">{error}</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {(shares || []).map((share) => {
            const locked = share.isOwner || share.isConnectedAccount;
            return (
              <li key={share.id} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 truncate">{whoLabel(share)}</p>
                  {share.type === 'user' && share.displayName && share.email && (
                    <p className="text-xs text-slate-400 truncate">{share.displayName}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {ROLE_LABEL[share.role] || share.role}
                  {share.isConnectedAccount && !share.isOwner ? ' · SchoolMule' : ''}
                </span>
                {!locked && (
                  <button
                    type="button"
                    onClick={() => handleRemove(share)}
                    disabled={removingId === share.id}
                    title="Remove access"
                    className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as ShareRole)}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Role"
        >
          <option value="writer">Editor</option>
          <option value="reader">Viewer</option>
        </select>
        <button
          type="submit"
          disabled={adding || !email.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50 cursor-pointer"
        >
          <UserPlusIcon className="h-4 w-4" />
          {adding ? 'Sharing…' : 'Share'}
        </button>
      </form>
    </div>
  );
}
