import DroneList from '@/components/DroneList';
import { fetchDrones } from '@/lib/api.server';

export default async function FleetPage() {
  const drones = await fetchDrones();
  return <DroneList initialDrones={drones} />;
}
