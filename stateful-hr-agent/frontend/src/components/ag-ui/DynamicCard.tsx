import React from 'react';

interface CardAction {
  label: string;
  event: string;
}

interface DynamicCardProps {
  title: string;
  content?: string;
  data?: any;
  actions?: (string | CardAction)[];
  onAction: (event: string, payload: any) => void;
}

export const DynamicCard: React.FC<DynamicCardProps> = ({ title, content, data, actions, onAction }) => {
  return (
    <div className="w-full max-w-sm rounded-xl bg-white border border-[#e5e5e5] shadow-sm overflow-hidden mb-4">
      <div className="px-5 py-5">
        <h3 className="text-[14px] font-semibold text-black">{title}</h3>
        {content && (
          <div className="text-[12px] text-[#404040] mt-2 leading-relaxed">
            {typeof content === 'string' ? content : (
              <pre className="font-mono text-[10px] bg-[#fafafa] border border-[#e5e5e5] p-2 rounded">
                {JSON.stringify(content, null, 2)}
              </pre>
            )}
          </div>
        )}
        {data && (
          <div className="mt-3 rounded-lg bg-[#fafafa] border border-[#f0f0f0] p-3 overflow-x-auto">
            <pre className="text-[10px] font-mono text-[#737373]">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="px-5 py-3 bg-[#fafafa] border-t border-[#e5e5e5] flex gap-2 flex-wrap">
          {actions.map((action, idx) => {
            const isObj = typeof action === 'object' && action !== null;
            const label = isObj ? (action as CardAction).label : (action as string);
            const eventName = isObj ? (action as CardAction).event : (action as string);
            
            return (
              <button
                key={`${label}-${idx}`}
                onClick={() => onAction(eventName, data || {})}
                className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-white text-[#404040] border border-[#d4d4d4] hover:bg-[#f5f5f5] hover:text-black transition-colors"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};





