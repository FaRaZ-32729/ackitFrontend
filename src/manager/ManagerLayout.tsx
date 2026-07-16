import React from 'react';
import {
  ManagerWorkspaceProvider,
  ManagerWorkspaceProps,
  useManagerWorkspace,
} from './context/ManagerWorkspaceContext';
import { ManagerModals } from './components/ManagerModals';

function ManagerLayoutInner({ children }: { children: React.ReactNode }) {
  const { activeTab } = useManagerWorkspace();

  return (
    <div
      className={`w-full ${
        activeTab === 'dashboard' ||
        activeTab === 'overview' ||
        activeTab === 'organizations' ||
        activeTab === 'venues' ||
        activeTab === 'users' ||
        activeTab === 'devices' ||
        activeTab === 'reports' ||
        activeTab === 'ac-brands'
          ? 'max-w-none h-full flex flex-col overflow-hidden px-0 py-0 space-y-0'
          : 'max-w-6xl mx-auto p-6 space-y-8'
      }`}
    >
      {children}
      <ManagerModals />
    </div>
  );
}

/** Manager console shell — layout + workspace state + shared modals */
export function ManagerLayout({
  children,
  ...props
}: ManagerWorkspaceProps & { children: React.ReactNode }) {
  return (
    <ManagerWorkspaceProvider {...props}>
      <ManagerLayoutInner>{children}</ManagerLayoutInner>
    </ManagerWorkspaceProvider>
  );
}
