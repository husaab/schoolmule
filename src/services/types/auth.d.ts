// services/types/auth.d.ts
export interface User {
    userId: string;
    username: string;
    email: string;
    role: string;
    school: string;
}
  
export interface ErrorResponse {
    message: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  school: string;
  role: string;
}

export interface RegisterResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    userId: string;
    username: string;
    fullName: string;
    email: string;
    school: string;
    role: string;
    isVerified: boolean;
    isVerifiedSchool: boolean;
    emailToken: string;
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
    token: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Response from backend after login
export interface LoginResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    userId: string;
    username: string;
    fullName: string;
    email: string;
    school: string;
    role: string;
    isVerified: boolean;
    isVerifiedSchool: boolean;
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
    token: string;
  };
}