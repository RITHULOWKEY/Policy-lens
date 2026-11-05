import React, { useState } from 'react';
import { FileText, CheckCircle2, Eye, MessageSquare, GitCompare, Calendar, Layers } from 'lucide-react';
import { PolicySummary, PolicyDetail } from '../types';
import { fetchPolicyDetail } from '../api/client';
import { ClauseViewerModal } from './ClauseViewerModal';

interface PoliciesTabProps {
  policies: PolicySummary[];
  onAskQuestions: (policyId: string) => void;
  onCompare: (policyId?: string) => void;
}

export const PoliciesTab: React.FC<PoliciesTabProps> = ({ policies, onAskQuestions, onCompare }) => {
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState<PolicyDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const handleOpenViewer = async (policyId: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await fetchPolicyDetail(policyId);
      setSelectedPolicyDetail(detail);
    } catch (e) {
      console.error('Failed to load policy detail:', e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Indexed Policy Document Library</h2>
          <p className="text-xs text-slate-400">
            Fictional insurance policies ingested, chunked, and vector-indexed for grounded retrieval.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/60 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span>All 3 Policies Active & Vector Ready</span>
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {policies.map((p) => (
          <div
            key={p.policy_id}
            className="p-5 rounded-2xl glass-card glass-card-hover border border-slate-800 flex flex-col justify-between"
          >
            <div>
              {/* Badge & Title */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  FICTIONAL / DEMO POLICY
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 mb-1">{p.policy_title}</h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">Number: {p.policy_number}</p>

              {/* Metadata Badges */}
              <div className="space-y-2 text-xs text-slate-300 mb-6 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Effective Date:
                  </span>
                  <span className="font-semibold text-slate-200">{p.effective_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" /> Structure:
                  </span>
                  <span className="font-semibold text-slate-200">{p.section_count} Sections</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> Indexed Chunks:
                  </span>
                  <span className="font-semibold text-cyan-400">{p.chunk_count} Chunks</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleOpenViewer(p.policy_id)}
                disabled={isLoadingDetail}
                className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>View</span>
              </button>
              <button
                onClick={() => onAskQuestions(p.policy_id)}
                className="px-2 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
              <button
                onClick={() => onCompare(p.policy_id)}
                className="px-2 py-2 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Clause Viewer Modal */}
      {selectedPolicyDetail && (
        <ClauseViewerModal
          policy={selectedPolicyDetail}
          onClose={() => setSelectedPolicyDetail(null)}
          onSelectClauseForCompare={() => onCompare(selectedPolicyDetail.policy_id)}
        />
      )}

    </div>
  );
};
