'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { getAllStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { useUserStore } from '@/store/useUserStore';
import { generateBulkReportCards, getGeneratedReportCardsByStudentId, getSignedReportCardUrl } from '@/services/reportCardService';
import GenerateReportCardModal from '@/components/report-cards/generateReportCardModal';
import ReportCardViewerModal from '@/components/report-cards/view/reportCardViewerModal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getTermsBySchool } from '@/services/termService';
import { TermPayload } from '@/services/types/term';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useFilterParams } from '@/hooks/useFilterParams';

function GenerateReportCardsPageContent() {
  const user = useUserStore((state) => state.user);
  const { get, setParams } = useFilterParams();
  const [students, setStudents] = useState<StudentPayload[]>([]);
  // Grade filter lives in the URL; search is local (seeded from URL) for snappy
  // typing, mirrored to the URL on change. `term` keeps its own init effect.
  const selectedGrade = get('grade');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [collapsedGrades, setCollapsedGrades] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>(() => get('q'));
  const showNotification = useNotificationStore(state => state.showNotification);

  const [terms, setTerms] = useState<TermPayload[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [term, setTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [generatedStudents, setGeneratedStudents] = useState<{ studentId: string; name: string }[]>([]);
  const [resolvingStudentId, setResolvingStudentId] = useState<string | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);

  const groupedByGrade = useMemo(() => {
    return students.reduce((acc, student) => {
      const grade = `Grade ${student.grade ?? '-'}`;
      acc[grade] = acc[grade] || [];
      acc[grade].push(student);
      return acc;
    }, {} as Record<string, StudentPayload[]>);
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const filteredGroupedByGrade = useMemo(() => {
    if (!searchTerm) return groupedByGrade;
    return filteredStudents.reduce((acc, student) => {
      const grade = `Grade ${student.grade ?? '-'}`;
      acc[grade] = acc[grade] || [];
      acc[grade].push(student);
      return acc;
    }, {} as Record<string, StudentPayload[]>);
  }, [filteredStudents, groupedByGrade, searchTerm]);

  useEffect(() => {
    if (user.school) {
      setLoadingTerms(true);
      // Fetch students and terms in parallel
      Promise.all([
        getAllStudents(user.school),
        getTermsBySchool(user.school)
      ]).then(([studentsRes, termsRes]) => {
        if (studentsRes.status === 'success') {
          setStudents(studentsRes.data);
        }
        
        if (termsRes.status === 'success') {
          setTerms(termsRes.data);
          
          // Set default term to active term
          if (user.activeTerm) {
            setTerm(user.activeTerm);
          } else {
            // Find active term from the list
            const activeTerm = termsRes.data.find(t => t.isActive);
            if (activeTerm) {
              setTerm(activeTerm.name);
            } else if (termsRes.data.length > 0) {
              // Fallback to first term if no active term
              setTerm(termsRes.data[0].name);
            }
          }
        } else {
          showNotification('Failed to load terms', 'error');
        }
      }).catch(err => {
        console.error('Error fetching data:', err);
        showNotification('Error loading data', 'error');
      }).finally(() => {
        setLoadingTerms(false);
      });
    }
  }, [user.school, user.activeTerm, showNotification]);

  // "Generate for All Students" is a select-all toggle derived from the current
  // selection, so the individual / per-grade checkboxes stay editable — letting
  // the user select everyone and then exclude specific grades (e.g. JK/SK) or students.
  const allSelected = students.length > 0 && selectedStudents.size === students.length;

  const handleToggleAll = (checked: boolean) => {
    setSelectedStudents(checked ? new Set(students.map((s) => s.studentId)) : new Set());
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllInGrade = (grade: string) => {
    const gradeStudents = filteredGroupedByGrade[grade] || [];
    const gradeIds = gradeStudents.map(s => s.studentId);
    const allSelected = gradeIds.every(id => selectedStudents.has(id));
    
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all in grade
        gradeIds.forEach(id => newSet.delete(id));
      } else {
        // Select all in grade
        gradeIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const toggleGradeCollapse = (grade: string) => {
    setCollapsedGrades(prev => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!term || selectedStudents.size === 0) {
      showNotification('Please select a term and at least one student.', "error");
      return;
    }
    setShowModal(true);
    setIsLoading(true);
    setResultMessage(null);
    setGeneratedStudents([]);

    try {
      const res = await generateBulkReportCards({
        term,
        studentIds: [...selectedStudents],
      });

      const successCount = res.generated.length;
      const failedCount = res.failed.length;

      // Capture the generated students (with names) so they can be viewed right away.
      const nameById = new Map(students.map((s) => [s.studentId, s.name]));
      setGeneratedStudents(
        res.generated.map((g) => ({
          studentId: g.studentId,
          name: nameById.get(g.studentId) ?? 'Student',
        })),
      );

      setResultMessage(`Generated ${successCount} report card(s). ${failedCount > 0 ? failedCount + ' failed.' : ''}`);
    } catch (err) {
      console.error(err);
      setResultMessage('An error occurred while generating report cards.');
    } finally {
      setIsLoading(false);
    }
  };

  // Look up the signed PDF URL for a freshly generated report card.
  const resolveReportCardUrl = async (studentId: string): Promise<string | null> => {
    if (!user.school) return null;
    const res = await getGeneratedReportCardsByStudentId(studentId, term, user.school);
    if (res.status === 'success' && res.data.length > 0) {
      return getSignedReportCardUrl(res.data[0].file_path);
    }
    return null;
  };

  const handlePreviewGenerated = async (studentId: string) => {
    setResolvingStudentId(studentId);
    try {
      const url = await resolveReportCardUrl(studentId);
      if (url) setViewingUrl(url);
      else showNotification('Could not load that report card', 'error');
    } catch (err) {
      console.error(err);
      showNotification('Could not load that report card', 'error');
    } finally {
      setResolvingStudentId(null);
    }
  };

  const handleOpenGeneratedInNewTab = (studentId: string) => {
    // Open the in-app View page (which auto-opens the report card viewer modal)
    // in a new tab — instead of exposing the raw Supabase bucket URL.
    const url = `/report-cards/view?term=${encodeURIComponent(term)}&preview=${encodeURIComponent(studentId)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10 pb-24">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">Generate Report Cards</h1>
          <p className="text-gray-600 mt-2">Select students and generate report cards for the selected term</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Select term:</label>
                  {loadingTerms ? (
                    <p className="text-gray-600">Loading terms...</p>
                  ) : (
                    <select
                      value={term}
                      onChange={(e) => { setTerm(e.target.value); setParams({ term: e.target.value }); }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    onChange={(e) => setParams({ grade: e.target.value })}
                    className="w-full text-black border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">-- All Grades --</option>
                    {Object.keys(groupedByGrade)
                      .sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                      .map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search students:</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setParams({ q: e.target.value }); }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedStudents.size > 0 && !allSelected;
                    }}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Generate Report Cards for All Students</span>
                </label>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Selected: {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''}
                  {searchTerm && (
                    <span className="ml-2 text-blue-600">
                      (Filtered by: &ldquo;{searchTerm}&rdquo;)
                    </span>
                  )}
                </p>
                {(selectedGrade || searchTerm || selectedStudents.size > 0) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setParams({ grade: null, q: null });
                      setSelectedStudents(new Set());
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Students Content — extra bottom padding so the last student isn't
              hidden behind the fixed "Generate" bar */}
          <div className="p-6 pb-28 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              {Object.entries(filteredGroupedByGrade)
                .sort(([a], [b]) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                .map(([grade, gradeStudents]) => {
                  const collapsed = selectedGrade && grade !== selectedGrade;
                  if (!selectedGrade || !collapsed) {
                    const gradeIds = gradeStudents.map(s => s.studentId);
                    const allInGradeSelected = gradeIds.length > 0 && gradeIds.every(id => selectedStudents.has(id));
                    const someInGradeSelected = gradeIds.some(id => selectedStudents.has(id));
                    const isCollapsed = collapsedGrades.has(grade);

                    return (
                      <div key={grade} className="space-y-2">
                        {/* Grade header (click anywhere to collapse) with select all */}
                        <div
                          onClick={() => toggleGradeCollapse(grade)}
                          role="button"
                          aria-expanded={!isCollapsed}
                          className="flex items-center justify-between px-4 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {isCollapsed ? (
                              <ChevronRightIcon className="w-5 h-5" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5" />
                            )}
                            <span className="font-semibold text-lg">{grade}</span>
                            <span className="text-sm">({gradeStudents.length} student{gradeStudents.length !== 1 ? 's' : ''})</span>
                          </div>
                          {gradeStudents.length > 0 && (
                            <label
                              className="flex items-center space-x-2 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={allInGradeSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = someInGradeSelected && !allInGradeSelected;
                                }}
                                onChange={() => handleSelectAllInGrade(grade)}
                                className="w-4 h-4 text-blue-200 bg-white/20 border-white/40 rounded focus:ring-blue-300 focus:ring-2"
                              />
                              <span className="text-sm font-medium">
                                {allInGradeSelected ? 'Deselect All' : 'Select All'}
                              </span>
                            </label>
                          )}
                        </div>

                        {/* Student cards */}
                        {!isCollapsed && (
                          <div className="space-y-2">
                            {gradeStudents.map((student) => (
                              <div
                                key={student.studentId}
                                onClick={() => handleSelectStudent(student.studentId)}
                                role="button"
                                aria-pressed={selectedStudents.has(student.studentId)}
                                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                                  selectedStudents.has(student.studentId)
                                    ? 'bg-cyan-50 border-cyan-300 cursor-pointer hover:bg-cyan-100'
                                    : 'bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{student.name}</p>
                                  <p className="text-gray-600 text-sm">Grade {student.grade}</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.has(student.studentId)}
                                  onChange={() => handleSelectStudent(student.studentId)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
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
            
            {/* No results message */}
            {Object.keys(filteredGroupedByGrade).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? `No students found matching "${searchTerm}"` : 'No students found'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setParams({ q: null }); }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Generate Button at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-20 p-4 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={!term || selectedStudents.size === 0}
              className="px-8 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Generate {selectedStudents.size} Report Card{selectedStudents.size !== 1 ? 's' : ''}
            </button>
          </div>
          {isLoading && (
            <p className="text-blue-600 text-center mt-2 text-sm">Generating report cards, please wait...</p>
          )}
          {resultMessage && (
            <p className="text-green-600 text-center mt-2 text-sm">{resultMessage}</p>
          )}
        </div>
      </main>

      <GenerateReportCardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isLoading={isLoading}
        resultMessage={resultMessage || ''}
        generatedStudents={generatedStudents}
        resolvingStudentId={resolvingStudentId}
        onPreview={handlePreviewGenerated}
        onOpenNewTab={handleOpenGeneratedInNewTab}
      />

      {viewingUrl && (
        <ReportCardViewerModal url={viewingUrl} onClose={() => setViewingUrl(null)} />
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

export default function GenerateReportCardsPage() {
  return (
    <Suspense fallback={<main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10 pb-24" />}>
      <GenerateReportCardsPageContent />
    </Suspense>
  );
}
