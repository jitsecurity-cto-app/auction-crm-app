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
        <script dangerouslySetInnerHTML={{ __html: `window.__ORIGINAL_PATHNAME__=window.location.pathname;if(window.location.pathname.indexOf('/placeholder')===-1){var _hrs=history.replaceState;history.replaceState=function(s,t,u){if(u&&typeof u==='string'&&u.indexOf('/placeholder')!==-1){u=window.__ORIGINAL_PATHNAME__;};return _hrs.call(this,s,t,u);};setTimeout(function(){history.replaceState=_hrs;},5000);}` }} />
      </head>
      <body className="min-h-screen bg-slate-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
