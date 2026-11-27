import apiClient from "./apiClient";
import type { ApiEnvelope } from "./types/finance";
import type { ParentPayments } from "./types/payments";

/** What the family owes and has paid (parent portal). 404 while the server has it switched off. */
export const getParentPayments = () =>
  apiClient<ApiEnvelope<ParentPayments>>("/parent-portal/payments");
