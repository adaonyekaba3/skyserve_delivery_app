import InsightsClient from '@/components/InsightsClient';
import { fetchAdminInsights } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const insights = await fetchAdminInsights();
  return <InsightsClient initialInsights={insights} />;
}
