import React from 'react';

interface DynamicCalendarProps {
  title: string;
  events: any[];
  onAction: (event: string, payload: any) => void;
}

export const DynamicCalendar: React.FC<DynamicCalendarProps> = ({ title, events, onAction }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
      <h2 className="text-xl font-bold mb-4 text-slate-800">{title || "Calendar"}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events?.map((evt, idx) => (
          <div 
            key={idx} 
            className="border-l-4 border-indigo-500 bg-slate-50 p-4 rounded-r-md hover:bg-slate-100 cursor-pointer transition shadow-sm" 
            onClick={() => onAction('view_event', evt)}
          >
            <div className="font-semibold text-lg text-slate-800">{evt.title}</div>
            <div className="text-sm text-indigo-600 font-medium mt-1">{evt.date || evt.time}</div>
            {evt.description && <div className="text-sm mt-2 text-slate-600">{evt.description}</div>}
          </div>
        ))}
        {(!events || events.length === 0) && <p className="text-slate-500 italic p-4 bg-slate-50 rounded">No events scheduled.</p>}
      </div>
    </div>
  );
};
