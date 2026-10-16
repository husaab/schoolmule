// src/components/gradebook/GridLegend.tsx
// The legend under the score grids (Teacher-Grades board). The class grid
// explains its category dots; once the class has classwork with a gradebook
// column, both grids also show the cell marks: "8" Draft, "In" Turned in,
// "M" Missing (counts as 0). The category window adds how it saves and that a
// column name opens the grading view.

interface GridLegendProps {
  variant: 'grid' | 'category'
  /** The class has turn-in columns (assignments or quizzes in the gradebook). */
  classwork: boolean
}

function Swatch({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex h-5 min-w-[26px] items-center justify-center rounded-[5px] px-1 text-xs ${className}`} aria-hidden="true">
      {children}
    </span>
  )
}

function Dot({ className }: { className: string }) {
  return <span className={`h-2 w-2 rounded-full ${className}`} aria-hidden="true" />
}

export default function GridLegend({ variant, classwork }: GridLegendProps) {
  const swatches = classwork && (
    <>
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-slate-100 italic text-slate-500">8</Swatch>
        Draft
      </span>
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-cyan-100 text-cyan-800">In</Swatch>
        Turned in
      </span>
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-rose-100 font-semibold text-rose-700">M</Swatch>
        Missing, counts as 0
      </span>
    </>
  )

  if (variant === 'category') {
    return (
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-600">
        {swatches}
        <span className="text-slate-500 sm:ml-auto">
          Type scores straight into the cells. Each one saves by itself; there is no Save button.
          {classwork && " Click a column name to grade with the student's work."}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-600">
      <span className="flex items-center gap-1.5">
        <Dot className="bg-rose-600" />
        Something missing inside
      </span>
      {classwork && (
        <span className="flex items-center gap-1.5">
          <Dot className="bg-cyan-500" />
          Turned in or draft, waiting for you
        </span>
      )}
      {swatches}
      <span className="text-slate-500">Click a category (or any score in it) to open its assessments.</span>
    </div>
  )
}
