'use client';

import { useState, useEffect } from 'react';
import { getAuthUser, isAuthenticated, logout } from '../lib/auth';
import { Navbar as DesignSystemNavbar } from '@design-system/components';

export default function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [mounted, setMounted] = useState(false);

  // Only check authentication on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
    setUser(getAuthUser());
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (!mounted) {
    // Return consistent structure on server and client to avoid hydration mismatch
    return (
      <DesignSystemNavbar
        brand="CRM Admin Panel"
        links={[]}
        authenticated={false}
      />
    );
  }

  const links = authenticated
    ? [
        { href: '/auctions', label: 'Auctions' },
        { href: '/users', label: 'Users' },
      ]
    : [];

  return (
    <DesignSystemNavbar
      brand="CRM Admin Panel"
      links={links}
      authenticated={authenticated}
      user={user || undefined}
      onLogout={handleLogout}
    />
  );
}

