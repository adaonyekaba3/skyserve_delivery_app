import nextDynamic from 'next/dynamic';
import { fetchDrones } from '@/lib/api.server';

const LiveMap = nextDynamic(() => import('@/components/LiveMap'), {
  ssr: false,
});

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const drones = await fetchDrones().catch(() => []);
  return <LiveMap initialDrones={drones} />;
}
