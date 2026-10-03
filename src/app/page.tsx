'use client';

import WorkspaceShell from '@/components/WorkspaceShell';
import DashboardView from '@/components/DashboardView';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <WorkspaceShell active="dashboard">
      <DashboardView />
    </WorkspaceShell>
  );
}
