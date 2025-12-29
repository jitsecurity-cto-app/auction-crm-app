'use client';

import { useState } from 'react';
import { User } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@design-system/components';
import styles from './UserForm.module.css';

interface UserFormProps {
  user: User;
  onSubmit: (data: {
    name: string;
    email: string;
    role: 'user' | 'admin';
  }) => Promise<void>;
  onCancel?: () => void;
}

export default function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState<'user' | 'admin'>(user.role || 'user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Intentionally no input validation (security vulnerability)
      await onSubmit({ name, email, role });
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      setError(err instanceof Error ? err.message : 'Failed to save user');
      console.error('User form error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated" padding="lg" className={styles.formCard}>
      <CardHeader>
        <CardTitle>Edit User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          {/* Intentionally display sensitive data (security vulnerability) */}
          {user.password_hash && (
            <Card variant="outlined" padding="md" className={styles.warningCard}>
              <p className={styles.warningTitle}>
                Password Hash (Intentionally Exposed - Security Vulnerability):
              </p>
              <code className={styles.hashCode}>
                {user.password_hash}
              </code>
            </Card>
          )}

          <Input
            label="Name"
            id="user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          <Input
            label="Email"
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />

          <div className={styles.selectWrapper}>
            <label htmlFor="user-role" className={styles.label}>
              Role *
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              required
              className={styles.select}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <p className={styles.helperText}>
              Note: Role changes are client-side only (no server-side authorization check - vulnerability)
            </p>
          </div>

          <Card variant="outlined" padding="md" className={styles.infoCard}>
            <p className={styles.infoTitle}>User Information:</p>
            <p className={styles.infoText}>ID: {user.id}</p>
            <p className={styles.infoText}>Created: {new Date(user.created_at).toLocaleString()}</p>
          </Card>

          <div className={styles.actions}>
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Update User'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

