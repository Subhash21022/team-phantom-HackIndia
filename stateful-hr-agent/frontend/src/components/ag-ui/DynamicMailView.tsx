import React from 'react';

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
    <div className="w-full workspace-panel rounded-xl border workspace-border p-5">
      <h3 className="text-lg font-semibold text-slate-900">{title || 'Mail View'}</h3>
      <p className="text-sm text-slate-600 mt-2">{summary || 'Latest email operations are shown here.'}</p>

      {recipients && recipients.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700">Recipients</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recipients.map((r) => (
              <span key={r} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{r}</span>
            ))}
          </div>
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => onAction(a.event, a.payload || {})}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

