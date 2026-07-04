import React from 'react';
import { FileText, Download } from 'lucide-react';

interface DynamicDocumentProps {
  title: string;
  content: string;
  url?: string;
  onAction: (event: string, payload: any) => void;
}

export const DynamicDocument: React.FC<DynamicDocumentProps> = ({ title, content, url, onAction }) => {
  return (
    <div className="w-full max-w-2xl rounded-xl bg-white border border-[#e5e5e5] shadow-sm overflow-hidden mb-4">
      <div className="border-b border-[#e5e5e5] bg-[#fafafa] px-5 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[#404040]">
          <FileText className="w-4 h-4 text-[#737373]" strokeWidth={2} />
          <h2 className="text-[13px] font-medium text-black">
            {title || 'Document Preview'}
          </h2>
        </div>
        {url && (
          <button
            onClick={() => onAction('download_document', { url })}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#404040] hover:text-black bg-white hover:bg-[#f5f5f5] border border-[#d4d4d4] rounded-md px-2.5 py-1.5 transition-colors"
          >
            <Download className="w-3 h-3" strokeWidth={2} />
            Download
          </button>
        )}
      </div>
      <div className="px-6 py-6 bg-white">
        <div className="text-[13px] font-mono text-[#404040] whitespace-pre-wrap leading-relaxed">
          {content || 'No document content preview available.'}
        </div>
      </div>
    </div>
  );
};





