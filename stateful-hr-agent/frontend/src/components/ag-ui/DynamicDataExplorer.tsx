import React, { useMemo, useState } from 'react';

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
    <div className="w-full workspace-panel rounded-xl border workspace-border p-5">
      <h3 className="text-lg font-semibold text-slate-900">{title || 'Database Explorer'}</h3>
      <p className="text-sm text-slate-500 mt-1">{source || 'Supabase'}</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
          <div className="mt-3 space-y-2 max-h-72 overflow-auto">
            {filtered.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left rounded-md border px-3 py-2 text-sm ${
                  active?.name === t.name ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 rounded-md border border-slate-200 bg-white p-4">
          {!active ? (
            <p className="text-sm text-slate-500">No table metadata available.</p>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-900">{active.name}</p>
              {active.description && <p className="text-sm text-slate-600 mt-1">{active.description}</p>}

              <div className="mt-3 space-y-1">
                {active.columns?.map((c) => (
                  <p key={c.name} className="text-sm text-slate-700">
                    {c.name}{c.type ? ` (${c.type})` : ''}
                  </p>
                ))}
              </div>

              {active.example_prompts && active.example_prompts.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-slate-700">Ask AI:</p>
                  {active.example_prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onAction('ask_example_prompt', { table: active.name, prompt })}
                      className="block text-left text-sm text-indigo-700 hover:text-indigo-900"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

