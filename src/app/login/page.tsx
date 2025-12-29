'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../lib/auth';
import AdminLoginForm from '../../components/AdminLoginForm';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  return (
    <main style={{ minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
      <AdminLoginForm />
    </main>
  );
}

