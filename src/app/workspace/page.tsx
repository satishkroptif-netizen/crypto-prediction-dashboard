'use client';

import Link from 'next/link';
import WorkspaceShell from '@/components/WorkspaceShell';
import DashboardView from '@/components/DashboardView';

export const dynamic = 'force-dynamic';

export default function WorkspacePage() {
  return (
    <WorkspaceShell active="dashboard">
      <DashboardView />
    </WorkspaceShell>
  );
}
