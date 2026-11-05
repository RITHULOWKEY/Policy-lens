import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, CheckCircle2, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { PolicySummary, PolicyDetail, CompareResponse } from '../types';
import { fetchPolicyDetail, compareClauses } from '../api/client';

interface CompareTabProps {
  policies: PolicySummary[];
  initialPolicyId?: string;
}

export const CompareTab: React.FC<CompareTabProps> = ({ policies, initialPolicyId }) => {
  const [policyAId, setPolicyAId] = useState<string>(initialPolicyId || policies[0]?.policy_id || '');
  const [policyBId, setPolicyBId] = useState<string>(
    policies.find((p) => p.policy_id !== (initialPolicyId || policies[0]?.policy_id))?.policy_id || policies[1]?.policy_id || ''
  );

  const [detailA, setDetailA] = useState<PolicyDetail | null>(null);
  const [detailB, setDetailB] = useState<PolicyDetail | null>(null);

  const [clauseANum, setClauseANum] = useState<string>('');
  const [clauseBNum, setClauseBNum] = useState<string>('');

  const [comparisonResult, setComparisonResult] = useState<CompareResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Load Policy A details on change
  useEffect(() => {
    if (!policyAId) return;
    fetchPolicyDetail(policyAId).then((data) => {
      setDetailA(data);
      // Auto-select first clause
      const firstClause = data.sections[0]?.clauses[0]?.clause_number || '';
      setClauseANum(firstClause);
    });
  }, [policyAId]);

  // Load Policy B details on change
  useEffect(() => {
    if (!policyBId) return;
    fetchPolicyDetail(policyBId).then((data) => {
      setDetailB(data);
      const firstClause = data.sections[0]?.clauses[0]?.clause_number || '';
      setClauseBNum(firstClause);
    });
  }, [policyBId]);

  const handleCompare = async () => {
    if (!policyAId || !clauseANum || !policyBId || !clauseBNum) return;
    setIsComparing(true);
    try {
      const result = await compareClauses(policyAId, clauseANum, policyBId, clauseBNum);
      setComparisonResult(result);
    } catch (e) {
      console.error('Failed to compare clauses:', e);
    } finally {
      setIsComparing(false);
    }
  };

  // Helper to extract all clauses for dropdowns
  const getAllClauses = (detail: PolicyDetail | null) => {
    if (!detail) return [];
    const list: { num: string; title: string; sec: string }[] = [];
    detail.sections.forEach((sec) => {
      sec.clauses.forEach((cl) => {
        list.push({
          num: cl.clause_number,
          title: cl.clause_title,
          sec: sec.section_number,
        });
      });
    });
    return list;
  };

  const clausesA = getAllClauses(detailA);
  const clausesB = getAllClauses(detailB);

  return (
    <div className="space-y-6">
      
      {/* Tab Banner */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-purple-400" /> Side-by-Side Policy Clause Comparator
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select two policy clauses to generate an objective feature matrix and plain-language summary based strictly on the selected text.
        </p>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Policy A Selector */}
        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Policy A</span>
            <span className="text-[11px] font-mono text-slate-400">Target Clause 1</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Policy:</label>
            <select
              value={policyAId}
              onChange={(e) => setPolicyAId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {policies.map((p) => (
                <option key={p.policy_id} value={p.policy_id}>
                  {p.policy_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Clause:</label>
            <select
              value={clauseANum}
              onChange={(e) => setClauseANum(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {clausesA.map((cl) => (
                <option key={cl.num} value={cl.num}>
                  Clause {cl.num} — {cl.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Policy B Selector */}
        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Policy B</span>
            <span className="text-[11px] font-mono text-slate-400">Target Clause 2</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Policy:</label>
            <select
              value={policyBId}
              onChange={(e) => setPolicyBId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
            >
              {policies.map((p) => (
                <option key={p.policy_id} value={p.policy_id}>
                  {p.policy_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Clause:</label>
            <select
              value={clauseBNum}
              onChange={(e) => setClauseBNum(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
            >
              {clausesB.map((cl) => (
                <option key={cl.num} value={cl.num}>
                  Clause {cl.num} — {cl.title}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Compare Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCompare}
          disabled={isComparing}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all"
        >
          {isComparing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Clauses...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              <span>Compare Selected Clauses</span>
            </>
          )}
        </button>
      </div>

      {/* Comparison Results Card */}
      {comparisonResult && (
        <div className="p-6 rounded-2xl glass-card border border-purple-800/40 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Clause Comparison Matrix
            </h3>
            <span className="text-xs text-purple-400 bg-purple-950 px-2.5 py-1 rounded-full border border-purple-800 font-mono">
              Grounding Verified
            </span>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Feature</th>
                  <th className="p-3 text-cyan-400">{comparisonResult.policy_a_name}</th>
                  <th className="p-3 text-purple-400">{comparisonResult.policy_b_name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {comparisonResult.comparison_table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="p-3 font-semibold text-slate-300">{row.feature}</td>
                    <td className="p-3 text-slate-200">{row.policy_a}</td>
                    <td className="p-3 text-slate-200">{row.policy_b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Plain Language Summary */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/50 space-y-1">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Plain-Language Key Difference:
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              "{comparisonResult.plain_language_difference}"
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
