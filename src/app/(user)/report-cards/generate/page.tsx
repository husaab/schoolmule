'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { getAllStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { useUserStore } from '@/store/useUserStore';
import { generateBulkReportCards } from '@/services/reportCardService';
import GenerateReportCardModal from '@/components/report-cards/generateReportCardModal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getTermsBySchool } from '@/services/termService';
import { TermPayload } from '@/services/types/term';

export default function GenerateReportCardsPage() {
  const user = useUserStore((state) => state.user);
  const [students, setStudents] = useState<StudentPayload[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [generateAll, setGenerateAll] = useState<boolean>(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const showNotification = useNotificationStore(state => state.showNotification);

  const [terms, setTerms] = useState<TermPayload[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [term, setTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  useEffect(() => {
    if (generateAll) {
      const allIds = students.map((s) => s.studentId);
      setSelectedStudents(new Set(allIds));
    } else {
      setSelectedStudents(new Set());
    }
  }, [generateAll, students]);

  const handleSelectStudent = (id: string) => {
    if (generateAll) return;
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
    if (generateAll) return;
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

  const handleGenerate = async () => {
    if (!term || selectedStudents.size === 0) {
      showNotification('Please select a term and at least one student.', "error");
      return;
    }
    setShowModal(true);
    setIsLoading(true);
    setResultMessage(null);

    try {
      const res = await generateBulkReportCards({
        term,
        studentIds: [...selectedStudents],
      });

      const successCount = res.generated.length;
      const failedCount = res.failed.length;

      setResultMessage(`Generated ${successCount} report card(s). ${failedCount > 0 ? failedCount + ' failed.' : ''}`);
    } catch (err) {
      console.error(err);
      setResultMessage('An error occurred while generating report cards.');
    } finally {
      setIsLoading(false);
    }
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
                      onChange={(e) => setTerm(e.target.value)}
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
                    disabled={generateAll}
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setGenerateAll(false);
                    }}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={generateAll}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={generateAll}
                    onChange={(e) => {
                      setGenerateAll(e.target.checked);
                      if (e.target.checked) {
                        setSelectedGrade('');
                      }
                    }}
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
                {(generateAll || selectedGrade || searchTerm) && (
                  <button
                    onClick={() => {
                      setGenerateAll(false);
                      setSelectedGrade('');
                      setSearchTerm('');
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

          {/* Students Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              {Object.entries(filteredGroupedByGrade)
                .sort(([a], [b]) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                .map(([grade, gradeStudents]) => {
                  const collapsed = selectedGrade && grade !== selectedGrade;
                  if (generateAll || !selectedGrade || !collapsed) {
                    const gradeIds = gradeStudents.map(s => s.studentId);
                    const allInGradeSelected = gradeIds.length > 0 && gradeIds.every(id => selectedStudents.has(id));
                    const someInGradeSelected = gradeIds.some(id => selectedStudents.has(id));
                    
                    return (
                      <div key={grade} className="space-y-2">
                        {/* Grade header with select all */}
                        <div className="flex items-center justify-between px-4 py-2 bg-cyan-600 text-white rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-lg">{grade}</span>
                            <span className="text-sm">({gradeStudents.length} student{gradeStudents.length !== 1 ? 's' : ''})</span>
                          </div>
                          {!generateAll && gradeStudents.length > 0 && (
                            <label className="flex items-center space-x-2 cursor-pointer">
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
                        <div className="space-y-2">
                          {gradeStudents.map((student) => (
                            <div
                              key={student.studentId}
                              className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">{student.name}</p>
                                <p className="text-gray-600 text-sm">Grade {student.grade}</p>
                              </div>
                              <input
                                type="checkbox"
                                disabled={generateAll}
                                checked={selectedStudents.has(student.studentId)}
                                onChange={() => handleSelectStudent(student.studentId)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
            </div>
            
            {/* No results message */}
            {Object.keys(filteredGroupedByGrade).length === 0 && !generateAll && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? `No students found matching "${searchTerm}"` : 'No students found'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
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
