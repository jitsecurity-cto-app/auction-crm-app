// Authentication utilities (localStorage token management)
// Intentionally insecure - no token expiration check, weak storage (security vulnerability)
// Admin-specific: checks for admin role but client-side only (vulnerability)

import { AuthResponse, User } from '../types';
import { api } from './api';
import { LoginRequest } from '../types';
import { identifyUser, resetAnalytics } from './analytics';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

/**
 * Store authentication token and user data
 * Intentionally stores in localStorage (XSS vulnerability)
 */
export function setAuth(token: string, user: User): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get stored authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user data
 */
export function getAuthUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userData = localStorage.getItem(USER_KEY);
  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 * Intentionally no token expiration check (security vulnerability)
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Check if user is admin
 * Client-side only check - no server-side validation (security vulnerability)
 */
export function isAdmin(): boolean {
  const user = getAuthUser();
  return user?.role === 'admin';
}

/**
 * Check if user is authenticated AND is admin
 * Client-side only check (security vulnerability)
 */
export function isAuthenticatedAdmin(): boolean {
  return isAuthenticated() && isAdmin();
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Login with email and password
 * Intentionally no input validation (security vulnerability)
 * No server-side role check (security vulnerability)
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  // Intentionally log credentials (security vulnerability)
  console.log('Admin login attempt:', {
    email: data.email,
    passwordLength: data.password.length,
  });

  const response = await api.post<AuthResponse>('/auth/login', data);
  
  // Client-side role check only (security vulnerability)
  // Server should verify admin role, but we're not checking here
  if (response.user && response.user.role !== 'admin') {
    // Still allow login but warn (intentional vulnerability)
    console.warn('User is not an admin, but allowing access (vulnerability)');
  }
  
  // Store token and user data
  setAuth(response.token, response.user);
  identifyUser(String(response.user.id), { email: response.user.email, name: response.user.name, role: response.user.role });

  // Intentionally log token (security vulnerability)
  console.log('Login successful, token stored:', response.token.substring(0, 20) + '...');
  
  return response;
}

/**
 * Logout current user
 */
export function logout(): void {
  resetAnalytics();
  clearAuth();
}

/**
 * Verify current token (optional - not used in basic flow)
 */
export async function verifyToken(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await (api as any).post(
      '/auth/verify',
      {},
      true
    ) as { valid: boolean; user: User };
    return response.valid ? response.user : null;
  } catch {
    return null;
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<User | null> {
  return verifyToken();
}

/**
 * Get token (intentionally exposed - security vulnerability)
 */
export function getToken(): string | null {
  return getAuthToken();
}

