'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUserStore } from '@/store/useUserStore';
import { EyeIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getGeneratedReportCards, getSignedReportCardUrl, deleteReportCard } from '@/services/reportCardService';
import ReportCardViewerModal from '@/components/report-cards/view/reportCardViewerModal';
import ReportCardDeleteModal from '@/components/report-cards/delete/reportCardDeleteModal';

type ReportCardRow = {
  student_id: string;
  student_name: string;
  file_path: string;
  generated_at: string;
  grade: string;
};

export default function ViewReportCardsPage() {
  const user = useUserStore((state) => state.user);
  const [reportCards, setReportCards] = useState<ReportCardRow[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [term, setTerm] = useState<string>('Term 1');
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<ReportCardRow | null>(null);

  
  useEffect(() => {
    if (user.school && term) {
      getGeneratedReportCards(term).then((res) => {
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
      <main className="lg:ml-64 bg-white min-h-screen p-4 lg:p-10 text-black">
        <h1 className="text-3xl font-bold text-center mb-6 pt-40">View Report Cards</h1>

        <div className="w-[85%] lg:w-[75%] mx-auto space-y-6">
          <div className="w-full">
            <label className="font-medium">Select term:</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full border px-3 py-2 rounded mt-1"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Final Term">Final Term</option>
            </select>
          </div>

          <div className="w-full">
            <label className="font-medium">Filter by grade:</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full border px-3 py-2 rounded mt-1"
            >
              <option value="">-- All Grades --</option>
              {Object.keys(groupedByGrade)
                .sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                .map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
            </select>
          </div>

          {!hasAnyReportCards ? (
            <div className="text-center text-gray-500 italic border p-6 rounded shadow-sm">
              No report cards have been generated for this term.
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-scroll border p-4 rounded custom-scrollbar">
              {Object.entries(groupedByGrade)
                .sort(([a], [b]) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                .map(([grade, students]) => {
                  const collapsed = selectedGrade && grade !== selectedGrade;
                  if (!selectedGrade || !collapsed) {
                    return (
                      <div key={grade} className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">{grade}</h2>
                        <div className="space-y-2">
                          {students.map((student) => (
                            <div
                              key={student.student_id}
                              className="flex items-center justify-between border px-4 py-2 rounded"
                            >
                              <span>{student.student_name}</span>
                              <div className="flex gap-4">
                               <button
                                onClick={() => handlePreview(student.file_path)}
                                title="View PDF"
                                className="hover:text-green-700"
                              >
                                <EyeIcon className="h-6 w-6 text-green-500 cursor-pointer hover:text-green-700" />
                              </button>
                                <button
                              onClick={() => handleDownload(student.file_path)}
                              title="Download PDF"
                              className="hover:text-blue-700"
                            >
                              <ArrowDownTrayIcon className="h-6 w-6 text-blue-400 cursor-pointer hover:text-blue-700" />
                            </button>
                              <button
                                  onClick={() => openDeleteModal(student)}
                                  title="Delete Report Card"
                                  className="hover:text-red-600"
                                >
                                  <TrashIcon className="h-5 w-5 text-red-500 cursor-pointer" />
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
    </>
  );
}
