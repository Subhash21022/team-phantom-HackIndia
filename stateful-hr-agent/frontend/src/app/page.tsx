"use client";
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { DynamicRenderer, UIConfig } from '../components/ag-ui/DynamicRenderer';
import { Loader2, Zap, ChevronRight, Terminal, Send, Database, Calendar, Mail, FileText } from 'lucide-react';

const API_BASES = ['http://127.0.0.1:8000', 'http://localhost:8000'];

type Toast = { id: number; kind: 'success' | 'error'; message: string; };
type TraceItem = { id: number; time: string; text: string; kind: 'info' | 'success' | 'error'; };

async function apiRequest(path: string, init?: RequestInit, retries = 1): Promise<Response> {
  let lastError: any = null;
  for (let i = 0; i <= retries; i++) {
    for (const base of API_BASES) {
      try { return await fetch(`${base}${path}`, init); }
      catch (err) { lastError = err; }
    }
    if (i < retries) await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  throw lastError || new Error('Failed to fetch backend API');
}

export default function Home() {
  const [uiConfig, setUiConfig] = useState<UIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [crudActionState, setCrudActionState] = useState<{ isBusy: boolean; event: string | null }>({ isBusy: false, event: null });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [trace, setTrace] = useState<TraceItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const traceEndRef = useRef<HTMLDivElement>(null);

  const pushToast = (kind: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  const addTrace = (text: string, kind: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTrace((prev) => [...prev, { id, time, text, kind }]);
  };

  useEffect(() => {
    if (traceEndRef.current) {
      traceEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [trace]);

  const sendAgentCommand = async (text: string, eventName?: string) => {
    if (!text.trim()) return;
    if (eventName) setCrudActionState({ isBusy: true, event: eventName });
    setIsLoading(true);
    addTrace(`User Input: ${text}`, 'info');
    
    try {
      const res = await apiRequest('/api/chat/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) }, 1);
      if (!res.ok) throw new Error(`Agent command failed (${res.status})`);
      const data = await res.json();
      if (data.ui) { 
        setUiConfig(data.ui); 
        addTrace('Workspace updated by Agent', 'success'); 
      }
      if (data.response) addTrace(`Agent Response: ${data.response}`, 'success');
    } catch (error: any) { 
      addTrace(error?.message || 'Agent instruction failed', 'error'); 
      pushToast('error', error?.message || 'Action failed.'); 
    }
    finally { 
      if (eventName) setCrudActionState({ isBusy: false, event: null });
      setIsLoading(false); 
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = chatInput.trim();
    if (!cmd || isLoading) return;
    setChatInput('');
    sendAgentCommand(cmd);
  };

  const handleAction = async (payload: { event: string; payload: any }) => {
    const { event, pl } = payload as any;
    
    if (event === 'open_domain') {
      const d = pl?.domain;
      if (d === 'hiring') { await sendAgentCommand('Show all candidates'); return; }
      if (d === 'documents') { await sendAgentCommand('Show latest offers and documents'); return; }
      if (d === 'scheduling') { await sendAgentCommand('Show interview calendar and upcoming events'); return; }
      if (d === 'employees') { await sendAgentCommand('Show all employees and HR records'); return; }
    }
    if (event === 'ask_example_prompt' && pl?.prompt) { await sendAgentCommand(pl.prompt); return; }
    
    if (event === 'read_candidates') {
      await sendAgentCommand('Show all candidates', event);
      return;
    }
    if (event === 'create_candidate') {
      await sendAgentCommand(`Add a new candidate: ${JSON.stringify(pl)}`, event);
      return;
    }
    if (event === 'update_candidate') {
      await sendAgentCommand(`Update candidate (ID: ${pl?.id}) with the following data: ${JSON.stringify(pl)}`, event);
      return;
    }
    if (event === 'delete_candidate') {
      await sendAgentCommand(`Delete candidate with ID: ${pl?.id}`, event);
      return;
    }
    if (event === 'edit_candidate') {
        await sendAgentCommand(`Show me an edit form to update candidate ID ${pl?.id}`, event);
        return;
    }
    if (event === 'schedule_interview') {
        await sendAgentCommand(`Schedule an interview for candidate ID ${pl?.id} tomorrow`, event);
        return;
    }
    
    await sendAgentCommand(`User requested action: ${event}. Payload: ${JSON.stringify(pl)}`, event);
  };

  return (
    <div className="h-screen w-full bg-white text-black flex flex-col overflow-hidden font-sans">
      {/* ── Header ── */}
      <header className="h-12 border-b border-[#e5e5e5] bg-white px-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-black" strokeWidth={2} />
          <h1 className="text-[13px] font-semibold tracking-wide text-black">HR Agent Engine</h1>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#737373]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-glow-pulse" />
          System Active
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* ─ Command Center (Left Sidebar) ─ */}
        <aside className="w-[320px] border-r border-[#e5e5e5] bg-[#fafafa] flex flex-col flex-shrink-0">
          <div className="px-5 py-4 border-b border-[#e5e5e5] bg-white">
            <p className="text-[13px] font-semibold text-black">Chat Panel</p>
            <p className="text-[11px] text-[#737373] mt-1">User commands & Agent execution trace</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {trace.length === 0 && !isLoading && (
              <p className="text-[11px] text-[#a3a3a3] text-center mt-10">Waiting for instructions...</p>
            )}
            
            {trace.map((item, idx) => {
              const isUser = item.text.startsWith('User Input:');
              const text = isUser ? item.text.replace('User Input: ', '') : item.text;
              
              return (
                <div key={`${item.id}-${idx}`} className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono text-[#737373] uppercase">{isUser ? 'User' : 'Agent Trace'}</span>
                    <span className="text-[9px] font-mono text-[#a3a3a3]">{item.time}</span>
                  </div>
                  <div className={`text-[12px] rounded-lg p-3 ${isUser ? 'bg-white border border-[#e5e5e5] text-[#404040] shadow-sm' : 'bg-transparent border border-[#e5e5e5] text-[#404040]'}`}>
                    {text}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 py-3 px-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#737373]" />
                <span className="text-[11px] text-[#737373] font-mono">Agent thinking...</span>
              </div>
            )}
            <div ref={traceEndRef} />
          </div>
          
          <div className="p-4 border-t border-[#e5e5e5] bg-white">
            <form onSubmit={handleChatSubmit} className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isLoading}
                placeholder="Ask agent to do anything..." 
                className="w-full bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg pl-4 pr-10 py-3 text-[13px] text-black placeholder-[#a3a3a3] focus:outline-none focus:border-[#d4d4d4] transition-colors disabled:opacity-50 shadow-inner"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#737373] hover:text-black disabled:opacity-30 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </aside>

        {/* ─ Dynamic Workspace (Right Pane) ─ */}
        <section className="flex-1 overflow-hidden bg-[#f9f9f9] flex flex-col relative">
          
          <div className="px-6 py-4 border-b border-[#e5e5e5] bg-white/80 backdrop-blur-sm flex justify-between items-center z-10">
            <div>
              <p className="text-[14px] font-semibold text-black">Dynamic Workspace</p>
              <p className="text-[11px] text-[#737373] mt-0.5 font-mono">Generated AG-UI Panel</p>
            </div>
            <div className="px-2.5 py-1 rounded bg-white border border-[#e5e5e5] text-[10px] font-mono text-[#737373] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
              Rendering
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 relative">
            {uiConfig ? (
              <div className="max-w-5xl mx-auto animate-slide-in">
                <DynamicRenderer uiConfig={uiConfig} actionState={crudActionState} onEmitEvent={handleAction} />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#e5e5e5] flex items-center justify-center mb-6 shadow-sm">
                  <Zap className="w-8 h-8 text-[#404040]" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-black mb-2">AI Workspace Ready</h2>
                <p className="text-[13px] text-[#737373] max-w-md mx-auto mb-8 leading-relaxed">
                  The Stateful HR Agent is online. It manages databases, emails, calendars, and generates UI dynamically based on your instructions.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-10">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-[#e5e5e5] shadow-sm">
                    <Database className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-[12px] text-[#404040] font-mono">Database MCP connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-[#e5e5e5] shadow-sm">
                    <Calendar className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-[12px] text-[#404040] font-mono">Calendar MCP connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-[#e5e5e5] shadow-sm">
                    <Mail className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-[12px] text-[#404040] font-mono">Gmail MCP connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-[#e5e5e5] shadow-sm">
                    <FileText className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-[12px] text-[#404040] font-mono">Docs MCP connected</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-[11px] text-[#a3a3a3] mr-2">Try:</span>
                  {['Show candidates', 'Schedule interview', 'Generate offer letter'].map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => { setChatInput(prompt); sendAgentCommand(prompt); }}
                      className="px-3 py-1.5 rounded-full border border-[#e5e5e5] bg-white text-[11px] text-[#737373] hover:text-black hover:bg-[#fafafa] hover:border-[#d4d4d4] transition-colors shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Toasts ── */}
      <div className="fixed right-4 top-14 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg border border-[#e5e5e5] bg-white px-4 py-3 shadow-lg animate-fade-in flex items-center gap-3"
          >
            <div className={`w-1.5 h-full absolute left-0 top-0 bottom-0 rounded-l-lg ${toast.kind === 'success' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`} />
            <span className="text-[12px] text-[#404040] leading-snug pl-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
