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

  const handleAction = (eventName: string, payload: any) => {
    onEmitEvent({
      event: eventName,
      payload
    });
  };

  switch (uiConfig.type) {
    case 'table':
      return <DynamicTable {...(uiConfig as any)} onAction={handleAction} />;
    case 'form':
      return <DynamicForm {...(uiConfig as any)} onAction={handleAction} />;
    case 'calendar':
      return <DynamicCalendar {...(uiConfig as any)} onAction={handleAction} />;
    case 'dashboard_card':
      return <DynamicCard {...(uiConfig as any)} onAction={handleAction} />;
    case 'document_preview':
      return <DynamicDocument {...(uiConfig as any)} onAction={handleAction} />;
    case 'timeline':
      return (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded">
          <h3 className="font-bold mb-2">{uiConfig.title || 'Timeline'}</h3>
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
