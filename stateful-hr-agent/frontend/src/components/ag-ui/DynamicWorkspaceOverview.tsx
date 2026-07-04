import React from 'react';

interface ToolStatus {
  id: string;
  name: string;
  status?: 'connected' | 'down';
}

interface DomainCard {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
}

interface DynamicWorkspaceOverviewProps {
  title?: string;
  tools?: ToolStatus[];
  domains?: DomainCard[];
  onAction: (event: string, payload: any) => void;
}

const defaultDomains: DomainCard[] = [
  { id: 'hiring', emoji: 'H', title: 'Hiring', subtitle: 'Candidates and Interviews' },
  { id: 'employees', emoji: 'E', title: 'Employees', subtitle: 'HR Records' },
  { id: 'documents', emoji: 'D', title: 'Documents', subtitle: 'Offers' },
  { id: 'scheduling', emoji: 'S', title: 'Scheduling', subtitle: 'Meetings' },
];

export const DynamicWorkspaceOverview: React.FC<DynamicWorkspaceOverviewProps> = ({
  title,
  domains,
  onAction,
}) => {
  const domainList = domains && domains.length > 0 ? domains : defaultDomains;

  return (
    <div className="w-full workspace-panel rounded-2xl border workspace-border p-6 md:p-7 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
      <h2 className="text-3xl font-bold text-slate-900 text-center tracking-tight">{title || 'HR AI Workspace'}</h2>

      <p className="mt-6 text-center text-sm font-semibold text-slate-700">What do you want to manage?</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {domainList.map((domain) => (
          <button
            key={domain.id}
            type="button"
            onClick={() => onAction('open_domain', { domain: domain.id })}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-left hover:border-indigo-300 hover:bg-indigo-50/40 transition shadow-sm"
          >
            <p className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                {domain.emoji}
              </span>
              {domain.title}
            </p>
            <p className="text-sm text-slate-600 mt-1">{domain.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
