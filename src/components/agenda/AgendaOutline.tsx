'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import CustomPageCard from './CustomPageCard';
import type {
  AgendaDetailPayload,
  AgendaCustomPagePayload,
  AgendaManifestPayload,
  AgendaAnchor,
} from '@/services/types/agenda';
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface SlotId {
  anchor: AgendaAnchor;
  anchorMonth: number | null;
}

interface Props {
  agenda: AgendaDetailPayload;
  manifest: AgendaManifestPayload | null;
  monthOptions: number[];
  onReorderSlot: (slot: SlotId, orderedPageIds: string[]) => void;
  onMovePage: (pageId: string, anchor: AgendaAnchor, anchorMonth: number | null) => void;
  onRenamePage: (pageId: string, title: string) => void;
  onDeletePage: (pageId: string) => void;
  onAddPage: (slot: SlotId) => void;
  onSaveQuotes: (month: number, quotes: string[]) => void;
  onJumpToSeq: (seq: number) => void;
}

const slotKey = (anchor: AgendaAnchor, anchorMonth: number | null) =>
  anchor === 'month' ? `month-${anchorMonth}` : anchor;

export default function AgendaOutline({
  agenda,
  manifest,
  monthOptions,
  onReorderSlot,
  onMovePage,
  onRenamePage,
  onDeletePage,
  onAddPage,
  onSaveQuotes,
  onJumpToSeq,
}: Props) {
  const [activePage, setActivePage] = useState<AgendaCustomPagePayload | null>(null);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<number>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group custom pages by slot, sorted
  const pagesBySlot = useMemo(() => {
    const map = new Map<string, AgendaCustomPagePayload[]>();
    for (const page of agenda.customPages) {
      const key = slotKey(page.anchor, page.anchorMonth ?? null);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(page);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [agenda.customPages]);

  // Generated rows per month from the manifest (page numbers included)
  const generatedByMonth = useMemo(() => {
    const map = new Map<number, { seq: number; label: string }[]>();
    if (!manifest) return map;
    for (const item of manifest.items) {
      if (item.kind === 'custom' || item.month === undefined) continue;
      if (!map.has(item.month)) map.set(item.month, []);
      let label: string;
      if (item.kind === 'monthOverview') label = 'Month overview & calendar';
      else if (item.kind === 'weekly') label = `Week of ${item.mondayIso}`;
      else if (item.kind === 'notes') label = 'Notes / communication';
      else label = 'Monthly evaluation report';
      map.get(item.month)!.push({ seq: item.seq, label });
    }
    return map;
  }, [manifest]);

  const findSlotOfPage = (pageId: string): SlotId | null => {
    const page = agenda.customPages.find((p) => p.pageId === pageId);
    if (!page) return null;
    return { anchor: page.anchor, anchorMonth: page.anchorMonth ?? null };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const page = agenda.customPages.find((p) => p.pageId === event.active.id) || null;
    setActivePage(page);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePage(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // MVP: reorder within the same slot only (move across slots via dropdown)
    const activeSlot = findSlotOfPage(String(active.id));
    const overSlot = findSlotOfPage(String(over.id));
    if (!activeSlot || !overSlot) return;
    if (slotKey(activeSlot.anchor, activeSlot.anchorMonth) !== slotKey(overSlot.anchor, overSlot.anchorMonth)) return;

    const key = slotKey(activeSlot.anchor, activeSlot.anchorMonth);
    const slotPages = pagesBySlot.get(key) || [];
    const oldIndex = slotPages.findIndex((p) => p.pageId === active.id);
    const newIndex = slotPages.findIndex((p) => p.pageId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(slotPages, oldIndex, newIndex);
    onReorderSlot(activeSlot, reordered.map((p) => p.pageId));
  };

  const renderSlot = (slot: SlotId, emptyHint: string) => {
    const key = slotKey(slot.anchor, slot.anchorMonth);
    const pages = pagesBySlot.get(key) || [];

    return (
      <div className="space-y-1.5">
        <SortableContext items={pages.map((p) => p.pageId)} strategy={verticalListSortingStrategy}>
          {pages.map((page) => (
            <CustomPageCard
              key={page.pageId}
              page={page}
              monthOptions={monthOptions}
              onMove={onMovePage}
              onRename={onRenamePage}
              onDelete={onDeletePage}
            />
          ))}
        </SortableContext>
        <button
          onClick={() => onAddPage(slot)}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {pages.length === 0 ? emptyHint : 'Add page'}
        </button>
      </div>
    );
  };

  const toggleMonth = (month: number) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Intro slot */}
        <section className="bg-slate-50 rounded-2xl border border-slate-100 p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2 px-1">
            <DocumentTextIcon className="w-4 h-4 text-indigo-500" />
            Introduction pages
          </h3>
          {renderSlot({ anchor: 'intro', anchorMonth: null }, 'Add welcome letter, code of conduct…')}
        </section>

        {/* Month sections */}
        {monthOptions.map((month) => {
          const monthConfig = agenda.months.find((m) => m.month === month);
          const generated = generatedByMonth.get(month) || [];
          const collapsed = collapsedMonths.has(month);
          const year = manifest?.items.find(
            (i) => i.kind !== 'custom' && i.month === month
          )?.year;

          return (
            <section key={month} className="bg-slate-50 rounded-2xl border border-slate-100 p-3">
              <button
                onClick={() => toggleMonth(month)}
                className="w-full flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2 px-1 cursor-pointer"
              >
                {collapsed
                  ? <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                  : <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />}
                <CalendarIcon className="w-4 h-4 text-teal-500" />
                {MONTH_NAMES[month - 1]}{year ? ` ${year}` : ''}
                {generated.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-slate-400">
                    p.{generated[0].seq}–{generated[generated.length - 1].seq}
                  </span>
                )}
              </button>

              {!collapsed && (
                <div className="space-y-2">
                  {renderSlot({ anchor: 'month', anchorMonth: month }, 'Add month divider pages…')}

                  {/* Generated (locked) rows */}
                  <div className="rounded-xl border border-slate-200/70 bg-white/60 divide-y divide-slate-50">
                    {generated.map((row) => (
                      <button
                        key={row.seq}
                        onClick={() => onJumpToSeq(row.seq)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-left cursor-pointer hover:bg-indigo-50/40"
                        title="Show in preview"
                      >
                        <span className="text-xs text-slate-500">{row.label}</span>
                        <span className="text-[10px] font-medium text-slate-300">p.{row.seq}</span>
                      </button>
                    ))}
                  </div>

                  {/* Weekly quotes */}
                  <QuotesEditor
                    month={month}
                    initialQuotes={monthConfig?.quotes || []}
                    onSave={(quotes) => onSaveQuotes(month, quotes)}
                  />
                </div>
              )}
            </section>
          );
        })}

        {/* Closing slot */}
        <section className="bg-slate-50 rounded-2xl border border-slate-100 p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2 px-1">
            <DocumentTextIcon className="w-4 h-4 text-indigo-500" />
            Closing pages
          </h3>
          {renderSlot({ anchor: 'closing', anchorMonth: null }, 'Add resources, directory…')}
        </section>
      </div>

      <DragOverlay>
        {activePage && (
          <div className="bg-white rounded-xl border border-indigo-300 shadow-xl px-3 py-2.5 text-sm font-medium text-slate-800">
            {activePage.title || 'Untitled page'}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

/** Per-month weekly quote editor: one quote per line, cycled across weeks. */
function QuotesEditor({
  month,
  initialQuotes,
  onSave,
}: {
  month: number;
  initialQuotes: string[];
  onSave: (quotes: string[]) => void;
}) {
  const [value, setValue] = useState(initialQuotes.join('\n'));
  const [dirty, setDirty] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/60 p-2.5">
      <label className="block text-xs font-medium text-slate-500 mb-1">
        Weekly quotes — one per line, rotated across {MONTH_NAMES[month - 1]}&apos;s weeks
      </label>
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(true); }}
        rows={3}
        placeholder={'"To acquire knowledge is binding upon all Muslims…" —PROPHET MUHAMMAD(S)'}
        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      {dirty && (
        <button
          onClick={() => {
            onSave(value.split('\n').map((q) => q.trim()).filter(Boolean));
            setDirty(false);
          }}
          className="mt-1 px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
        >
          Save quotes
        </button>
      )}
    </div>
  );
}
