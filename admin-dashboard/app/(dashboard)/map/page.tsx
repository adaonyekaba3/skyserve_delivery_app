import dynamic from 'next/dynamic';
import { fetchDrones } from '@/lib/api.server';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export default async function MapPage() {
  const drones = await fetchDrones();
  return <LiveMap drones={drones} />;
}
