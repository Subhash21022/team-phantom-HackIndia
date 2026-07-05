import React from 'react';
import { Calendar, Clock, Video, Users, User, ExternalLink } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  candidate?: string;
  start_time?: string;
  end_time?: string;
  meeting_link?: string;
  attendees?: string[];
  date?: string;
  time?: string;
  description?: string;
}

interface CalendarAction {
  label: string;
  event: string;
}

interface DynamicCalendarProps {
  title: string;
  events: CalendarEvent[];
  actions?: CalendarAction[];
  onAction: (event: string, payload: any) => void;
}

export const DynamicCalendar: React.FC<DynamicCalendarProps> = ({ title, events, actions, onAction }) => {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const dt = new Date(timeStr);
      return dt.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-black">
          <Calendar className="w-4 h-4 text-[#737373]" strokeWidth={2} />
          {title || 'Calendar'}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAction(act.event, {})}
                className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-[#171717] text-white hover:bg-[#262626] transition-colors"
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events?.map((evt, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white border border-[#e5e5e5] shadow-sm p-4 hover:border-[#d4d4d4] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <p className="text-[13px] font-semibold text-black leading-snug">{evt.title}</p>
              </div>

              <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-[#404040]">
                <Clock className="w-3.5 h-3.5 text-[#8c8c8c]" strokeWidth={2} />
                <span className="font-mono">
                  {evt.start_time ? formatTime(evt.start_time) : (evt.date || evt.time)}
                </span>
              </div>

              {evt.candidate && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#404040]">
                  <User className="w-3.5 h-3.5 text-[#8c8c8c]" strokeWidth={2} />
                  <span>Candidate: <strong className="text-black font-medium">{evt.candidate}</strong></span>
                </div>
              )}

              {evt.attendees && evt.attendees.length > 0 && (
                <div className="flex items-start gap-1.5 mt-2 text-[11px] text-[#404040]">
                  <Users className="w-3.5 h-3.5 text-[#8c8c8c] mt-0.5" strokeWidth={2} />
                  <div className="flex-1">
                    <span className="text-[#737373]">Attendees:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {evt.attendees.map((att, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-[#fafafa] border border-[#f0f0f0] text-[10px] text-black">
                          {att}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {evt.description && (
                <p className="text-[11px] text-[#525252] mt-3 leading-relaxed border-t border-[#f5f5f5] pt-2">
                  {evt.description}
                </p>
              )}
            </div>

            {evt.meeting_link && (
              <div className="mt-4 pt-3 border-t border-[#f5f5f5] flex items-center justify-between">
                <span className="text-[10px] text-[#8c8c8c] flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-[#16a34a]" strokeWidth={2} /> Meet Link Available
                </span>
                <a
                  href={evt.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-[#f5f5f5] hover:bg-[#e5e5e5] text-black text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  Join <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ))}
        {(!events || events.length === 0) && (
          <div className="col-span-full rounded-xl bg-white border border-[#e5e5e5] p-8 text-center">
            <p className="text-[12px] text-[#737373]">No upcoming interviews scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};





