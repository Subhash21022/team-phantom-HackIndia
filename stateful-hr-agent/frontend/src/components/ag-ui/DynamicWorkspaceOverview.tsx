import React from 'react';
import { ChevronRight } from 'lucide-react';

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
    <div className="w-full">
      <div className="text-center mb-8 mt-4">
        <h2 className="text-2xl font-semibold text-black tracking-tight">
          {title || 'HR AI Workspace'}
        </h2>
        <p className="text-[13px] text-[#737373] mt-2">
          What do you want to manage?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {domainList.map((domain) => (
          <button
            key={domain.id}
            type="button"
            onClick={() => onAction('open_domain', { domain: domain.id })}
            className="group flex items-center gap-4 rounded-xl bg-white border border-[#e5e5e5] shadow-sm p-4 text-left hover:bg-[#fafafa] hover:border-[#d4d4d4] transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center text-[14px] font-semibold text-black flex-shrink-0 group-hover:bg-black group-hover:text-black transition-colors">
              {domain.emoji}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-black">{domain.title}</p>
              <p className="text-[11px] text-[#737373] mt-0.5">{domain.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#a3a3a3] group-hover:text-black transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};





