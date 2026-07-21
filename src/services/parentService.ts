import apiClient from "./apiClient";
import {
  AllParentsResponse,
  ParentResponse,
} from "./types/parent";

/**
 * Fetch all parents for the authenticated user's school
 * GET /parents
 */
export const getAllParents = async (): Promise<AllParentsResponse> => {
  return apiClient<AllParentsResponse>(`/parents`);
};

/**
 * Fetch a single parent by ID
 * @param id The parent’s user ID (UUID)
 */
export const getParentById = async (
  id: string
): Promise<ParentResponse> => {
  return apiClient<ParentResponse>(`/parents/${encodeURIComponent(id)}`);
};
