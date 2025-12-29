// TypeScript interfaces for API responses
// Same as customer-app but with admin-specific types

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  password_hash?: string; // Intentionally exposed in API (security vulnerability)
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_bid: number;
  end_time: string;
  status: 'active' | 'ended' | 'cancelled';
  created_by: string;
  created_at: string;
  creator?: User;
}

export interface Bid {
  id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  user?: User;
  auction?: Auction;
}

export interface ApiError {
  error: string;
  message: string;
  stack?: string; // Intentionally exposed (security vulnerability)
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Admin-specific types
export interface DashboardStats {
  totalAuctions: number;
  activeAuctions: number;
  totalUsers: number;
  totalBids: number;
  recentActivity?: Array<{
    type: 'auction' | 'bid' | 'user';
    description: string;
    timestamp: string;
  }>;
}

