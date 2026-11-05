import React from 'react';
import { ShieldCheck, FileText, Quote, AlertTriangle } from 'lucide-react';
import { SourceReference } from '../types';

interface SourceCardProps {
  sources: SourceReference[];
  grounded: boolean;
}

export const SourceCard: React.FC<SourceCardProps> = ({ sources, grounded }) => {
  if (!grounded || sources.length === 0) {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
          <AlertTriangle className="w-4 h-4" />
          <span>No Supporting Policy Clause Found</span>
        </div>
        <p className="text-amber-200/80">
          The requested question could not be verified in the indexed policy documents. No assumption or external coverage advice was generated.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-800/40 shadow-inner">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Retrieved Policy Evidence</span>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
          {sources.length} Clause{sources.length > 1 ? 's' : ''} Matched
        </span>
      </div>

      <div className="space-y-3">
        {sources.map((src, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-slate-300 font-medium">
              <div className="flex items-center gap-1.5 text-slate-200">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-cyan-300">{src.policy_title}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-mono text-[11px]">
                §{src.section} • Clause {src.clause}
              </span>
            </div>

            <p className="text-slate-400 font-medium text-[11px]">
              Clause Title: <span className="text-slate-200">{src.clause_title}</span>
            </p>

            {src.evidence && (
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800/60 text-slate-300 italic flex items-start gap-2">
                <Quote className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">"{src.evidence}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
