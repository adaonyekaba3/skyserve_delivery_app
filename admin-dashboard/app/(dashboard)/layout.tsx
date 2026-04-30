import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import RealtimeBootstrap from '@/components/RealtimeBootstrap';
import { fetchMe } from '@/lib/api.server';

const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await fetchMe();

  if (!me && !DEV_AUTH_BYPASS) {
    redirect('/not-authorized');
  }

  if (me && me.role !== 'ADMIN') {
    redirect('/not-authorized');
  }

  return (
    <DashboardShell>
      <RealtimeBootstrap />
      {children}
    </DashboardShell>
  );
}
