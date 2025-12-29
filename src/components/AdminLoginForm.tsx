'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../lib/auth';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@design-system/components';
import styles from './AdminLoginForm.module.css';

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Intentionally no input validation (security vulnerability)
      await login({ email, password });
      router.push('/');
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      setError(err instanceof Error ? err.message : 'Login failed');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle className={styles.title}>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorMessage} role="alert">
                {error}
              </div>
            )}

            <Input
              label="Email"
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />

            <Input
              label="Password"
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

