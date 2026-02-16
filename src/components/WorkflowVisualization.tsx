'use client';

type WorkflowState = 'active' | 'pending_sale' | 'shipping' | 'complete';

interface WorkflowVisualizationProps {
  currentState: WorkflowState;
}

const workflowSteps = [
  { id: 'active', label: 'Active Bidding', key: 'active' as WorkflowState },
  { id: 'pending_sale', label: 'Pending Sale', key: 'pending_sale' as WorkflowState },
  { id: 'shipping', label: 'Shipped', key: 'shipping' as WorkflowState },
  { id: 'complete', label: 'Complete', key: 'complete' as WorkflowState },
];

export default function WorkflowVisualization({ currentState }: WorkflowVisualizationProps) {
  const getStepStatus = (stepKey: WorkflowState) => {
    const currentIndex = workflowSteps.findIndex((s) => s.key === currentState);
    const stepIndex = workflowSteps.findIndex((s) => s.key === stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {workflowSteps.map((step, index) => {
        const status = getStepStatus(step.key);
        const isLast = index === workflowSteps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  status === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : status === 'active'
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {status === 'completed' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  status === 'completed'
                    ? 'text-emerald-600'
                    : status === 'active'
                    ? 'text-primary-600'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-12 mx-2 mt-[-1.25rem] ${
                  status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
