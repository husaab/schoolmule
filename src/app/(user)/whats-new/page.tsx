'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import CategoryTag from '@/components/patchNotes/CategoryTag';
import ImageLightbox from '@/components/patchNotes/ImageLightbox';
import { getPatchNotes } from '@/services/patchNoteService';
import type { PatchNote } from '@/services/types/patchNote';
import DOMPurify from 'dompurify';

export default function WhatsNewPage() {
  const [notes, setNotes] = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPatchNotes();
        setNotes(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Group notes by version
  const grouped = notes.reduce<Record<string, PatchNote[]>>((acc, note) => {
    if (!acc[note.version]) acc[note.version] = [];
    acc[note.version].push(note);
    return acc;
  }, {});

  const versionOrder = Object.keys(grouped);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-6 lg:px-10 py-8">
          <h1 className="text-2xl font-bold text-white">What&apos;s New</h1>
          <p className="text-sm text-white/80 mt-1">
            Stay up to date with the latest improvements to School Mule
          </p>
        </div>

        <div className="px-6 lg:px-10 py-8">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : notes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">No updates yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Check back later for the latest improvements.
              </p>
            </div>
          ) : (
            <div className="space-y-10 max-w-5xl">
              {versionOrder.map((version, vIdx) => {
                const versionNotes = grouped[version];
                const publishDate = new Date(versionNotes[0].publishedAt).toLocaleDateString(
                  'en-US',
                  { month: 'long', day: 'numeric', year: 'numeric' }
                );
                const isLatest = vIdx === 0;

                return (
                  <div key={version}>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-lg font-bold text-slate-900">{version}</h2>
                      <span className="text-xs text-slate-400 bg-slate-100 px-3 py-0.5 rounded-full">
                        {publishDate}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    <div
                      className={`flex flex-col gap-3 pl-3 border-l-2 ${
                        isLatest ? 'border-cyan-500' : 'border-slate-200'
                      }`}
                    >
                      {versionNotes.map((note) => (
                        <div
                          key={note.patchNoteId}
                          className="bg-white rounded-lg p-4 shadow-sm border border-slate-100"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <CategoryTag category={note.category} />
                          </div>
                          <h3 className="font-semibold text-[15px] text-slate-900">
                            {note.title}
                          </h3>
                          <div
                            className="text-sm text-slate-600 mt-1 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.body) }}
                          />
                          {note.imageUrl && (
                            <button
                              onClick={() => setLightboxImage(note.imageUrl)}
                              className="mt-3 w-full rounded-lg overflow-hidden border border-slate-200 hover:border-slate-300 transition-colors"
                            >
                              <img
                                src={note.imageUrl}
                                alt={note.title}
                                className="w-full max-h-64 object-contain rounded-md"
                              />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ImageLightbox
        src={lightboxImage || ''}
        alt="Screenshot"
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
}
