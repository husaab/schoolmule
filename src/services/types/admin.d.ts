export interface PendingApprovalUser {
  user_id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  school: string;
  created_at: string;
}

export interface PendingApprovalResponse {
  success: boolean;
  users: PendingApprovalUser[];
}

export interface AdminApprovalRequest {
  userId: string;
}

export interface AdminApprovalResponse {
  success: boolean;
  message: string;
}

export interface ResendApprovalRequest {
  userId: string;
}

export interface ResendApprovalResponse {
  success: boolean;
  message: string;
}
