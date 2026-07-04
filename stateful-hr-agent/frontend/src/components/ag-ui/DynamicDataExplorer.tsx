import React, { useMemo, useState } from 'react';
import { Database, Search, MessageSquare } from 'lucide-react';

interface ExplorerTable {
  name: string;
  description?: string;
  columns?: { name: string; type?: string }[];
  example_prompts?: string[];
}

interface DynamicDataExplorerProps {
  title?: string;
  source?: string;
  tables?: ExplorerTable[];
  onAction: (event: string, payload: any) => void;
}

export const DynamicDataExplorer: React.FC<DynamicDataExplorerProps> = ({ title, source, tables, onAction }) => {
  const [query, setQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const list = tables || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => t.name.toLowerCase().includes(q));
  }, [list, query]);

  const active = filtered.find((t) => t.name === selectedTable) || filtered[0];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#404040]">
          <Database className="w-4 h-4 text-[#737373]" strokeWidth={2} />
          {title || 'Database Explorer'}
        </div>
        <p className="text-[10px] text-[#737373] font-mono bg-white border border-[#e5e5e5] px-2 py-0.5 rounded-md shadow-sm">
          {source || 'Supabase'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a3a3a3]" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tables..."
              className="w-full bg-white border border-[#e5e5e5] rounded-lg pl-9 pr-3 py-2 text-[12px] text-black placeholder-[#a3a3a3] focus:outline-none focus:border-[#404040] focus:ring-1 focus:ring-[#404040] shadow-sm transition-shadow"
            />
          </div>
          <div className="space-y-1 max-h-72 overflow-auto pr-1">
            {filtered.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left text-[12px] rounded-md px-3 py-2 transition-colors ${
                  active?.name === t.name
                    ? 'bg-black text-white font-medium'
                    : 'text-[#404040] hover:bg-[#f0f0f0] hover:text-black'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 rounded-xl bg-white border border-[#e5e5e5] shadow-sm p-5">
          {!active ? (
            <p className="text-[12px] text-[#737373] text-center mt-10">
              No table metadata available.
            </p>
          ) : (
            <>
              <p className="text-[15px] font-semibold text-black">{active.name}</p>
              {active.description && (
                <p className="text-[12px] text-[#404040] mt-1.5 leading-relaxed">{active.description}</p>
              )}

              {active.columns && active.columns.length > 0 && (
                <div className="mt-5 space-y-1">
                  {active.columns.map((c) => (
                    <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0">
                      <span className="text-[11px] text-[#404040] font-mono">{c.name}</span>
                      {c.type && <span className="text-[10px] text-[#737373] font-mono bg-[#fafafa] px-1.5 py-0.5 rounded">{c.type}</span>}
                    </div>
                  ))}
                </div>
              )}

              {active.example_prompts && active.example_prompts.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#e5e5e5]">
                  <p className="text-[11px] font-medium text-[#737373] mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} />
                    Ask AI
                  </p>
                  <div className="space-y-2">
                    {active.example_prompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => onAction('ask_example_prompt', { table: active.name, prompt })}
                        className="w-full text-left text-[11px] text-[#404040] hover:text-black bg-white hover:bg-[#fafafa] border border-[#e5e5e5] shadow-sm rounded-md px-3 py-2 transition-colors"
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};





