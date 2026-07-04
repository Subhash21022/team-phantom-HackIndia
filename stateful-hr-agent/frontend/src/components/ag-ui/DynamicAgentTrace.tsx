import React from 'react';

interface TraceStep {
  label: string;
  detail?: string;
  status?: 'done' | 'running' | 'pending';
}

interface DynamicAgentTraceProps {
  title?: string;
  steps?: TraceStep[];
}

const defaultSteps: TraceStep[] = [
  { label: 'Intent detected', detail: 'candidate_management', status: 'done' },
  { label: 'Planning workflow', status: 'done' },
  { label: 'Selected MCP', detail: 'PostgreSQL', status: 'done' },
  { label: 'Retrieved data', status: 'done' },
  { label: 'Generated workspace', status: 'done' },
];

export const DynamicAgentTrace: React.FC<DynamicAgentTraceProps> = ({ title, steps }) => {
  const rows = steps && steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="w-full workspace-panel rounded-xl border workspace-border p-5">
      <h3 className="text-lg font-semibold text-slate-900">{title || 'Agent Execution Trace'}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((step, idx) => {
          const status = step.status || 'done';
          const dotClass =
            status === 'running'
              ? 'text-amber-500'
              : status === 'pending'
                ? 'text-slate-400'
                : 'text-emerald-500';

          return (
            <div key={`${step.label}-${idx}`} className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-sm font-medium text-slate-800"><span className={dotClass}>?</span> {step.label}</p>
              {step.detail && <p className="text-xs text-slate-500 mt-1">{step.detail}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

