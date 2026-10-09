import apiClient from "./apiClient";
import {
  AllParentsResponse,
  ParentPayload,
  ParentResponse,
} from "./types/parent";

// The API sends fullName now; the fallback covers a backend deployed without
// it, so pickers and the parentName saved on a linked relation get a name.
const withFullName = (p: ParentPayload): ParentPayload => ({
  ...p,
  fullName: p.fullName || [p.firstName, p.lastName].filter(Boolean).join(" "),
});

/**
 * Fetch all parents for the authenticated user's school
 * GET /parents
 */
export const getAllParents = async (): Promise<AllParentsResponse> => {
  const res = await apiClient<AllParentsResponse>(`/parents`);
  return { ...res, data: res.data?.map(withFullName) };
};

/**
 * Fetch a single parent by ID
 * @param id The parent’s user ID (UUID)
 */
export const getParentById = async (
  id: string
): Promise<ParentResponse> => {
  const res = await apiClient<ParentResponse>(`/parents/${encodeURIComponent(id)}`);
  return { ...res, data: res.data && withFullName(res.data) };
};
