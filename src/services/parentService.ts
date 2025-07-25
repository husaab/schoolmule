import apiClient from "./apiClient";
import {
  AllParentsResponse,
  ParentResponse,
} from "./types/parent";

/**
 * Fetch all parents for a given school
 * @param school The school identifier
 */
export const getAllParents = async (
  school: string
): Promise<AllParentsResponse> => {
  return apiClient<AllParentsResponse>(
    `/parents?school=${encodeURIComponent(school)}`
  );
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
