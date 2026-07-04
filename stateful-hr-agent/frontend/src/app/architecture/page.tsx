import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Server, Database, BrainCircuit, Blocks, Sparkles, ChevronRight } from 'lucide-react';

const sections = [
  {
    icon: BrainCircuit,
    title: 'LangGraph Agent',
    description:
      'The brain of the system. Instead of simple conversational turns, LangGraph models a deterministic state machine. It detects intents, formulates a plan, selects tools, and tracks memory (like selected candidate IDs) across steps.',
  },
  {
    icon: Server,
    title: 'MCP Protocol',
    description:
      'Model Context Protocol (MCP) strictly isolates the AI Agent from external systems. The Agent can only emit standard JSON payloads to defined MCP servers (Postgres, Gmail, Calendar, Docs). This ensures secure, plug-and-play scaling without giving the LLM raw API keys.',
  },
  {
    icon: Database,
    title: 'Dynamic AG-UI',
    description:
      'Instead of hardcoded React views, the frontend utilizes an AI-Generated UI (AG-UI) renderer. The agent produces layout schemas (Tables, Forms, Dashboards) natively, and Next.js instantly compiles them into interactive, branded UI components.',
  },
];

export default function Architecture() {
  return (
    <div className="min-h-screen bg-black text-[#f5f5f5] p-8 md:p-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[12px] font-medium text-[#a0a0a0] hover:text-white transition-colors mb-12 bg-[#111] border border-[#222] px-4 py-2 rounded-lg"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Workspace
      </Link>

      <div className="max-w-3xl mx-auto">
        <div className="mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#666] font-medium mb-4 bg-[#0a0a0a] border border-[#1a1a1a] px-2.5 py-1 rounded-full">
            <BrainCircuit className="w-3.5 h-3.5" />
            Architecture
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            System Architecture
          </h1>
          <p className="text-[14px] text-[#a0a0a0] mt-3 max-w-lg leading-relaxed">
            How the Stateful AI HR Agent Platform operates autonomously under the hood.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 md:p-8 hover:border-[#333] transition-colors animate-slide-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#f5f5f5]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[16px] font-semibold text-white">
                      {section.title}
                    </h2>
                    <p className="text-[13px] text-[#a0a0a0] mt-2 leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 border-t border-[#1a1a1a] pt-6 flex justify-between items-center text-[#666]">
          <p className="text-[11px] font-medium tracking-wide">
            Stateful HR Agent
          </p>
          <p className="text-[11px] font-mono">
            HackIndia 2026
          </p>
        </div>
      </div>
    </div>
  );
}
