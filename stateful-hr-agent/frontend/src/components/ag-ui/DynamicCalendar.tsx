import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface DynamicCalendarProps {
  title: string;
  events: any[];
  onAction: (event: string, payload: any) => void;
}

export const DynamicCalendar: React.FC<DynamicCalendarProps> = ({ title, events, onAction }) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 text-[13px] font-medium text-[#404040]">
        <Calendar className="w-4 h-4 text-[#737373]" strokeWidth={2} />
        {title || 'Calendar'}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {events?.map((evt, idx) => (
          <button
            key={idx}
            type="button"
            className="rounded-lg bg-white border border-[#e5e5e5] shadow-sm p-4 text-left hover:bg-[#fafafa] hover:border-[#d4d4d4] transition-colors"
            onClick={() => onAction('view_event', evt)}
          >
            <p className="text-[13px] font-medium text-black">{evt.title}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#737373]">
              <Clock className="w-3 h-3" strokeWidth={2} />
              <span className="font-mono">{evt.date || evt.time}</span>
            </div>
            {evt.description && (
              <p className="text-[11px] text-[#404040] mt-2 leading-relaxed">{evt.description}</p>
            )}
          </button>
        ))}
        {(!events || events.length === 0) && (
          <div className="col-span-full rounded-lg bg-white border border-[#e5e5e5] p-6 text-center">
            <p className="text-[12px] text-[#737373]">No events scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};





