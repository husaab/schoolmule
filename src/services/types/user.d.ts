export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    school: string;
}


export interface UserResponse {
  status: string;
  user: UserPayload;
  message?: string;
}


export interface UserPayload {
  userId: string;
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  role: string;
  createdAt: string;
  lastModifiedAt: string;
  isVerified: boolean;
  emailToken: string;
}

export interface AllUsersResponse {
  status: string;
  users: UserPayload[];
  message?: string;
}