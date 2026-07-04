import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';

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
    <div className="w-full">
      <p className="text-[12px] font-medium text-[#737373] uppercase tracking-wider mb-3">
        {title || 'Agent Execution Trace'}
      </p>
      <div className="space-y-2">
        {rows.map((step, idx) => {
          const status = step.status || 'done';

          return (
            <div
              key={`${step.label}-${idx}`}
              className="rounded-lg bg-white border border-[#e5e5e5] px-3 py-2.5 flex items-start gap-3 shadow-sm"
            >
              <span className="mt-0.5 flex-shrink-0">
                {status === 'done' ? (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                ) : status === 'running' ? (
                  <Loader2 className="w-3 h-3 text-[#737373] animate-spin -mt-0.5" />
                ) : (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d4d4d4]" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-black leading-snug">{step.label}</p>
                {step.detail && (
                  <p className="text-[10px] text-[#737373] font-mono mt-1">{step.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};





