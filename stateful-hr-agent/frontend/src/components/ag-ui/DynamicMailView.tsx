import React from 'react';
import { Mail, Send } from 'lucide-react';

interface MailAction {
  label: string;
  event: string;
  payload?: any;
}

interface DynamicMailViewProps {
  title?: string;
  summary?: string;
  recipients?: string[];
  actions?: MailAction[];
  onAction: (event: string, payload: any) => void;
}

export const DynamicMailView: React.FC<DynamicMailViewProps> = ({
  title,
  summary,
  recipients,
  actions,
  onAction,
}) => {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-2 mb-4 text-[13px] font-medium text-[#404040]">
        <Mail className="w-4 h-4 text-[#737373]" strokeWidth={2} />
        {title || 'Mail View'}
      </div>
      <div className="rounded-xl bg-white border border-[#e5e5e5] p-5 shadow-sm">
        <p className="text-[13px] text-[#404040] leading-relaxed">
          {summary || 'Latest email operations are shown here.'}
        </p>

        {recipients && recipients.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#f0f0f0]">
            <p className="text-[11px] font-medium text-[#737373] mb-2">Recipients</p>
            <div className="flex flex-wrap gap-2">
              {recipients.map((r) => (
                <span key={r} className="bg-[#fafafa] border border-[#e5e5e5] rounded px-2 py-1 text-[11px] font-mono text-[#404040]">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {actions && actions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => onAction(a.event, a.payload || {})}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-black text-white hover:bg-[#333] transition-colors"
              >
                <Send className="w-3 h-3" strokeWidth={2} />
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};





