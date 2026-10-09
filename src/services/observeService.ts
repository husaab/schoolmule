// src/services/observeService.ts
import apiClient from './apiClient'
import type {
  ActivityData, ErrorGroupData, ErrorRangeData, ErrorsData, FeaturesData, HealthData, InfraData, LoginsData,
  ObserveResponse, OverviewData, UserDetailData, UsersData, WindowKey,
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
export const getHealth = () => apiClient<HealthData>('/health')
