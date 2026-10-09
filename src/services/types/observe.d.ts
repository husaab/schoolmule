// src/services/types/observe.d.ts
export type WindowKey = '1h' | '24h' | '7d' | '30d'

export interface ObserveWindow { key: WindowKey; from: string; to: string; bucket: string }

export interface ObserveUserRef { id: string; name: string; email: string | null; school: string | null; role: string | null }

export interface ObserveTiles {
  activeUsers: number; requests: number; errors: number; clientErrors: number; errorRate: number
  p95Ms: number; logins: number; failedLogins: number; onlineNow: number
}

export interface SeriesPoint { ts: string; requests: number; errors: number; clientErrors: number; activeUsers: number; p95Ms: number }

export interface FeedItem {
  ts: string; requestId: string | null; method: string; route: string; path: string; status: number
  durationMs: number; errorMessage: string | null; impersonated: boolean; user: ObserveUserRef | null
}

export interface TopFeature { feature: string; requests: number; users: number; errors: number; p95Ms: number }
export interface TopError { fingerprint: string; source: 'server' | 'client'; location: string | null; message: string; count: number; users: number; lastSeen: string }

export interface OverviewData {
  window: ObserveWindow; tiles: ObserveTiles; prev: Omit<ObserveTiles, 'onlineNow'>
  series: SeriesPoint[]; topFeatures: TopFeature[]; topErrors: TopError[]; feed: FeedItem[]
}

export interface ActivityData {
  window: ObserveWindow
  series: { ts: string; requests: number; activeUsers: number }[]
  bySchool: { school: string; users: number; requests: number }[]
  byRole: { role: string; users: number; requests: number }[]
  heatmap: { dow: number; hour: number; requests: number; users: number }[]
}

export interface ObserveUserRow {
  id: string; name: string; email: string; school: string; role: string
  lastSeenAt: string | null; lastLoginAt: string | null; onlineNow: boolean
  requests: number; errors: number; topFeature: string | null
}
export interface UsersData { window: ObserveWindow; users: ObserveUserRow[] }

export interface UserDetailData {
  window: ObserveWindow
  user: { id: string; name: string; email: string; school: string; role: string; lastSeenAt: string | null; lastLoginAt: string | null; createdAt: string | null; isArchived: boolean }
  series: { ts: string; requests: number; errors: number }[]
  features: { feature: string; requests: number; errors: number }[]
  recentRequests: Omit<FeedItem, 'user'>[]
  recentErrors: { ts: string; source: 'server' | 'client'; fingerprint: string; location: string | null; message: string; requestId: string | null }[]
  logins: { ts: string; outcome: string; ip: string | null; userAgent: string | null }[]
}

export interface FeatureRow {
  feature: string; requests: number; users: number; errors: number; errorRate: number; p95Ms: number
  routes: { method: string; route: string; requests: number; errors: number; p95Ms: number }[]
}
export interface FeaturesData { window: ObserveWindow; features: FeatureRow[]; series: Record<string, string | number>[]; seriesKeys: string[] }

export interface ErrorGroup {
  fingerprint: string; source: 'server' | 'client'; location: string | null; message: string; count: number; users: number
  firstSeen: string; lastSeen: string; sampleStack: string | null; sampleRequestId: string | null
}
export interface RecentError {
  ts: string; source: 'server' | 'client'; fingerprint: string; location: string | null; message: string
  status: number | null; requestId: string | null; user: ObserveUserRef | null
}
export interface ErrorsData { window: ObserveWindow; groups: (ErrorGroup & { spark: number[] })[]; recent: RecentError[] }

export interface ErrorGroupData {
  window: ObserveWindow; group: ErrorGroup; series: { ts: string; count: number }[]
  occurrences: { ts: string; source: 'server' | 'client'; location: string | null; message: string; stack: string | null; requestId: string | null; status: number | null; user: ObserveUserRef | null }[]
  affectedUsers: { user: ObserveUserRef | null; count: number; lastSeen: string }[]
}

export interface LoginsData {
  window: ObserveWindow
  tiles: { logins: number; failedLogins: number; uniqueUsers: number }
  series: { ts: string; success: number; failed: number }[]
  recent: { ts: string; email: string; outcome: string; ip: string | null; userAgent: string | null; user: ObserveUserRef | null }[]
  failedByEmail: { email: string; attempts: number; lastAt: string; outcomes: string[] }[]
}

export interface MetricPoint { ts: string; value: number }
export interface InfraData {
  window: ObserveWindow; available: boolean; reason?: string; service?: string
  cpu?: MetricPoint[]; memoryGb?: MetricPoint[]; networkRxGb?: MetricPoint[]; networkTxGb?: MetricPoint[]
  deployments?: { id: string; status: string; createdAt: string; commitMessage: string | null; commitAuthor: string | null; branch: string | null }[]
}

export interface HealthData { ok: boolean; uptime_s: number; db: 'ok' | 'down'; buffer: { pending: number; dropped: number; flushes: number; failures: number } }

export interface ObserveResponse<T> { status: 'success'; data: T }
