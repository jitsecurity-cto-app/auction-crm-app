'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <>
      {!isLoginPage && <Sidebar />}
      <main className={isLoginPage ? '' : 'lg:ml-64 min-h-screen'}>
        {children}
      </main>
    </>
  );
}
