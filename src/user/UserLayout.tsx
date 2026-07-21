import React from 'react';
import {
  UserWorkspaceProvider,
  UserWorkspaceProps,
  useUserWorkspace,
} from './context/UserWorkspaceContext';

function UserLayoutInner({ children }: { children: React.ReactNode }) {
  const { activeTab } = useUserWorkspace();

  return (
    <div
      className={`w-full ${
        activeTab === 'devices'
          ? 'max-w-6xl mx-auto px-2 md:px-4 h-full flex flex-col overflow-hidden py-1 space-y-3'
          : activeTab === 'dashboard' || activeTab === 'reports'
            ? 'max-w-none h-full flex flex-col overflow-hidden px-0 py-0 space-y-0'
            : 'max-w-6xl mx-auto px-2 md:px-4 py-6 md:py-8 space-y-8'
      }`}
    >
      {children}
    </div>
  );
}

export function UserLayout({
  children,
  ...props
}: UserWorkspaceProps & { children: React.ReactNode }) {
  return (
    <UserWorkspaceProvider {...props}>
      <UserLayoutInner>{children}</UserLayoutInner>
    </UserWorkspaceProvider>
  );
}
