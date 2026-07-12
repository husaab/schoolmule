// File: src/services/agendaService.ts

import apiClient from './apiClient';
import type {
  AgendasResponse,
  AgendaResponse,
  AgendaDetailResponse,
  AgendaMonthResponse,
  AgendaCustomPageResponse,
  AgendaCustomPagesResponse,
  AgendaManifestResponse,
  AgendaRenderedPagesResponse,
  AgendaCloneResponse,
  AgendaReorderUpdate,
  AgendaAnchor
} from './types/agenda';

export const getAgendasBySchool = async (school: string): Promise<AgendasResponse> => {
  return apiClient<AgendasResponse>(`/agendas?school=${encodeURIComponent(school)}`);
};

export const createAgenda = async (payload: {
  school: string;
  academicYear: string;
  title?: string;
  footerText?: string;
}): Promise<AgendaResponse> => {
  return apiClient<AgendaResponse, typeof payload>('/agendas', { method: 'POST', body: payload });
};

export const getAgendaById = async (agendaId: string): Promise<AgendaDetailResponse> => {
  return apiClient<AgendaDetailResponse>(`/agendas/${encodeURIComponent(agendaId)}`);
};

export const updateAgenda = async (
  agendaId: string,
  payload: {
    title?: string;
    footerText?: string;
    includeNotesPage?: boolean;
    evaluationSubjects?: string[];
  }
): Promise<AgendaResponse> => {
  return apiClient<AgendaResponse, typeof payload>(`/agendas/${encodeURIComponent(agendaId)}`, {
    method: 'PATCH',
    body: payload
  });
};

export const deleteAgenda = async (agendaId: string): Promise<AgendaResponse> => {
  return apiClient<AgendaResponse>(`/agendas/${encodeURIComponent(agendaId)}`, { method: 'DELETE' });
};

export const cloneAgenda = async (
  agendaId: string,
  academicYear: string
): Promise<AgendaCloneResponse> => {
  return apiClient<AgendaCloneResponse, { academicYear: string }>(
    `/agendas/${encodeURIComponent(agendaId)}/clone`,
    { method: 'POST', body: { academicYear } }
  );
};

export const updateAgendaMonth = async (
  agendaId: string,
  month: number,
  quotes: string[]
): Promise<AgendaMonthResponse> => {
  return apiClient<AgendaMonthResponse, { quotes: string[] }>(
    `/agendas/${encodeURIComponent(agendaId)}/months/${month}`,
    { method: 'PATCH', body: { quotes } }
  );
};

/**
 * Multipart upload (FormData) — mirrors uploadSchoolAsset's pattern.
 */
export const uploadAgendaPage = async (
  agendaId: string,
  file: File,
  anchor: AgendaAnchor,
  anchorMonth?: number | null,
  title?: string
): Promise<AgendaCustomPageResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('anchor', anchor);
  if (anchor === 'month' && anchorMonth) formData.append('anchorMonth', String(anchorMonth));
  if (title) formData.append('title', title);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const response = await fetch(`${baseURL}/agendas/${encodeURIComponent(agendaId)}/pages`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      const { useUserStore } = await import('@/store/useUserStore');
      const { useNotificationStore } = await import('@/store/useNotificationStore');
      useUserStore.getState().clearUser();
      useNotificationStore.getState().showNotification('Your login session has expired, please login again', 'error');
      window.location.href = '/';
    }
    throw new Error(errorBody.message || 'Upload failed');
  }

  return response.json() as Promise<AgendaCustomPageResponse>;
};

export const reorderAgendaPages = async (
  agendaId: string,
  updates: AgendaReorderUpdate[]
): Promise<AgendaCustomPagesResponse> => {
  return apiClient<AgendaCustomPagesResponse, AgendaReorderUpdate[]>(
    `/agendas/${encodeURIComponent(agendaId)}/pages/reorder`,
    { method: 'PATCH', body: updates }
  );
};

export const renameAgendaPage = async (
  agendaId: string,
  pageId: string,
  title: string
): Promise<AgendaCustomPageResponse> => {
  return apiClient<AgendaCustomPageResponse, { title: string }>(
    `/agendas/${encodeURIComponent(agendaId)}/pages/${encodeURIComponent(pageId)}`,
    { method: 'PATCH', body: { title } }
  );
};

export const deleteAgendaPage = async (
  agendaId: string,
  pageId: string
): Promise<AgendaCustomPageResponse> => {
  return apiClient<AgendaCustomPageResponse>(
    `/agendas/${encodeURIComponent(agendaId)}/pages/${encodeURIComponent(pageId)}`,
    { method: 'DELETE' }
  );
};

export const getAgendaPageSignedUrl = async (
  agendaId: string,
  pageId: string
): Promise<string | null> => {
  try {
    const response = await apiClient<{ status: string; data: { signedUrl: string } }>(
      `/agendas/${encodeURIComponent(agendaId)}/pages/${encodeURIComponent(pageId)}/signed-url`
    );
    return response.data.signedUrl || null;
  } catch (error) {
    console.error('Error getting page signed URL:', error);
    return null;
  }
};

export const getAgendaManifest = async (agendaId: string): Promise<AgendaManifestResponse> => {
  return apiClient<AgendaManifestResponse>(`/agendas/${encodeURIComponent(agendaId)}/manifest`);
};

export const renderAgendaMonth = async (
  agendaId: string,
  month: number
): Promise<AgendaRenderedPagesResponse> => {
  return apiClient<AgendaRenderedPagesResponse>(
    `/agendas/${encodeURIComponent(agendaId)}/render/month/${month}`
  );
};

export const generateAgenda = async (agendaId: string): Promise<AgendaResponse> => {
  return apiClient<AgendaResponse>(`/agendas/${encodeURIComponent(agendaId)}/generate`, {
    method: 'POST'
  });
};

/**
 * Signed URL for the assembled agenda PDF (10 minutes).
 */
export const getGeneratedAgendaUrl = async (filePath: string): Promise<string | null> => {
  try {
    const response = await apiClient<{ url: string }>(
      `/agendas/signed-url?path=${encodeURIComponent(filePath)}`
    );
    return response.url || null;
  } catch (error) {
    console.error('Error getting agenda signed URL:', error);
    return null;
  }
};
