import OverviewClient from '@/components/OverviewClient';
import { fetchAdminOverview, fetchOrders } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const [overview, orders] = await Promise.all([
    fetchAdminOverview(),
    fetchOrders().catch(() => []),
  ]);
  return <OverviewClient initialOverview={overview} initialOrders={orders} />;
}
