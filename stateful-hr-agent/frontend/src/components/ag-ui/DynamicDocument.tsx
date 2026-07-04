import React from 'react';

interface DynamicDocumentProps {
  title: string;
  content: string;
  url?: string;
  onAction: (event: string, payload: any) => void;
}

export const DynamicDocument: React.FC<DynamicDocumentProps> = ({ title, content, url, onAction }) => {
  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
      <div className="border-b border-gray-200 bg-slate-50 px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">{title || "Document Preview"}</h2>
        {url && (
          <button 
            onClick={() => onAction('download_document', { url })}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full transition"
          >
            Download PDF
          </button>
        )}
      </div>
      <div className="px-8 py-8 bg-[url('https://www.transparenttextures.com/patterns/clean-paper.png')] bg-white">
        <div className="prose max-w-none text-slate-800 whitespace-pre-wrap font-serif text-sm leading-relaxed">
          {content || "No document content preview available."}
        </div>
      </div>
    </div>
  );
};
