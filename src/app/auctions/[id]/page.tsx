import AuctionDetailPageContent from '../../../components/AuctionDetailPageContent';

interface AuctionDetailPageProps {
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

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  
  return <AuctionDetailPageContent id={id} />;
}

