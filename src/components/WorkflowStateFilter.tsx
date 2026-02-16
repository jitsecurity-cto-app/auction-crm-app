'use client';

interface WorkflowStateFilterProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function WorkflowStateFilter({
  value = '',
  onChange,
  label = 'Workflow State',
}: WorkflowStateFilterProps) {
  const workflowStates: Array<{ value: string; label: string }> = [
    { value: '', label: 'All States' },
    { value: 'active', label: 'Active Bidding' },
    { value: 'pending_sale', label: 'Pending Sale' },
    { value: 'shipping', label: 'Shipped' },
    { value: 'complete', label: 'Complete' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700">{label}:</span>
      <div className="flex gap-1">
        {workflowStates.map((state) => (
          <button
            key={state.value}
            onClick={() => onChange(state.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              value === state.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {state.label}
          </button>
        ))}
      </div>
    </div>
  );
}
