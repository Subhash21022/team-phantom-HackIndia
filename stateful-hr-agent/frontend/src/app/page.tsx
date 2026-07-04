"use client";
import React, { useState, useRef, useEffect } from 'react';
import { DynamicRenderer, UIConfig } from '../components/ag-ui/DynamicRenderer';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<{role: 'user'|'agent', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uiConfig, setUiConfig] = useState<UIConfig | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string, isAction: boolean = false) => {
    if (!text.trim()) return;
    
    if (!isAction) {
        setMessages(prev => [...prev, { role: 'user', text }]);
        setInput('');
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      const data = await res.json();
      
      // Add a tiny artificial delay to simulate typing stream aesthetics
      setTimeout(() => {
          setMessages(prev => [...prev, { role: 'agent', text: data.response }]);
          if (data.ui) {
              setUiConfig(data.ui);
          }
          setIsLoading(false);
      }, 300);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'agent', text: 'Connection to AI HR Agent failed. Ensure backend is running.' }]);
      setIsLoading(false);
    }
  };

  const handleAction = (payload: { event: string; payload: any }) => {
    const actionText = `[Action executed: ${payload.event}]`;
    setMessages(prev => [...prev, { role: 'user', text: actionText }]);
    sendMessage(`The user executed an action on the UI: ${payload.event}. Associated payload data: ${JSON.stringify(payload.payload)}. Please process this and update the UI accordingly.`, true);
  };

  return (
    <div className="flex h-screen w-full bg-[#1C1C1E] text-[#F2F2F7] font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* LEFT: Chat Interface */}
      <div className="w-[380px] border-r border-[#2C2C2E] flex flex-col bg-[#1C1C1E] flex-shrink-0 z-10 shadow-2xl">
        <div className="p-5 border-b border-[#2C2C2E] flex items-center gap-3 bg-[#1C1C1E]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-[#F2F2F7]">HR Intelligence</h1>
            <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider font-medium mt-0.5">Agentic Workspace</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60 mt-[-20px]">
              <Bot className="w-12 h-12 text-[#8E8E93]" />
              <p className="text-sm text-[#8E8E93] max-w-[220px]">How can I help you manage your candidates and workflows today?</p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} transition-all`}>
              <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-[#2C2C2E]' : 'bg-indigo-500'}`}>
                  {msg.role === 'user' ? <User className="w-3 h-3 text-[#F2F2F7]" /> : <Bot className="w-3 h-3 text-white" />}
                </div>
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#2C2C2E] text-[#F2F2F7] rounded-tr-sm' : 'bg-transparent text-[#D1D1D6] rounded-tl-sm border border-[#2C2C2E]'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-6 h-6 flex-shrink-0 rounded-full bg-indigo-500 flex items-center justify-center mt-1">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="p-3.5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8E8E93]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-[#1C1C1E] border-t border-[#2C2C2E]">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message the agent..." 
              className="w-full bg-[#2C2C2E] text-[#F2F2F7] placeholder-[#8E8E93] rounded-xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all border border-[#3A3A3C] focus:border-indigo-500/50"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 rounded-lg bg-indigo-500 text-white disabled:opacity-40 disabled:bg-transparent transition-colors hover:bg-indigo-600"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[10px] text-[#8E8E93]">AI can make mistakes. Verify important HR actions.</p>
          </div>
        </div>
      </div>

      {/* RIGHT: Dynamic Workspace */}
      <div className="flex-1 bg-[#09090B] relative overflow-y-auto p-10 flex flex-col items-center">
        {!uiConfig ? (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
            <Sparkles className="w-16 h-16 text-[#8E8E93] mb-5" />
            <h2 className="text-xl font-medium text-[#F2F2F7]">Workspace Ready</h2>
            <p className="text-[#8E8E93] mt-2 text-sm">Ask the agent to look up a candidate, schedule an interview, or generate an offer.</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl transition-all duration-500 ease-out transform translate-y-0 opacity-100">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Dynamic renderer handles the actual UI logic inside the isolated container */}
              <DynamicRenderer uiConfig={uiConfig} onEmitEvent={handleAction} />
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
