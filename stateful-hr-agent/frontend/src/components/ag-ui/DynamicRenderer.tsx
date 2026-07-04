import React from 'react';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from './DynamicForm';
import { DynamicCalendar } from './DynamicCalendar';
import { DynamicCard } from './DynamicCard';
import { DynamicDocument } from './DynamicDocument';

export interface UIConfig {
  type: string;
  [key: string]: any;
}

interface DynamicRendererProps {
  uiConfig: UIConfig | null;
  onEmitEvent: (eventPayload: { event: string; payload: any }) => void;
}

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ uiConfig, onEmitEvent }) => {
  if (!uiConfig) return null;

  // Global action handler that routes events back to backend
  const handleAction = (eventName: string, payload: any) => {
    onEmitEvent({
      event: eventName,
      payload
    });
  };

  switch (uiConfig.type) {
    case 'table':
      return <DynamicTable {...uiConfig} onAction={handleAction} />;
    case 'form':
      return <DynamicForm {...uiConfig} onAction={handleAction} />;
    case 'calendar':
      return <DynamicCalendar {...uiConfig} onAction={handleAction} />;
    case 'dashboard_card':
      return <DynamicCard {...uiConfig} onAction={handleAction} />;
    case 'document_preview':
      return <DynamicDocument {...uiConfig} onAction={handleAction} />;
    case 'timeline':
      // Simplified fallback for timeline if needed
      return (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded">
          <h3 className="font-bold mb-2">{uiConfig.title || "Timeline"}</h3>
          <pre className="text-xs">{JSON.stringify(uiConfig.events, null, 2)}</pre>
        </div>
      );
    default:
      return (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm font-medium">
          Unsupported UI component type: {uiConfig.type}
        </div>
      );
  }
};
