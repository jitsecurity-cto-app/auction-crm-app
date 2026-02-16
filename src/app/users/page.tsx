'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../lib/auth';
import { api } from '../../lib/api';
import { User } from '../../types';
import UserTable from '../../components/UserTable';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // API returns array directly, not wrapped in { data: [...] }
      const response = await api.getUsers();
      setUsers(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      // Note: deleteUser might not exist in API, but we'll try
      await api.deleteUser(id);
      // Reload users after deletion
      await loadUsers();
    } catch (err) {
      // If delete endpoint doesn't exist, just show error
      alert(err instanceof Error ? err.message : 'Failed to delete user. Endpoint may not be available.');
      console.error('Error deleting user:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">Manage platform users and their roles</p>
      </div>

      <div className="p-8">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6">
          <p className="text-sm font-medium text-amber-800">Security Note:</p>
          <p className="text-sm text-amber-700 mt-1">
            This page intentionally displays sensitive user data (password hashes) and allows editing without proper authorization checks (IDOR vulnerability).
          </p>
        </div>

        <UserTable users={users} onDelete={handleDelete} />
      </div>
    </div>
  );
}
