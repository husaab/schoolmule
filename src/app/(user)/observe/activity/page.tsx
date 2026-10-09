// src/app/(user)/observe/activity/page.tsx
'use client'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getActivity } from '@/services/observeService'
import Panel from '@/components/observe/Panel'
import TimeSeriesChart from '@/components/observe/TimeSeriesChart'
import Donut from '@/components/observe/Donut'
import Heatmap from '@/components/observe/Heatmap'
import StateBlock from '@/components/observe/StateBlock'
import { C } from '@/components/observe/chartTheme'

export default function ActivityPage() {
  const { data, error, loading, refetch, window } = useObserveQuery(getActivity)
  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  const busy = loading && !data

  return (
    <div className="space-y-4">
      <Panel title="Active users" subtitle={`Distinct signed-in users per bucket · last ${window}`}>
        {busy ? <StateBlock kind="loading" /> : (
          <TimeSeriesChart
            data={(data?.series ?? []) as unknown as Record<string, string | number>[]}
            windowKey={window}
            height={240}
            series={[
              { key: 'activeUsers', label: 'active users', color: C.violet, kind: 'area' },
              { key: 'requests', label: 'requests', color: C.primary, kind: 'line', yAxisId: 'right' },
            ]}
            rightAxisFormatter={(v) => `${v}`}
          />
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="By school" subtitle="Users active in the window">
          {busy ? <StateBlock kind="loading" /> : <Donut data={(data?.bySchool ?? []).map((s) => ({ name: s.school, value: s.users }))} centerLabel="users" />}
        </Panel>
        <Panel title="By role" subtitle="Users active in the window">
          {busy ? <StateBlock kind="loading" /> : <Donut data={(data?.byRole ?? []).map((r) => ({ name: r.role, value: r.users }))} centerLabel="users" />}
        </Panel>
      </div>

      <Panel title="When people use SchoolMule" subtitle="Requests by weekday and hour, Toronto time">
        {busy ? <StateBlock kind="loading" /> : <Heatmap cells={data?.heatmap ?? []} />}
      </Panel>
    </div>
  )
}
