import DashboardShell from '@/components/DashboardShell';
import RealtimeBootstrap from '@/components/RealtimeBootstrap';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <RealtimeBootstrap />
      {children}
    </DashboardShell>
  );
}
