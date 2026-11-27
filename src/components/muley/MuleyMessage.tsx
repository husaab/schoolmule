'use client'
// One message in Muley's panel: the person's words in a bubble, or Muley's
// answer as the pieces it arrived in (words, what a tool looked up, a table,
// a button that opens a page, options to tap, a change to save).

import Link from 'next/link'
import { ArrowRightIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { ActionEntry, Block, ChoiceOption, MuleyCard, ThreadMessage } from '@/lib/muley/types'
import { isAppPath, splitText } from '@/lib/muley/inlineText'
import MuleyChangeCard, { type ChangeStep } from './MuleyChangeCard'

type Props = {
  message: ThreadMessage
  /** Tapping an option of an open question. */
  onChoose: (block: Extract<Block, { kind: 'choices' }>, option: ChoiceOption) => void
  /** A link card was followed (the phone sheet closes so the page shows). */
  onNavigate: () => void
  streaming: boolean
  /** The changes prepared in this conversation, by id. */
  actions: Record<string, ActionEntry>
  /** Save, Undo or Dismiss pressed on a change card. */
  onAction: (actionId: string, step: ChangeStep) => void
  /** Send Muley a message (a change card's "Prepare it again"). */
  onAsk: (text: string) => void
}

function Words({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-[15px] leading-relaxed text-slate-800">
      {splitText(text).map((piece, index) =>
        piece.kind === 'paragraph' ? (
          <p key={index}>{piece.text}</p>
        ) : (
          <ul key={index} className="list-disc space-y-1 pl-5 marker:text-cyan-600">
            {piece.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        ),
      )}
    </div>
  )
}

function Trace({ block }: { block: Extract<Block, { kind: 'trace' }> }) {
  // A finished step with nothing to report (asking the person to choose) says nothing.
  if (block.state === 'done' && !block.summary) return null
  return (
    <p className="flex items-center gap-2 text-[13px] text-slate-500">
      {block.state === 'running' ? (
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" aria-hidden="true" />
      ) : block.state === 'done' ? (
        <CheckIcon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
      ) : (
        <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
      )}
      <span>{block.state === 'done' && block.summary ? block.summary : block.state === 'failed' ? `${block.label}: not available` : `${block.label}…`}</span>
    </p>
  )
}

function Card({ card, onNavigate }: { card: Exclude<MuleyCard, { type: 'change' | 'asset_change' }>; onNavigate: () => void }) {
  if (card.type === 'link') {
    if (!isAppPath(card.href)) return null
    return (
      <Link
        href={card.href}
        onClick={onNavigate}
        className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        {card.label}
        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    )
  }
  if (card.type === 'table') {
    return (
      <section aria-label={card.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
          <div className="min-w-0">
            <h3 className="font-display text-[15px] font-semibold text-slate-900">{card.title}</h3>
            {card.subtitle && <p className="text-xs text-slate-500">{card.subtitle}</p>}
          </div>
          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">Read only</span>
        </header>
        <div className="max-h-72 overflow-auto px-4 pb-3">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {card.columns.map((column) => (
                  <th key={column.key} scope="col" className={`border-b border-slate-100 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 ${column.align === 'right' ? 'text-right' : 'text-left'}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {card.rows.map((row, index) => (
                <tr key={index} className="border-b border-slate-50 last:border-0">
                  {card.columns.map((column) => (
                    <td key={column.key} className={`py-2 tabular-nums text-slate-800 ${column.align === 'right' ? 'text-right font-medium' : ''}`}>
                      {row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }
  return null
}

function Choices({ block, onChoose, streaming }: { block: Extract<Block, { kind: 'choices' }>; onChoose: Props['onChoose']; streaming: boolean }) {
  const closed = block.picked !== null || streaming
  return (
    <div className="space-y-2">
      <p className="text-[15px] text-slate-800">{block.question}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={block.question}>
        {block.options.map((option) => {
          const picked = block.picked === option.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={closed}
              aria-pressed={picked}
              onClick={() => onChoose(block, option)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default ${
                picked
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                  : 'border-cyan-200 bg-white text-cyan-800 hover:bg-cyan-50 disabled:opacity-50'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function MuleyMessage({ message, onChoose, onNavigate, streaming, actions, onAction, onAsk }: Props) {
  if (message.role === 'user') {
    return (
      <div className="ml-auto max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-cyan-100 bg-gradient-to-br from-cyan-50 to-teal-50 px-3.5 py-2.5 text-[15px] leading-relaxed text-slate-900">
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.attachments.map((a, i) =>
              a.previewUrl ? (
                // A local preview of the file they sent (blob: URL).
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={a.previewUrl} alt={a.name} className="h-20 w-20 rounded-xl border border-white object-contain bg-white" />
              ) : (
                <span key={i} className="rounded-lg bg-white px-2 py-1 text-xs text-slate-600">{a.name}</span>
              ),
            )}
          </div>
        )}
        {message.text}
      </div>
    )
  }
  const thinking = message.status === 'streaming' && !message.blocks.some((b) => b.kind === 'text' || b.kind === 'trace')
  return (
    <div className="flex max-w-full flex-col gap-3">
      {message.blocks.map((block, index) => {
        if (block.kind === 'text') return <Words key={index} text={block.text} />
        if (block.kind === 'trace') return <Trace key={`${block.id}-${index}`} block={block} />
        if (block.kind === 'card') {
          if (block.card.type === 'change' || block.card.type === 'asset_change') {
            return <MuleyChangeCard key={`${block.id}-${index}`} card={block.card} entry={actions[block.card.actionId]} onAction={onAction} onAsk={onAsk} streaming={streaming} />
          }
          return <Card key={`${block.id}-${index}`} card={block.card} onNavigate={onNavigate} />
        }
        return <Choices key={`${block.id}-${index}`} block={block} onChoose={onChoose} streaming={streaming} />
      })}
      {thinking && (
        <p className="flex items-center gap-1.5 text-sm text-slate-500" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500" />
        </p>
      )}
      {message.status === 'stopped' && <p className="text-xs text-slate-400">Stopped</p>}
    </div>
  )
}
