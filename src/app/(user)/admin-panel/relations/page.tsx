'use client';

import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUserStore } from '@/store/useUserStore';
import { useEffect, useState } from 'react';
import { getAllParentStudents } from '@/services/parentStudentService';
import { ParentStudentPayload } from '@/services/types/parentStudent';
import { useNotificationStore } from '@/store/useNotificationStore';
import AddRelationModal from '@/components/relation/add/page';

const ParentStudentRelationsPage = () => {
  const user = useUserStore((state) => state.user);
  const notify = useNotificationStore((s) => s.showNotification);
  const [relations, setRelations] = useState<ParentStudentPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const loadRelations = async () => {
      if (!user.school || user.school === 'null') return;

      try {
        const res = await getAllParentStudents(user.school);
        if (res.status === 'success' && res.data) {
          setRelations(res.data);
        } else {
          notify('Failed to load parent-student relations', 'error');
        }
      } catch {
        notify('Failed to load parent-student relations', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadRelations();
  }, [user.school, notify]);

  const filteredRelations = relations.filter(relation => 
    relation.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.relation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (newRel: ParentStudentPayload) => {
    setRelations((prev) => [newRel, ...prev]);
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-center mb-2">
            {user.school} - Parent-Student Relations
          </h1>
          <p className="text-center text-gray-600">
            Manage parent-student mappings and contact information
          </p>
        </div>

        {/* Search and Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Search by student name, parent name, or relation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer">
            + Add Relation
          </button>
        </div>

        {/* Relations List */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading parent-student relations...</p>
          </div>
        ) : filteredRelations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchTerm ? 'No relations found matching your search.' : 'No parent-student relations found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRelations.map((relation) => (
              <div
                key={relation.parentStudentLinkId}
                className="bg-white border border-cyan-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Student Info */}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-1">
                      {relation.student?.name || 'Unknown Student'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Grade {relation.student?.grade || 'N/A'}
                    </p>
                  </div>

                  {/* Parent Info */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">
                      {relation.parentName || 'Unknown Parent'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Relation:</span> {relation.relation}
                    </p>
                    {relation.parentEmail && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Email:</span> {relation.parentEmail}
                      </p>
                    )}
                    {relation.parentNumber && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {relation.parentNumber}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    <button className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm cursor-pointer">
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>

                {/* User Account Info (if linked) */}
                {relation.parentUser && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-green-600">
                      <span className="font-medium">Linked Account:</span> {' '}
                      {relation.parentUser.firstName} {relation.parentUser.lastName} ({relation.parentUser.email})
                    </p>
                  </div>
                )}

                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(relation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredRelations.length} of {relations.length} parent-student relations
          </p>
        </div>
      </main>

      <AddRelationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />
    </>
  );
};

export default ParentStudentRelationsPage;