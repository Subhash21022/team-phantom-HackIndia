import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Server, Database, BrainCircuit, Blocks, Sparkles } from 'lucide-react';

export default function Architecture() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#F2F2F7] font-sans p-10">
      <Link href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
      </Link>
      
      <div className="max-w-4xl mx-auto mt-4">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl"><BrainCircuit className="w-8 h-8 text-indigo-500" /></div>
          System Architecture
        </h1>
        <p className="text-[#8E8E93] text-lg mb-12 ml-1">How the Stateful AI HR Agent Platform operates autonomously under the hood.</p>
        
        <div className="grid gap-8">
          <div className="bg-[#1C1C1E] border border-[#2C2C2E] p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/50 transition">
            <div className="absolute top-[-20%] right-[-5%] p-8 opacity-5 group-hover:opacity-10 transition"><Blocks className="w-64 h-64 text-indigo-400" /></div>
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-3"><Sparkles className="w-6 h-6 text-indigo-400"/> LangGraph Agent</h2>
            <p className="text-[#D1D1D6] leading-relaxed mb-4 text-lg">
              The brain of the system. Instead of simple conversational turns, LangGraph models a deterministic state machine. It detects intents, formulates a plan, selects tools, and tracks memory (like selected candidate IDs) across steps.
            </p>
          </div>
          
          <div className="bg-[#1C1C1E] border border-[#2C2C2E] p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/50 transition">
            <div className="absolute top-[-20%] right-[-5%] p-8 opacity-5 group-hover:opacity-10 transition"><Server className="w-64 h-64 text-emerald-400" /></div>
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-3"><Server className="w-6 h-6 text-emerald-400"/> MCP Protocol</h2>
            <p className="text-[#D1D1D6] leading-relaxed mb-4 text-lg">
              Model Context Protocol (MCP) strictly isolates the AI Agent from external systems. The Agent can only emit standard JSON payloads to defined MCP servers (Postgres, Gmail, Calendar, Docs). This ensures secure, plug-and-play scaling without giving the LLM raw API keys.
            </p>
          </div>

          <div className="bg-[#1C1C1E] border border-[#2C2C2E] p-8 rounded-3xl relative overflow-hidden group hover:border-purple-500/50 transition">
            <div className="absolute top-[-20%] right-[-5%] p-8 opacity-5 group-hover:opacity-10 transition"><Database className="w-64 h-64 text-purple-400" /></div>
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-3"><Database className="w-6 h-6 text-purple-400"/> Dynamic AG-UI</h2>
            <p className="text-[#D1D1D6] leading-relaxed mb-4 text-lg">
              Instead of hardcoded React views, the frontend utilizes an AI-Generated UI (AG-UI) renderer. The agent produces layout schemas (Tables, Forms, Dashboards) natively, and Next.js instantly compiles them into interactive, branded UI components.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
