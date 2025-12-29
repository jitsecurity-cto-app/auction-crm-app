'use client';

import { Badge } from '@design-system/components';

type WorkflowState = 'active' | 'pending_sale' | 'shipping' | 'complete';

interface WorkflowStateBadgeProps {
  state?: WorkflowState | string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WorkflowStateBadge({ state, size = 'sm' }: WorkflowStateBadgeProps) {
  if (!state) {
    return (
      <Badge variant="default" size={size}>
        Unknown
      </Badge>
    );
  }

  const getVariant = (workflowState: string): 'success' | 'info' | 'warning' | 'default' => {
    switch (workflowState) {
      case 'complete':
        return 'success';
      case 'active':
        return 'info';
      case 'pending_sale':
      case 'shipping':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getLabel = (workflowState: string): string => {
    switch (workflowState) {
      case 'active':
        return 'Active Bidding';
      case 'pending_sale':
        return 'Pending Sale';
      case 'shipping':
        return 'Shipped';
      case 'complete':
        return 'Complete';
      default:
        return workflowState;
    }
  };

  return (
    <Badge variant={getVariant(state)} size={size}>
      {getLabel(state)}
    </Badge>
  );
}
