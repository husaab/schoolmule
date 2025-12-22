'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { getClassesByTeacherId, getAllClasses } from '@/services/classService';
import { useRouter } from 'next/navigation';
import { ClassPayload } from '@/services/types/class';
import { getGradeOptions } from '@/lib/schoolUtils';
import { AcademicCapIcon, ClipboardDocumentCheckIcon, ChevronDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Spinner from '@/components/Spinner';

const ClassAttendanceDashboard = () => {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [classes, setClasses] = useState<ClassPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [collapsedGrades, setCollapsedGrades] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    if (user.role === 'ADMIN') {
      getAllClasses(user.school!).then((res) => {
        if (res.status === 'success') {
          setClasses(res.data);
        } else {
          console.error(res.message || 'Failed to load classes');
        }
        setLoading(false);
      });
    } else {
      getClassesByTeacherId(user.id).then((res) => {
        if (res.status === 'success') {
          setClasses(res.data);
        } else {
          console.error(res.message || 'Failed to load classes');
        }
        setLoading(false);
      });
    }
  }, [user?.id, user.role, user.school]);

  const availableGrades = getGradeOptions();

  const filteredClasses = classes.filter((c) => {
    return gradeFilter === '' || String(c.grade) === gradeFilter;
  });

  const toggleGrade = (grade: string) => {
    setCollapsedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Class Attendance</h1>
                <p className="text-slate-500 mt-1">Select a class to record attendance</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
                <ClipboardDocumentCheckIcon className="w-5 h-5 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-700">{filteredClasses.length} Classes</span>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Sticky Header */}
            <div className="sticky top-20 z-10 bg-white rounded-t-2xl border-b border-slate-100">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Filter by Grade
                    </label>
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="w-48 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer"
                    >
                      <option value="">All Grades</option>
                      {availableGrades.map((gradeOption) => (
                        <option key={gradeOption.value} value={String(gradeOption.value)}>
                          Grade {gradeOption.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {gradeFilter && (
                    <button
                      onClick={() => setGradeFilter('')}
                      className="text-sm text-cyan-600 hover:text-cyan-700 font-medium cursor-pointer"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Classes Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <ClipboardDocumentCheckIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Classes Found</h3>
                  <p className="text-sm text-slate-500">
                    {classes.length === 0
                      ? "You haven't been assigned any classes yet."
                      : 'Try adjusting your filter.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Class Sections by Grade */}
                  {availableGrades.map((gradeOption) => {
                    const classesForGrade = filteredClasses.filter((c) => String(c.grade) === String(gradeOption.value));
                    if (classesForGrade.length === 0) return null;

                    const isCollapsed = collapsedGrades.has(String(gradeOption.value));

                    return (
                      <div key={gradeOption.value} className="space-y-2">
                        <button
                          onClick={() => toggleGrade(String(gradeOption.value))}
                          className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl cursor-pointer select-none hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                              <AcademicCapIcon className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-lg">Grade {gradeOption.label}</span>
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                              {classesForGrade.length} {classesForGrade.length === 1 ? 'class' : 'classes'}
                            </span>
                          </div>
                          <ChevronDownIcon
                            className={`w-5 h-5 transform transition-transform duration-200 ${
                              isCollapsed ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </button>

                        {!isCollapsed && (
                          <div className="space-y-2 pl-2">
                            {classesForGrade.map((cls) => (
                              <div
                                key={cls.classId}
                                onClick={() => router.push(`/attendance/class/${cls.classId}`)}
                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-cyan-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900 group-hover:text-cyan-600 transition-colors">
                                      {cls.subject}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                      {cls.teacherName || 'No teacher assigned'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium group-hover:bg-emerald-600 transition-colors">
                                  Record
                                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ClassAttendanceDashboard;
