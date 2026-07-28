import React from 'react';
import { useUserWorkspace } from '../context/UserWorkspaceContext';
import { Reports } from '../../components/reports/Reports';

/** User reports page — markup/CSS preserved from legacy UserView */
export function UserReportsPage() {
  const { assignedUnits } = useUserWorkspace();

  return (
    <>
      <Reports units={assignedUnits} />
    </>
  );
}
