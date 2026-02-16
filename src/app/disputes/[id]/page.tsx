import DisputeDetailPageContent from '../../../components/DisputeDetailPageContent';

interface DisputeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Required for static export - return empty array since IDs are dynamic
export function generateStaticParams() {
  // With static export, we can't fetch IDs at build time
  // Return empty array - pages will be generated on-demand at runtime
  return [{ id: 'placeholder' }];
}

export default async function DisputeDetailPage({ params }: DisputeDetailPageProps) {
  const { id } = await params;
  
  return <DisputeDetailPageContent id={id} />;
}
