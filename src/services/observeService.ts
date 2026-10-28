// src/services/observeService.ts
import apiClient from './apiClient'
import type {
  ActivityData, AlertIncident, AlertIncidentsData, AlertRule, AlertRulePatch, AlertStatusData, AlertTestResult,
  ErrorGroupData, ErrorRangeData, ErrorsData, FeaturesData, HealthData, InfraData, LoginsData,
  ObserveResponse, OverviewData, ScannerData, ScannerSeriesData, UserDetailData, UsersData, WindowKey,
} from './types/observe'

const unwrap = async <T>(p: Promise<ObserveResponse<T>>): Promise<T> => (await p).data
const w = (window: WindowKey) => `?window=${encodeURIComponent(window)}`

export const getOverview = (window: WindowKey) => unwrap(apiClient<ObserveResponse<OverviewData>>(`/observe/overview${w(window)}`))
export const getActivity = (window: WindowKey) => unwrap(apiClient<ObserveResponse<ActivityData>>(`/observe/activity${w(window)}`))
export const getUsers = (window: WindowKey) => unwrap(apiClient<ObserveResponse<UsersData>>(`/observe/users${w(window)}`))
export const getUser = (id: string, window: WindowKey) => unwrap(apiClient<ObserveResponse<UserDetailData>>(`/observe/users/${encodeURIComponent(id)}${w(window)}`))
export const getFeatures = (window: WindowKey) => unwrap(apiClient<ObserveResponse<FeaturesData>>(`/observe/features${w(window)}`))
export const getErrors = (window: WindowKey) => unwrap(apiClient<ObserveResponse<ErrorsData>>(`/observe/errors${w(window)}`))
export const getErrorsRange = (from: string, to: string) =>
  unwrap(apiClient<ObserveResponse<ErrorRangeData>>(`/observe/errors/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`))
export const getErrorGroup = (fingerprint: string, window: WindowKey) => unwrap(apiClient<ObserveResponse<ErrorGroupData>>(`/observe/errors/${encodeURIComponent(fingerprint)}${w(window)}`))
export const getLogins = (window: WindowKey) => unwrap(apiClient<ObserveResponse<LoginsData>>(`/observe/logins${w(window)}`))
export const getInfra = (window: WindowKey) => unwrap(apiClient<ObserveResponse<InfraData>>(`/observe/infra${w(window)}`))
const userParam = (userId: string | null) => (userId ? `&user=${encodeURIComponent(userId)}` : '')
export const getScanner = (window: WindowKey, userId: string | null = null) =>
  unwrap(apiClient<ObserveResponse<ScannerData>>(`/observe/scanner${w(window)}${userParam(userId)}`))
export const getScannerSeries = (window: WindowKey, userId: string | null, method: string, route: string) =>
  unwrap(apiClient<ObserveResponse<ScannerSeriesData>>(`/observe/scanner/series${w(window)}${userParam(userId)}&method=${encodeURIComponent(method)}&route=${encodeURIComponent(route)}`))
export const getHealth = () => apiClient<HealthData>('/health')

// Alerts. Status and rules don't depend on the window; incidents do.
export const getAlertStatus = () => unwrap(apiClient<ObserveResponse<AlertStatusData>>('/observe/alerts/status'))
export const getAlertIncidents = (window: WindowKey) => unwrap(apiClient<ObserveResponse<AlertIncidentsData>>(`/observe/alerts/incidents${w(window)}`))
export const getAlertIncident = async (id: string) =>
  (await unwrap(apiClient<ObserveResponse<{ incident: AlertIncident }>>(`/observe/alerts/incidents/${encodeURIComponent(id)}`))).incident
export const deleteAlertIncident = (id: string) =>
  unwrap(apiClient<ObserveResponse<{ id: string }>>(`/observe/alerts/incidents/${encodeURIComponent(id)}`, { method: 'DELETE' }))
export const getAlertRules = async () => (await unwrap(apiClient<ObserveResponse<{ rules: AlertRule[] }>>('/observe/alerts/rules'))).rules
export const updateAlertRule = async (id: string, patch: AlertRulePatch) =>
  (await unwrap(apiClient<ObserveResponse<{ rule: AlertRule }>>(`/observe/alerts/rules/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }))).rule
export const resetAlertRule = async (id: string) =>
  (await unwrap(apiClient<ObserveResponse<{ rule: AlertRule }>>(`/observe/alerts/rules/${encodeURIComponent(id)}/settings`, { method: 'DELETE' }))).rule
export const sendTestAlert = (channel: 'email' | 'push' | 'both') =>
  unwrap(apiClient<ObserveResponse<AlertTestResult>>('/observe/alerts/test', { method: 'POST', body: { channel } }))
