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

const defaultTools: ToolStatus[] = [
  { id: 'db', name: 'Database MCP', status: 'connected' },
  { id: 'gmail', name: 'Gmail MCP', status: 'connected' },
  { id: 'calendar', name: 'Calendar MCP', status: 'connected' },
  { id: 'docs', name: 'Docs MCP', status: 'connected' },
];

const defaultDomains: DomainCard[] = [
  { id: 'hiring', emoji: 'H', title: 'Hiring', subtitle: 'Candidates and Interviews' },
  { id: 'employees', emoji: 'E', title: 'Employees', subtitle: 'HR Records' },
  { id: 'documents', emoji: 'D', title: 'Documents', subtitle: 'Offers' },
  { id: 'scheduling', emoji: 'S', title: 'Scheduling', subtitle: 'Meetings' },
];

export const DynamicWorkspaceOverview: React.FC<DynamicWorkspaceOverviewProps> = ({
  title,
  tools,
  domains,
  onAction,
}) => {
  const toolList = tools && tools.length > 0 ? tools : defaultTools;
  const domainList = domains && domains.length > 0 ? domains : defaultDomains;

  return (
    <div className="w-full workspace-panel rounded-2xl border workspace-border p-6 md:p-7 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
      <h2 className="text-3xl font-bold text-slate-900 text-center tracking-tight">{title || 'HR AI Workspace'}</h2>
      <p className="mt-2 text-center text-sm text-slate-500 font-medium">Connected Agent Tools</p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {toolList.map((tool) => (
          <div
            key={tool.id}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 flex items-center gap-2 shadow-sm"
          >
            <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide ${
              tool.status === 'down'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {tool.status === 'down' ? 'Down' : 'Online'}
            </span>
            <span className="font-medium">{tool.name}</span>
          </div>
        ))}
      </div>

      <p className="mt-7 text-center text-sm font-semibold text-slate-700">What do you want to manage?</p>

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
