import React from 'react';

interface DynamicCardProps {
  title: string;
  content?: string;
  data?: any;
  actions?: string[];
  onAction: (event: string, payload: any) => void;
}

export const DynamicCard: React.FC<DynamicCardProps> = ({ title, content, data, actions, onAction }) => {
  return (
    <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div className="px-6 py-5">
        <div className="font-bold text-lg mb-2 text-slate-800">{title}</div>
        {content && <p className="text-slate-600 text-sm mb-4 leading-relaxed">{content}</p>}
        {data && (
          <div className="text-xs bg-slate-50 p-3 rounded-md mb-2 overflow-x-auto border border-slate-100">
            <pre className="text-slate-700">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 flex gap-2 flex-wrap border-t border-gray-100">
          {actions.map(action => (
            <button
              key={action}
              onClick={() => onAction(action, data || {})}
              className="bg-white border border-slate-200 shadow-sm rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
