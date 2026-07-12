'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  getAgendasBySchool,
  createAgenda,
  cloneAgenda,
  deleteAgenda,
} from '@/services/agendaService';
import type { AgendaPayload, AgendaStatus } from '@/services/types/agenda';
import {
  BookOpenIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const STATUS_STYLES: Record<AgendaStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  generating: 'bg-amber-100 text-amber-700',
  generated: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
};

const buildYearOptions = (): string[] => {
  const now = new Date();
  const baseYear = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return [0, 1, 2].map((offset) => `${baseYear + offset}-${baseYear + offset + 1}`);
};

const AgendasPage = () => {
  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore((state) => state.showNotification);

  const [agendas, setAgendas] = useState<AgendaPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<AgendaPayload | null>(null);
  const [selectedYear, setSelectedYear] = useState(buildYearOptions()[0]);
  const [busy, setBusy] = useState(false);

  const fetchAgendas = useCallback(async () => {
    if (!user?.school) return;
    setLoading(true);
    try {
      const response = await getAgendasBySchool(user.school);
      setAgendas(response.data);
    } catch (error) {
      console.error('Error fetching agendas:', error);
      showNotification('Failed to load agendas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.school, showNotification]);

  useEffect(() => {
    fetchAgendas();
  }, [fetchAgendas]);

  const handleCreate = async () => {
    if (!user?.school) return;
    setBusy(true);
    try {
      if (cloneSource) {
        const response = await cloneAgenda(cloneSource.agendaId, selectedYear);
        showNotification(
          response.data.calendarEventCount === 0
            ? `Agenda cloned. No calendar events exist for ${selectedYear} yet — add them before generating.`
            : 'Agenda cloned from previous year',
          'success'
        );
      } else {
        await createAgenda({ school: user.school, academicYear: selectedYear });
        showNotification('Agenda created', 'success');
      }
      setCreateOpen(false);
      setCloneSource(null);
      fetchAgendas();
    } catch (error) {
      console.error('Error creating agenda:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to create agenda', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (agenda: AgendaPayload) => {
    if (!window.confirm(`Delete the ${agenda.academicYear} agenda? Uploaded pages will be removed.`)) return;
    try {
      await deleteAgenda(agenda.agendaId);
      showNotification('Agenda deleted', 'success');
      fetchAgendas();
    } catch (error) {
      console.error('Error deleting agenda:', error);
      showNotification('Failed to delete agenda', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Agenda Editor</h1>
              <p className="text-slate-500 mt-1">
                Compose the yearly student agenda: upload custom pages, arrange months, export a print-ready PDF.
              </p>
            </div>
            <button
              onClick={() => { setCloneSource(null); setCreateOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" /> New Agenda
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
              Loading agendas…
            </div>
          ) : agendas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <BookOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No agendas yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Create your first agenda to start composing the student agenda book.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendas.map((agenda) => (
                <div
                  key={agenda.agendaId}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4"
                >
                  <div className="bg-indigo-500 p-3 rounded-xl text-white">
                    <BookOpenIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {agenda.title} {agenda.academicYear}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[agenda.status]}`}>
                        {agenda.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {agenda.generatedPageCount
                        ? `${agenda.generatedPageCount} pages · last generated ${agenda.generatedAt ? new Date(agenda.generatedAt).toLocaleDateString() : ''}`
                        : 'Not generated yet'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setCloneSource(agenda); setCreateOpen(true); }}
                    title="Clone into a new school year"
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(agenda)}
                    title="Delete agenda"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <Link
                    href={`/admin-panel/agendas/${agenda.agendaId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl"
                  >
                    Open <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create / clone modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {cloneSource ? `Clone ${cloneSource.academicYear} agenda` : 'New Agenda'}
            </h2>
            {cloneSource && (
              <p className="text-sm text-slate-500">
                Copies all custom pages and quotes. Calendar grids and weekly dates regenerate
                automatically for the new year.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">School year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {buildYearOptions().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setCreateOpen(false); setCloneSource(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={busy}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Working…' : cloneSource ? 'Clone Agenda' : 'Create Agenda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgendasPage;
