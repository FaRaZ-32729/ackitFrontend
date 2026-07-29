import React from 'react';
import { Reports } from '../../components/reports/Reports';
import { useUserWorkspace } from '../context/UserWorkspaceContext';

/**
 * Sub-user energy reports — org/venue dropdowns limited to assigned access only.
 */
export function UserReportsPage() {
  const { orgs, venues } = useUserWorkspace();
  return <Reports orgs={orgs} venues={venues} />;
}
