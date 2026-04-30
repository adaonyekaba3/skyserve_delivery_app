import VendorsClient from '@/components/VendorsClient';
import { fetchVendors } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
  const vendors = await fetchVendors().catch(() => []);
  return <VendorsClient initialVendors={vendors} />;
}
