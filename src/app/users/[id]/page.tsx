import UserDetailPageContent from '../../../components/UserDetailPageContent';

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Required for static export - return empty array since IDs are dynamic
export function generateStaticParams() {
  // With static export, we can't fetch IDs at build time
  // Return empty array - pages will be generated on-demand at runtime
  return [];
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  
  return <UserDetailPageContent id={id} />;
}

