import AppShell from '../components/AppShell';
import './globals.css';

export const metadata = {
  title: 'Auction Platform - CRM',
  description: 'Admin panel for auction platform management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `window.__ORIGINAL_PATHNAME__=window.location.pathname;` }} />
      </head>
      <body className="min-h-screen bg-slate-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
