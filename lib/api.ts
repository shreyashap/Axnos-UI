import { useAuth } from "@/context/AuthContext";
const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  data:{
    accessToken: string;
    userRes: {
      id: string;
      email: string;
      name: string;
      createdAt : string
    };
  }
}

export interface ErrorResponse {
  detail: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Sign Up
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail || 'Sign up failed');
    }

    return response.json();
  }

  // Sign In
  async signIn(data: SignInData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials : "include"
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail || 'Sign in failed');
    }
    return response.json();
  }

  // Get Current User
  async getCurrentUser(token: string) {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return response.json();
  }

  // Sign Out (optional - mainly client-side)
  signOut() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
}

export const apiService = new ApiService(API_BASE_URL);