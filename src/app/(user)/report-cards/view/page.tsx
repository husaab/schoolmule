'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUserStore } from '@/store/useUserStore';
import { EyeIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getGeneratedReportCards, getSignedReportCardUrl } from '@/services/reportCardService';
import ReportCardViewerModal from '@/components/report-cards/view/reportCardViewerModal';
import ReportCardDeleteModal from '@/components/report-cards/delete/reportCardDeleteModal';
import { getTermsBySchool } from '@/services/termService';
import { TermPayload } from '@/services/types/term';
import { useNotificationStore } from '@/store/useNotificationStore';

type ReportCardRow = {
  student_id: string;
  student_name: string;
  file_path: string;
  generated_at: string;
  grade: string;
};

export default function ViewReportCardsPage() {
  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore(state => state.showNotification);
  const [reportCards, setReportCards] = useState<ReportCardRow[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [terms, setTerms] = useState<TermPayload[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [term, setTerm] = useState<string>('');
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<ReportCardRow | null>(null);

  // Fetch terms when component mounts
  useEffect(() => {
    if (user.school) {
      setLoadingTerms(true);
      getTermsBySchool(user.school).then((res) => {
        if (res.status === 'success') {
          setTerms(res.data);
          
          // Set default term to active term
          if (user.activeTerm) {
            setTerm(user.activeTerm);
          } else {
            // Find active term from the list
            const activeTerm = res.data.find(t => t.isActive);
            if (activeTerm) {
              setTerm(activeTerm.name);
            } else if (res.data.length > 0) {
              // Fallback to first term if no active term
              setTerm(res.data[0].name);
            }
          }
        } else {
          showNotification('Failed to load terms', 'error');
        }
      }).catch(err => {
        console.error('Error fetching terms:', err);
        showNotification('Error loading terms', 'error');
      }).finally(() => {
        setLoadingTerms(false);
      });
    }
  }, [user.school, user.activeTerm, showNotification]);

  // Fetch report cards when term is selected
  useEffect(() => {
    if (user.school && term) {
      getGeneratedReportCards(term, user.school).then((res) => {
        if (res.status === 'success') {
          setReportCards(res.data);
        }
      });
    }
  }, [user.school, term]);

  const groupedByGrade = reportCards.reduce((acc, student) => {
    const grade = `Grade ${student.grade ?? '-'}`;
    acc[grade] = acc[grade] || [];
    acc[grade].push(student);
    return acc;
  }, {} as Record<string, ReportCardRow[]>);

  const hasAnyReportCards = Object.values(groupedByGrade).some((students) => students.length > 0);

  const handlePreview = async (filePath: string) => {
    if (signedUrls[filePath]) {
      setViewingUrl(signedUrls[filePath]);
      return;
    }

    const result = await getSignedReportCardUrl(filePath);
    if (result) {
      setSignedUrls((prev) => ({ ...prev, [filePath]: result }));
      setViewingUrl(result);
    }
  };

  const handleDownload = async (filePath: string) => {
    let url = signedUrls[filePath];

    if (!url) {
      const result = await getSignedReportCardUrl(filePath);
      if (!result) return;
      setSignedUrls((prev) => ({ ...prev, [filePath]: result }));
      url = result;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filePath.split('/').pop() || 'report-card.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl); // Clean up
    } catch (error) {
      console.error('Failed to download report card:', error);
    }
  };

  const openDeleteModal = (student: ReportCardRow) => {
    setSelectedForDelete(student);
    setDeleteModalOpen(true);
  };


  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">View Report Cards</h1>
          <p className="text-gray-600 mt-2">View, download, and manage generated report cards</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Select term:</label>
                  {loadingTerms ? (
                    <p className="text-gray-600">Loading terms...</p>
                  ) : (
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full border border-gray-300 text-black rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="" disabled>Select term</option>
                      {terms.map((t) => (
                        <option key={t.termId} value={t.name}>
                          {t.name} ({t.academicYear})
                          {t.isActive && ' - Active'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by grade:</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full text-black border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- All Grades --</option>
                    {Object.keys(groupedByGrade)
                      .sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                      .map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                  </select>
                </div>
              </div>

              {selectedGrade && (
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Showing {groupedByGrade[selectedGrade]?.length || 0} report cards for {selectedGrade}
                  </span>
                  <button
                    onClick={() => setSelectedGrade('')}
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Report Cards Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {!hasAnyReportCards ? (
              <div className="text-center text-gray-500 py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">No report cards found</p>
                <p className="text-sm">No report cards have been generated for this term.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedByGrade)
                  .sort(([a], [b]) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                  .map(([grade, students]) => {
                    const collapsed = selectedGrade && grade !== selectedGrade;
                    if (!selectedGrade || !collapsed) {
                      return (
                        <div key={grade} className="space-y-2">
                          {/* Grade header */}
                          <div className="flex items-center justify-between px-4 py-2 bg-cyan-600 text-white rounded-lg">
                            <span className="font-semibold text-lg">{grade}</span>
                            <span className="text-sm">{students.length} report cards</span>
                          </div>

                          {/* Student cards */}
                          <div className="space-y-2">
                            {students.map((student) => (
                              <div
                                key={student.student_id}
                                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{student.student_name}</p>
                                  <p className="text-gray-600 text-sm">
                                    Generated: {new Date(student.generated_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => handlePreview(student.file_path)}
                                    title="View PDF"
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <EyeIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDownload(student.file_path)}
                                    title="Download PDF"
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(student)}
                                    title="Delete Report Card"
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
              </div>
            )}
          </div>
        </div>
      </main>

      {viewingUrl && (
        <ReportCardViewerModal url={viewingUrl} onClose={() => setViewingUrl(null)} />
      )}
      {deleteModalOpen && selectedForDelete && (
        <ReportCardDeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          studentName={selectedForDelete.student_name}
          filePath={selectedForDelete.file_path}
          onDeleted={(filePath: string) => {
            setReportCards((prev) => prev.filter((r) => r.file_path !== filePath));
            setSignedUrls((prev) => {
              const copy = { ...prev };
              delete copy[filePath];
              return copy;
            });
            setDeleteModalOpen(false);
          }}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
      `}</style>
    </>
  );
}
