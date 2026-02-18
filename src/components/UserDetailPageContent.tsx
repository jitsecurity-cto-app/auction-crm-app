'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { User } from '../types';
import UserForm from './UserForm';
import { useResolvedParam } from '../hooks/useResolvedParam';

interface UserDetailPageContentProps {
  id: string;
}

export default function UserDetailPageContent({ id: rawId }: UserDetailPageContentProps) {
  const id = useResolvedParam(rawId);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (id) {
      loadUser();
    }
  }, [id, router]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await api.getUserById(id);
      setUser(response || null);
    } catch (err) {
      console.error('Error loading user:', err);
      alert('Failed to load user');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: {
    name: string;
    email: string;
    role: 'user' | 'admin';
  }) => {
    if (!id) return;
    await api.updateUser(id, data);
    router.push('/users');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">User not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/users')}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Edit User</h1>
          </div>
          <button
            onClick={() => router.push('/users')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>

      <div className="p-8 max-w-2xl">
        <UserForm
          user={user}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/users')}
        />
      </div>
    </div>
  );
}
