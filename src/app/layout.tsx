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
      <body>{children}</body>
    </html>
  );
}

