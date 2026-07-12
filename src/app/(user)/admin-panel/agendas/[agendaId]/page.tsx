'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import AgendaOutline, { type SlotId } from '@/components/agenda/AgendaOutline';
import AgendaLivePreview from '@/components/agenda/AgendaLivePreview';
import CustomPageUploadModal from '@/components/agenda/CustomPageUploadModal';
import GeneratePanel from '@/components/agenda/GeneratePanel';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  getAgendaById,
  getAgendaManifest,
  reorderAgendaPages,
  renameAgendaPage,
  deleteAgendaPage,
  updateAgendaMonth,
  updateAgenda,
} from '@/services/agendaService';
import type {
  AgendaDetailPayload,
  AgendaManifestPayload,
  AgendaAnchor,
} from '@/services/types/agenda';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const AgendaEditorPage = () => {
  const params = useParams<{ agendaId: string }>();
  const agendaId = params.agendaId;
  const showNotification = useNotificationStore((state) => state.showNotification);

  const [agenda, setAgenda] = useState<AgendaDetailPayload | null>(null);
  const [manifest, setManifest] = useState<AgendaManifestPayload | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadSlot, setUploadSlot] = useState<SlotId | null>(null);
  const [jumpToSeq, setJumpToSeq] = useState<number | null>(null);
  const [footerDraft, setFooterDraft] = useState<string | null>(null);

  const fetchAll = useCallback(async (bumpPreview: boolean) => {
    try {
      const [detail, manifestResponse] = await Promise.all([
        getAgendaById(agendaId),
        getAgendaManifest(agendaId),
      ]);
      setAgenda(detail.data);
      setManifest(manifestResponse.data);
      if (bumpPreview) setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Error loading agenda:', error);
      showNotification('Failed to load agenda', 'error');
    }
  }, [agendaId, showNotification]);

  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  // Months in book order (Sept..June) derived from the manifest, falling
  // back to the default sequence before it loads.
  const monthOptions = useMemo(() => {
    if (manifest) {
      const seen: number[] = [];
      for (const item of manifest.items) {
        if (item.kind !== 'custom' && item.month !== undefined && !seen.includes(item.month)) {
          seen.push(item.month);
        }
      }
      if (seen.length > 0) return seen;
    }
    return [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  }, [manifest]);

  const handleReorderSlot = async (slot: SlotId, orderedPageIds: string[]) => {
    if (!agenda) return;
    // Optimistic local update
    setAgenda({
      ...agenda,
      customPages: agenda.customPages.map((page) => {
        const index = orderedPageIds.indexOf(page.pageId);
        return index >= 0 ? { ...page, sortOrder: index } : page;
      }),
    });
    try {
      await reorderAgendaPages(
        agendaId,
        orderedPageIds.map((pageId, index) => ({
          pageId,
          anchor: slot.anchor,
          anchorMonth: slot.anchorMonth,
          sortOrder: index,
        }))
      );
      fetchAll(true);
    } catch (error) {
      console.error('Error reordering pages:', error);
      showNotification('Failed to save the new order', 'error');
      fetchAll(false);
    }
  };

  const handleMovePage = async (pageId: string, anchor: AgendaAnchor, anchorMonth: number | null) => {
    if (!agenda) return;
    const targetSlotPages = agenda.customPages.filter(
      (p) => p.anchor === anchor && (p.anchorMonth ?? null) === anchorMonth && p.pageId !== pageId
    );
    try {
      await reorderAgendaPages(agendaId, [
        { pageId, anchor, anchorMonth, sortOrder: targetSlotPages.length },
      ]);
      fetchAll(true);
    } catch (error) {
      console.error('Error moving page:', error);
      showNotification('Failed to move the page', 'error');
    }
  };

  const handleRenamePage = async (pageId: string, title: string) => {
    if (!agenda) return;
    // Optimistic update — a rename doesn't change page flow, no preview flush
    setAgenda({
      ...agenda,
      customPages: agenda.customPages.map((p) =>
        p.pageId === pageId ? { ...p, title } : p
      ),
    });
    try {
      await renameAgendaPage(agendaId, pageId, title);
    } catch (error) {
      console.error('Error renaming page:', error);
      showNotification('Failed to rename the page', 'error');
      fetchAll(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!window.confirm('Remove this page from the agenda?')) return;
    try {
      await deleteAgendaPage(agendaId, pageId);
      showNotification('Page removed', 'success');
      fetchAll(true);
    } catch (error) {
      console.error('Error deleting page:', error);
      showNotification('Failed to remove the page', 'error');
    }
  };

  const handleSaveQuotes = async (month: number, quotes: string[]) => {
    try {
      await updateAgendaMonth(agendaId, month, quotes);
      showNotification('Quotes saved', 'success');
      fetchAll(true);
    } catch (error) {
      console.error('Error saving quotes:', error);
      showNotification('Failed to save quotes', 'error');
    }
  };

  const handleSaveFooter = async () => {
    if (footerDraft === null || !agenda) return;
    try {
      await updateAgenda(agendaId, { footerText: footerDraft });
      setFooterDraft(null);
      showNotification('Footer updated', 'success');
      fetchAll(true);
    } catch (error) {
      console.error('Error updating footer:', error);
      showNotification('Failed to update footer', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin-panel/agendas"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
            >
              <ArrowLeftIcon className="w-4 h-4" /> All agendas
            </Link>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {agenda ? `${agenda.title} ${agenda.academicYear}` : 'Loading…'}
                </h1>
                {manifest && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {manifest.totalPages} pages · dates regenerate automatically for {agenda?.academicYear}
                  </p>
                )}
              </div>
              {agenda && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={footerDraft ?? agenda.footerText ?? ''}
                    onChange={(e) => setFooterDraft(e.target.value)}
                    placeholder="Footer: School Name | www.website.ca"
                    className="w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {footerDraft !== null && footerDraft !== (agenda.footerText ?? '') && (
                    <button
                      onClick={handleSaveFooter}
                      className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                    >
                      Save
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {agenda && (
            <div className="mb-6">
              <GeneratePanel agenda={agenda} onStatusChange={() => fetchAll(false)} />
            </div>
          )}

          {/* Editor: outline left, live preview right */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-2">
              {agenda ? (
                <AgendaOutline
                  agenda={agenda}
                  manifest={manifest}
                  monthOptions={monthOptions}
                  onReorderSlot={handleReorderSlot}
                  onMovePage={handleMovePage}
                  onRenamePage={handleRenamePage}
                  onDeletePage={handleDeletePage}
                  onAddPage={(slot) => setUploadSlot(slot)}
                  onSaveQuotes={handleSaveQuotes}
                  onJumpToSeq={setJumpToSeq}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
                  Loading…
                </div>
              )}
            </div>

            <div className="xl:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:sticky xl:top-24">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Live preview
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    exactly what prints — including page numbers
                  </span>
                </h3>
                <AgendaLivePreview
                  agendaId={agendaId}
                  manifest={manifest}
                  refreshKey={refreshKey}
                  jumpToSeq={jumpToSeq}
                  onJumpConsumed={() => setJumpToSeq(null)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {uploadSlot && (
        <CustomPageUploadModal
          agendaId={agendaId}
          monthOptions={monthOptions}
          defaultAnchor={uploadSlot.anchor}
          defaultAnchorMonth={uploadSlot.anchorMonth}
          onClose={() => setUploadSlot(null)}
          onUploaded={(sizeWarning) => {
            if (sizeWarning) showNotification(sizeWarning, 'error');
            fetchAll(true);
          }}
        />
      )}
    </>
  );
};

export default AgendaEditorPage;
