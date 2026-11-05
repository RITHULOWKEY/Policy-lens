import React, { useState } from 'react';
import { X, FileText, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { PolicyDetail, Clause } from '../types';

interface ClauseViewerModalProps {
  policy: PolicyDetail | null;
  onClose: () => void;
  onSelectClauseForCompare?: (policyId: string, clauseNum: string) => void;
}

export const ClauseViewerModal: React.FC<ClauseViewerModalProps> = ({
  policy,
  onClose,
  onSelectClauseForCompare,
}) => {
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(0);
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);

  if (!policy) return null;

  const currentSection = policy.sections[selectedSectionIdx] || policy.sections[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{policy.policy_title}</h2>
              <p className="text-xs text-slate-400">
                Effective Date: {policy.effective_date} • {policy.document_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          
          {/* Section List (Left Column) */}
          <div className="border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 block mb-2">
              Policy Sections
            </span>
            {policy.sections.map((sec, idx) => (
              <button
                key={sec.section_number}
                onClick={() => {
                  setSelectedSectionIdx(idx);
                  setSelectedClause(null);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  selectedSectionIdx === idx
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span>§{sec.section_number} {sec.section_title}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>

          {/* Clause List & Clause Detail (Right 2 Columns) */}
          <div className="md:col-span-2 p-4 overflow-y-auto space-y-4">
            {currentSection && (
              <div>
                <h3 className="text-sm font-bold text-cyan-400 mb-3 pb-1 border-b border-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Section {currentSection.section_number}: {currentSection.section_title}
                </h3>

                <div className="space-y-3">
                  {currentSection.clauses.map((cl) => (
                    <div
                      key={cl.clause_number}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">
                          Clause {cl.clause_number} — {cl.clause_title}
                        </span>
                        {onSelectClauseForCompare && (
                          <button
                            onClick={() => {
                              onSelectClauseForCompare(policy.policy_id, cl.clause_number);
                              onClose();
                            }}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 transition-colors"
                          >
                            + Select for Compare
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {cl.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
