import BankTransfersClient from '@/components/BankTransfersClient';
import { fetchBankTransfers } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export default async function BankTransfersPage() {
  const rows = await fetchBankTransfers('PENDING_REVIEW').catch(() => []);
  return <BankTransfersClient initialRows={rows} />;
}
