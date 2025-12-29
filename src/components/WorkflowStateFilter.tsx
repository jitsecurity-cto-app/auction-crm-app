'use client';

import { Input } from '@design-system/components';
import styles from './WorkflowStateFilter.module.css';

type WorkflowState = 'active' | 'pending_sale' | 'shipping' | 'complete';

interface WorkflowStateFilterProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function WorkflowStateFilter({ 
  value = '', 
  onChange, 
  label = 'Workflow State' 
}: WorkflowStateFilterProps) {
  const workflowStates: Array<{ value: string; label: string }> = [
    { value: '', label: 'All States' },
    { value: 'active', label: 'Active Bidding' },
    { value: 'pending_sale', label: 'Pending Sale' },
    { value: 'shipping', label: 'Shipped' },
    { value: 'complete', label: 'Complete' },
  ];

  return (
    <div className={styles.container}>
      <label htmlFor="workflow-state-filter" className={styles.label}>
        {label}:
      </label>
      <select
        id="workflow-state-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
      >
        {workflowStates.map((state) => (
          <option key={state.value} value={state.value}>
            {state.label}
          </option>
        ))}
      </select>
    </div>
  );
}
