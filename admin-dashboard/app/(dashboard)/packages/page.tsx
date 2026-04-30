import PackagesClient from '@/components/PackagesClient';
import { fetchPackages } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const rows = await fetchPackages().catch(() => []);
  return <PackagesClient initialPackages={rows} />;
}
