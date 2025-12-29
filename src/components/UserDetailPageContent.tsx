'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { User } from '../types';
import UserForm from './UserForm';

interface UserDetailPageContentProps {
  id: string;
}

export default function UserDetailPageContent({ id }: UserDetailPageContentProps) {
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
      <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <UserForm
        user={user}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/users')}
      />
    </div>
  );
}
