'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUserStore } from '@/store/useUserStore';
import { EyeIcon, ArrowDownTrayIcon, TrashIcon, EnvelopeIcon, CheckCircleIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getGeneratedReportCards, getSignedReportCardUrl } from '@/services/reportCardService';
import ReportCardViewerModal from '@/components/report-cards/view/reportCardViewerModal';
import ReportCardDeleteModal from '@/components/report-cards/delete/reportCardDeleteModal';
import BulkDeleteReportCardModal from '@/components/report-cards/delete/bulkDeleteReportCardModal';
import BulkDownloadReportCardModal from '@/components/report-cards/download/bulkDownloadReportCardModal';
import SingleEmailReportCardModal from '@/components/report-cards/email/singleEmailReportCardModal';
import BulkEmailReportCardModal from '@/components/report-cards/email/bulkEmailReportCardModal';
import SentEmailReportCardModal from '@/components/report-cards/email/sent/sentEmailReportCardModal';
import { getTermsBySchool } from '@/services/termService';
import { TermPayload } from '@/services/types/term';
import { useNotificationStore } from '@/store/useNotificationStore';

type ReportCardRow = {
  student_id: string;
  student_name: string;
  file_path: string;
  generated_at: string;
  grade: string;
  term?: string;
  email_sent?: boolean;
  email_sent_at?: string;
  email_sent_by?: string;
};

export default function ViewReportCardsPage() {
  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore(state => state.showNotification);
  const [reportCards, setReportCards] = useState<ReportCardRow[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [collapsedGrades, setCollapsedGrades] = useState<Set<string>>(new Set());
  // When deep-linked from the generate page (?preview=<studentId>), auto-open
  // that student's report card viewer once the cards for the term have loaded.
  const [autoPreviewStudentId, setAutoPreviewStudentId] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermPayload[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [term, setTerm] = useState<string>('');
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<ReportCardRow | null>(null);

  // Bulk delete selection (keyed by file_path, same key the delete API uses)
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDownloadModalOpen, setBulkDownloadModalOpen] = useState(false);

  // Email modal states
  const [selectedForEmail, setSelectedForEmail] = useState<ReportCardRow | null>(null);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [emailDetailsModalOpen, setEmailDetailsModalOpen] = useState(false);
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);

  // Fetch terms when component mounts
  useEffect(() => {
    if (user.school) {
      setLoadingTerms(true);
      getTermsBySchool(user.school).then((res) => {
        if (res.status === 'success') {
          setTerms(res.data);

          // A deep link (?term=...&preview=...) wins over the default term so
          // the requested report card's term is the one that loads.
          const params = new URLSearchParams(window.location.search);
          const queryTerm = params.get('term');
          const previewStudentId = params.get('preview');
          if (previewStudentId) setAutoPreviewStudentId(previewStudentId);

          if (queryTerm) {
            setTerm(queryTerm);
          } else if (user.activeTerm) {
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
      setSelectedFilePaths([]);
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

  // "Select all" operates on the currently-visible cards: when a grade filter
  // is active only that grade is shown, otherwise every grade is shown.
  const visibleReportCards = selectedGrade ? (groupedByGrade[selectedGrade] || []) : reportCards;
  const visibleFilePaths = visibleReportCards.map((r) => r.file_path);
  const allVisibleSelected =
    visibleFilePaths.length > 0 && visibleFilePaths.every((p) => selectedFilePaths.includes(p));

  const toggleGradeCollapse = (grade: string) => {
    setCollapsedGrades(prev => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

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

  // Auto-open the viewer once the deep-linked student's card is available.
  // Runs once per deep link (the id is cleared after opening).
  useEffect(() => {
    if (!autoPreviewStudentId || reportCards.length === 0) return;
    const match = reportCards.find((r) => r.student_id === autoPreviewStudentId);
    if (match) {
      handlePreview(match.file_path);
      setAutoPreviewStudentId(null);
    }
    // handlePreview is stable enough for this one-shot deep-link open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPreviewStudentId, reportCards]);

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

  const toggleCardSelection = (filePath: string) => {
    setSelectedFilePaths((prev) =>
      prev.includes(filePath)
        ? prev.filter((p) => p !== filePath)
        : [...prev, filePath]
    );
  };

  const toggleGradeSelection = (students: ReportCardRow[]) => {
    const gradePaths = students.map((s) => s.file_path);
    const allSelected = gradePaths.every((p) => selectedFilePaths.includes(p));
    setSelectedFilePaths((prev) =>
      allSelected
        ? prev.filter((p) => !gradePaths.includes(p))
        : [...new Set([...prev, ...gradePaths])]
    );
  };

  const toggleSelectAll = () => {
    setSelectedFilePaths((prev) =>
      allVisibleSelected
        ? prev.filter((p) => !visibleFilePaths.includes(p))
        : [...new Set([...prev, ...visibleFilePaths])]
    );
  };

  const handleBulkDeleted = (filePaths: string[]) => {
    setReportCards((prev) => prev.filter((r) => !filePaths.includes(r.file_path)));
    setSignedUrls((prev) => {
      const copy = { ...prev };
      filePaths.forEach((p) => delete copy[p]);
      return copy;
    });
    setSelectedFilePaths([]);
  };

  const handleEmailClick = (student: ReportCardRow) => {
    setSelectedForEmail(student);
    if (student.email_sent) {
      setEmailDetailsModalOpen(true);
    } else {
      setSendEmailModalOpen(true);
    }
  };

  const handleEmailSent = () => {
    // Refresh the report cards list to update email_sent status
    if (user.school && term) {
      getGeneratedReportCards(term, user.school).then((res) => {
        if (res.status === 'success') {
          setReportCards(res.data);
        }
      });
    }
  };

  // Get reports that haven't been emailed yet for bulk email
  const unemailedReports = reportCards.filter(report => !report.email_sent);


  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-24 lg:pt-28 bg-gray-50 min-h-screen p-4 lg:p-10">
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md">
          {/* Card header */}
          <div className="px-6 pt-6 pb-4 text-black border-b border-gray-200">
            <h1 className="text-2xl font-semibold">View Report Cards</h1>
            <p className="text-gray-600 text-sm mt-1">View, download, and manage generated report cards</p>
          </div>
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
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
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      // Hidden rows shouldn't stay silently selected for deletion
                      setSelectedFilePaths([]);
                    }}
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

              {/* Bulk Email Button */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {selectedGrade && (
                    <>
                      <span className="text-sm text-gray-600">
                        Showing {groupedByGrade[selectedGrade]?.length || 0} report cards for {selectedGrade}
                      </span>
                      <button
                        onClick={() => setSelectedGrade('')}
                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {hasAnyReportCards && (
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      {allVisibleSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                  {selectedFilePaths.length > 0 && (
                    <>
                      <button
                        onClick={() => setSelectedFilePaths([])}
                        className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        Clear selection
                      </button>
                      <button
                        onClick={() => setBulkDownloadModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Download Selected ({selectedFilePaths.length})
                      </button>
                      <button
                        onClick={() => setBulkDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer text-sm font-medium"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete Selected ({selectedFilePaths.length})
                      </button>
                    </>
                  )}
                  {unemailedReports.length > 0 && (
                    <button
                      onClick={() => setBulkEmailModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      Bulk Email ({unemailedReports.length})
                    </button>
                  )}
                </div>
              </div>
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
                      const isCollapsed = collapsedGrades.has(grade);
                      return (
                        <div key={grade} className="space-y-2">
                          {/* Grade header (click anywhere to collapse; checkbox selects whole grade) */}
                          <div
                            role="button"
                            onClick={() => toggleGradeCollapse(grade)}
                            aria-expanded={!isCollapsed}
                            className="w-full flex items-center justify-between px-4 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 transition-colors focus:outline-none"
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                title="Select all report cards in this grade"
                                checked={students.every((s) => selectedFilePaths.includes(s.file_path))}
                                ref={(el) => {
                                  if (el) {
                                    const selectedCount = students.filter((s) => selectedFilePaths.includes(s.file_path)).length;
                                    el.indeterminate = selectedCount > 0 && selectedCount < students.length;
                                  }
                                }}
                                onChange={() => toggleGradeSelection(students)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                              />
                              {isCollapsed ? (
                                <ChevronRightIcon className="w-5 h-5" />
                              ) : (
                                <ChevronDownIcon className="w-5 h-5" />
                              )}
                              <span className="font-semibold text-lg">{grade}</span>
                            </div>
                            <span className="text-sm">{students.length} report cards</span>
                          </div>

                          {/* Student cards */}
                          {!isCollapsed && (
                          <div className="space-y-2">
                            {students.map((student) => (
                              <div
                                key={student.student_id}
                                onClick={() => handlePreview(student.file_path)}
                                role="button"
                                title="View report card"
                                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  title="Select report card"
                                  checked={selectedFilePaths.includes(student.file_path)}
                                  onChange={() => toggleCardSelection(student.file_path)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 mr-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                />
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
                                <div
                                  className="flex items-center space-x-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                                    onClick={() => handleEmailClick(student)}
                                    title={student.email_sent ? "View Email Details" : "Send Email"}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                      student.email_sent
                                        ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                        : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                                    }`}
                                  >
                                    {student.email_sent ? (
                                      <CheckCircleIcon className="h-5 w-5" />
                                    ) : (
                                      <EnvelopeIcon className="h-5 w-5" />
                                    )}
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
                          )}
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
            setSelectedFilePaths((prev) => prev.filter((p) => p !== filePath));
            setDeleteModalOpen(false);
          }}
        />
      )}

      {bulkDeleteModalOpen && selectedFilePaths.length > 0 && (
        <BulkDeleteReportCardModal
          isOpen={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          filePaths={selectedFilePaths}
          onDeleted={handleBulkDeleted}
        />
      )}

      {bulkDownloadModalOpen && selectedFilePaths.length > 0 && (
        <BulkDownloadReportCardModal
          isOpen={bulkDownloadModalOpen}
          onClose={() => setBulkDownloadModalOpen(false)}
          filePaths={selectedFilePaths}
          term={term}
          onDownloaded={() => setSelectedFilePaths([])}
        />
      )}

      {/* Email Modals */}
      {sendEmailModalOpen && selectedForEmail && (
        <SingleEmailReportCardModal
          isOpen={sendEmailModalOpen}
          onClose={() => {
            setSendEmailModalOpen(false);
            setSelectedForEmail(null);
          }}
          studentId={selectedForEmail.student_id}
          studentName={selectedForEmail.student_name}
          term={term}
          onEmailSent={handleEmailSent}
        />
      )}

      {emailDetailsModalOpen && selectedForEmail && (
        <SentEmailReportCardModal
          isOpen={emailDetailsModalOpen}
          onClose={() => {
            setEmailDetailsModalOpen(false);
            setSelectedForEmail(null);
          }}
          studentId={selectedForEmail.student_id}
          studentName={selectedForEmail.student_name}
          term={term}
        />
      )}

      <BulkEmailReportCardModal
        isOpen={bulkEmailModalOpen}
        onClose={() => setBulkEmailModalOpen(false)}
        availableReports={unemailedReports}
        term={term}
        onEmailsSent={handleEmailSent}
      />

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
