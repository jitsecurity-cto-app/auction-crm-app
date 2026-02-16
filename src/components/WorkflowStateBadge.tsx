'use client';

type WorkflowState = 'active' | 'pending_sale' | 'shipping' | 'complete';

interface WorkflowStateBadgeProps {
  state?: WorkflowState | string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WorkflowStateBadge({ state, size = 'sm' }: WorkflowStateBadgeProps) {
  const getClasses = (workflowState: string): string => {
    switch (workflowState) {
      case 'complete':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'active':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'pending_sale':
      case 'shipping':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20';
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

  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs';

  if (!state) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-600/20 ${sizeClasses}`}>
        Unknown
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${getClasses(state)} ${sizeClasses}`}>
      {getLabel(state)}
    </span>
  );
}
