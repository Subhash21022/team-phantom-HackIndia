import React from 'react';

interface DynamicTableProps {
  title: string;
  data: any[];
  actions: string[];
  onAction: (event: string, payload: any) => void;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({ title, data, actions, onAction }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 italic p-4">No data available in {title}</div>;
  
  const headers = Object.keys(data[0]);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
      {title && <h2 className="text-xl font-bold mb-4 text-slate-800">{title}</h2>}
      <div className="overflow-x-auto rounded-md">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 uppercase tracking-wider">
            <tr>
              {headers.map(header => (
                <th key={header} className="px-6 py-3 font-medium">{header}</th>
              ))}
              {actions && actions.length > 0 && <th className="px-6 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                {headers.map(header => (
                  <td key={header} className="px-6 py-4 text-slate-700">{String(row[header])}</td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-6 py-4 space-x-2 text-right">
                    {actions.map(action => (
                      <button
                        key={action}
                        onClick={() => onAction(`${action}_action`, row)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold transition"
                      >
                        {action}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
