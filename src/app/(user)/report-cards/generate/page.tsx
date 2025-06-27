'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { getAllStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { useUserStore } from '@/store/useUserStore';
import { generateBulkReportCards } from '@/services/reportCardService';
import GenerateReportCardModal from '@/components/report-cards/generateReportCardModal';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function GenerateReportCardsPage() {
  const user = useUserStore((state) => state.user);
  const [students, setStudents] = useState<StudentPayload[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [generateAll, setGenerateAll] = useState<boolean>(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const showNotification = useNotificationStore(state => state.showNotification);

  const [term, setTerm] = useState<string>('Term 1');
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user.school) {
      getAllStudents(user.school).then((res) => {
        if (res.status === 'success') {
          setStudents(res.data);
        }
      });
    }
  }, [user.school]);

  const groupedByGrade = students.reduce((acc, student) => {
    const grade = `Grade ${student.grade ?? '-'}`;
    acc[grade] = acc[grade] || [];
    acc[grade].push(student);
    return acc;
  }, {} as Record<string, StudentPayload[]>);

  useEffect(() => {
    if (generateAll) {
      const allIds = students.map((s) => s.studentId);
      setSelectedStudents(new Set(allIds));
    } else if (selectedGrade) {
      const gradeIds = groupedByGrade[selectedGrade]?.map((s) => s.studentId) || [];
      setSelectedStudents(new Set(gradeIds));
    } else {
      setSelectedStudents(new Set());
    }
  }, [generateAll, selectedGrade, students]);

  const handleSelectStudent = (id: string) => {
    if (generateAll || selectedGrade) return;
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
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
      <main className="lg:ml-64 min-h-screen p-4 lg:p-10 bg-white text-black">
        <h1 className="text-3xl font-bold text-center pt-40 mb-6">Generate Report Cards</h1>

        <div className="w-[85%] lg:w-[75%] mx-auto space-y-6">
          <div className="flex flex-col items-start gap-4 text-lg">
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
                className="mr-2"
              />
              Generate Report Cards for All Grades
            </label>

            <div className="w-full">
              <label className="font-medium">Or select specific grade:</label>
              <select
                disabled={generateAll}
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setGenerateAll(false);
                }}
                className="w-full border px-3 py-2 rounded mt-1"
              >
                <option value="">-- Select Grade --</option>
                {Object.keys(groupedByGrade)
                  .sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                  .map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-scroll border p-4 rounded custom-scrollbar">
            {Object.entries(groupedByGrade)
              .sort(([a], [b]) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
              .map(([grade, students]) => {
                const collapsed = selectedGrade && grade !== selectedGrade;
                if (generateAll || !selectedGrade || !collapsed) {
                  return (
                    <div key={grade} className="mb-6">
                      <h2 className="text-xl font-semibold mb-2">{grade}</h2>
                      <div className="space-y-2">
                        {students.map((student) => (
                          <label
                            key={student.studentId}
                            className="flex items-center justify-between border px-4 py-2 rounded"
                          >
                            <span>{student.name}</span>
                            <input
                              type="checkbox"
                              disabled={generateAll || !!selectedGrade}
                              checked={selectedStudents.has(student.studentId)}
                              onChange={() => handleSelectStudent(student.studentId)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
          </div>

          <div className="text-center">
            <button
              onClick={handleGenerate}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded cursor-pointer"
            >
              Generate Report Cards
            </button>
            {isLoading && (
              <p className="text-blue-600 mt-4">Generating report cards, please wait...</p>
            )}
            {resultMessage && (
              <p className="text-green-600 mt-4">{resultMessage}</p>
            )}
          </div>
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
      <GenerateReportCardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        studentIds={[...selectedStudents]}
        term={term}
      />
    </>
  );
}
