"use client";
import React, { useState, useRef, useEffect } from 'react';
import { DynamicRenderer, UIConfig } from '../components/ag-ui/DynamicRenderer';
import { Send, Loader2, Bot, User } from 'lucide-react';

const API_BASES = ['http://127.0.0.1:8000', 'http://localhost:8000'];
const CRUD_EVENTS = new Set(['read_candidates', 'create_candidate', 'update_candidate', 'delete_candidate']);

const INITIAL_WORKSPACE: UIConfig = {
  type: 'workspace_overview',
  title: 'HR AI Workspace',
  tools: [
    { id: 'db', name: 'Database MCP', status: 'connected' },
    { id: 'gmail', name: 'Gmail MCP', status: 'connected' },
    { id: 'calendar', name: 'Calendar MCP', status: 'connected' },
    { id: 'docs', name: 'Docs MCP', status: 'connected' },
  ],
  domains: [
    { id: 'hiring', emoji: 'H', title: 'Hiring', subtitle: 'Candidates and Interviews' },
    { id: 'employees', emoji: 'E', title: 'Employees', subtitle: 'HR Records' },
    { id: 'documents', emoji: 'D', title: 'Documents', subtitle: 'Offers' },
    { id: 'scheduling', emoji: 'S', title: 'Scheduling', subtitle: 'Meetings' },
  ],
};

function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanCandidatePayload(payload: any) {
  const cleaned: Record<string, any> = {};
  const keys = ['name', 'email', 'phone', 'role', 'experience', 'status', 'skills', 'resume_url'];

  keys.forEach((key) => {
    const value = payload?.[key];
    if (value === undefined || value === null || value === '') return;
    cleaned[key] = key === 'experience' ? toNumberOrUndefined(value) : value;
  });

  if (cleaned.experience === undefined) {
    delete cleaned.experience;
  }

  return cleaned;
}

type Toast = {
  id: number;
  kind: 'success' | 'error';
  message: string;
};

const AGENT_TRACE_MSG = `Understanding request...\n\n- Intent detected\n  candidate_management\n\n- Planning workflow\n\n- Selected MCP\n  PostgreSQL\n\n- Retrieved data\n\n- Generated workspace`;

async function apiRequest(path: string, init?: RequestInit, retries = 1): Promise<Response> {
  let lastError: any = null;

  for (let i = 0; i <= retries; i++) {
    for (const base of API_BASES) {
      try {
        const res = await fetch(`${base}${path}`, init);
        return res;
      } catch (err) {
        lastError = err;
      }
    }
    if (i < retries) {
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }

  throw lastError || new Error('Failed to fetch backend API');
}

export default function Home() {
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uiConfig, setUiConfig] = useState<UIConfig>(INITIAL_WORKSPACE);
  const [crudActionState, setCrudActionState] = useState<{ isBusy: boolean; event: string | null }>({
    isBusy: false,
    event: null,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pushToast = (kind: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const loadCandidatesUi = async () => {
    const res = await apiRequest('/api/ui-schema/candidates', { method: 'GET' }, 2);
    if (!res.ok) {
      throw new Error(`Failed to load UI schema: ${res.status}`);
    }
    const ui = await res.json();
    setUiConfig(ui);
  };

  const safeRefreshCandidatesUi = async () => {
    try {
      await loadCandidatesUi();
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string, isAction: boolean = false) => {
    if (!text.trim()) return;

    if (!isAction) {
      setMessages((prev) => [...prev, { role: 'user', text }]);
      setInput('');
      setMessages((prev) => [...prev, { role: 'agent', text: AGENT_TRACE_MSG }]);
    }

    setIsLoading(true);

    try {
      const res = await apiRequest(
        '/api/chat/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        },
        1,
      );

      if (!res.ok) {
        throw new Error(`Chat request failed (${res.status})`);
      }

      const data = await res.json();

      setTimeout(() => {
        if (data.response) {
          setMessages((prev) => [...prev, { role: 'agent', text: data.response }]);
        }
        if (data.ui) {
          setUiConfig(data.ui);
        }
        setIsLoading(false);
      }, 350);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'agent', text: 'Error: Cannot connect to backend agent right now.' }]);
      pushToast('error', 'Cannot connect to backend agent.');
      setIsLoading(false);
    }
  };

  const runCrudAction = async (event: string, payload: any) => {
    setCrudActionState({ isBusy: true, event });
    setIsLoading(true);

    try {
      if (event === 'read_candidates') {
        const ok = await safeRefreshCandidatesUi();
        if (!ok) throw new Error('Failed to fetch latest candidates from backend.');
        pushToast('success', 'Candidates refreshed');
        return;
      }

      if (event === 'create_candidate') {
        const body = cleanCandidatePayload(payload);
        const res = await apiRequest(
          '/api/candidates/',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
          1,
        );
        if (!res.ok) throw new Error(`Create failed (${res.status})`);

        const refreshed = await safeRefreshCandidatesUi();
        pushToast('success', 'Candidate created successfully');
        if (!refreshed) pushToast('error', 'Created in DB, but failed to fetch updated list. Try Refresh.');
        return;
      }

      if (event === 'update_candidate') {
        const id = toNumberOrUndefined(payload?.id);
        if (!id) throw new Error('Candidate ID is required for update.');

        const body = cleanCandidatePayload(payload);
        const res = await apiRequest(
          `/api/candidates/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
          1,
        );
        if (!res.ok) throw new Error(`Update failed (${res.status})`);

        const refreshed = await safeRefreshCandidatesUi();
        pushToast('success', `Candidate #${id} updated`);
        if (!refreshed) pushToast('error', 'Updated in DB, but failed to fetch updated list. Try Refresh.');
        return;
      }

      if (event === 'delete_candidate') {
        const id = toNumberOrUndefined(payload?.id);
        if (!id) throw new Error('Candidate ID is required for delete.');

        const res = await apiRequest(`/api/candidates/${id}`, { method: 'DELETE' }, 1);
        if (!res.ok) throw new Error(`Delete failed (${res.status})`);

        const refreshed = await safeRefreshCandidatesUi();
        pushToast('success', `Candidate #${id} deleted`);
        if (!refreshed) pushToast('error', 'Deleted in DB, but failed to fetch updated list. Try Refresh.');
      }
    } catch (error: any) {
      pushToast('error', error?.message || 'CRUD operation failed.');
    } finally {
      setCrudActionState({ isBusy: false, event: null });
      setIsLoading(false);
    }
  };

  const handleAction = async (payload: { event: string; payload: any }) => {
    const { event, payload: pl } = payload;

    if (event === 'open_domain') {
      const domain = pl?.domain;
      if (domain === 'hiring') {
        await sendMessage('Show all candidates');
        return;
      }
      if (domain === 'documents') {
        await sendMessage('Show latest offers and documents');
        return;
      }
      if (domain === 'scheduling') {
        await sendMessage('Show interview calendar and upcoming events');
        return;
      }
      if (domain === 'employees') {
        await sendMessage('Show all employees and HR records');
        return;
      }
    }

    if (event === 'ask_example_prompt' && pl?.prompt) {
      await sendMessage(pl.prompt);
      return;
    }

    if (CRUD_EVENTS.has(event)) {
      await runCrudAction(event, pl);
      return;
    }

    await sendMessage(
      `The user executed action: ${event}. Payload: ${JSON.stringify(pl)}. Update the database and UI accordingly.`,
      true,
    );
  };

  return (
    <div className="h-screen w-full bg-[#090B10] text-[#F2F2F7] flex flex-col overflow-hidden">
      <header className="h-14 border-b border-slate-800/80 bg-gradient-to-r from-[#0E1118] via-[#131721] to-[#0E1118] px-5 flex items-center justify-between shadow-[0_6px_28px_rgba(0,0,0,0.35)]">
        <h1 className="text-sm md:text-base font-semibold tracking-wide text-slate-100">HR Intelligence</h1>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs md:text-sm font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Agent Status: Online
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[360px] border-r border-slate-800/80 bg-gradient-to-b from-[#12151D] to-[#0F1219] flex flex-col shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)]">
          <div className="px-5 py-4 border-b border-slate-800/80">
            <p className="text-sm font-semibold text-slate-100">AI Agent Chat</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[92%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                      msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-500'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2 text-xs whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-slate-700 text-white'
                        : 'bg-[#0F131C] border border-slate-700 text-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                Agent is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-800/80">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-[#1A1F2A] rounded-lg px-3 py-2 pr-10 text-sm border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 rounded-md bg-indigo-500 hover:bg-indigo-600 transition disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.18),transparent_40%),radial-gradient(circle_at_80%_100%,rgba(56,189,248,0.12),transparent_35%),linear-gradient(135deg,#090B11_0%,#111520_100%)] p-6 md:p-8">
          <div className="mb-4">
            <p className="text-lg font-semibold text-slate-100">Dynamic AG-UI Workspace</p>
            <p className="text-xs text-slate-400 mt-1">Generated live by GPT-5.1</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/95 text-slate-900 p-4 md:p-6 shadow-[0_20px_70px_rgba(0,0,0,0.45)] min-h-[75vh]">
            <DynamicRenderer uiConfig={uiConfig} actionState={crudActionState} onEmitEvent={handleAction} />
          </div>

          <div className="fixed right-5 top-16 z-50 space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`rounded-md border px-3 py-2 text-sm shadow-lg ${
                  toast.kind === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {toast.message}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
