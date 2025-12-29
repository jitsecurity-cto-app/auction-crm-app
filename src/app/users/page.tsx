'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../lib/auth';
import { api } from '../../lib/api';
import { User } from '../../types';
import UserTable from '../../components/UserTable';
import { Card } from '@design-system/components';
import styles from './page.module.css';

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
      <div className={styles.loading}>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>User Management</h1>

      {error && (
        <Card variant="outlined" padding="md" className={styles.errorCard}>
          <p className={styles.errorText}>{error}</p>
        </Card>
      )}

      <Card variant="outlined" padding="md" className={styles.warningCard}>
        <p className={styles.warningTitle}>Security Note:</p>
        <p className={styles.warningText}>
          This page intentionally displays sensitive user data (password hashes) and allows editing without proper authorization checks (IDOR vulnerability).
        </p>
      </Card>

      <UserTable users={users} onDelete={handleDelete} />
    </div>
  );
}

