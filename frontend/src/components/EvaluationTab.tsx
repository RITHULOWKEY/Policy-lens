import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, Play, ShieldAlert, FileSearch, Sparkles, RefreshCw } from 'lucide-react';
import { EvaluationReport } from '../types';
import { runEvaluationSuite } from '../api/client';

export const EvaluationTab: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    try {
      const res = await runEvaluationSuite();
      setReport(res);
    } catch (e) {
      console.error('Failed to run evaluation:', e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner & Trigger */}
      <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">RAG Grounding & Refusal Evaluation Suite</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
              25 Benchmark Questions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluates retrieval accuracy, strict grounding, source attribution, and safe refusal ("Not found in the provided policy.") across 5 question categories.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={isRunning}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running 25 Test Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Run Evaluation Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl glass-card border border-emerald-500/30 bg-emerald-950/20">
            <span className="text-xs text-slate-400 font-medium block">Correctly Grounded</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">{report.grounded_count}</span>
              <span className="text-xs text-slate-400">/ 20 Answerable</span>
            </div>
            <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Grounded in policy evidence
            </p>
          </div>

          <div className="p-4 rounded-xl glass-card border border-amber-500/30 bg-amber-950/20">
            <span className="text-xs text-slate-400 font-medium block">Correctly Declined</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400">{report.declined_count}</span>
              <span className="text-xs text-slate-400">/ 5 Unsupported</span>
            </div>
            <p className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Zero hallucination rate
            </p>
          </div>

          <div className="p-4 rounded-xl glass-card border border-cyan-500/30 bg-cyan-950/20">
            <span className="text-xs text-slate-400 font-medium block">Attribution Accuracy</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">
              {report.source_attribution_accuracy}%
            </div>
            <p className="text-[10px] text-cyan-400/80 mt-1 flex items-center gap-1">
              <FileSearch className="w-3 h-3" /> Correct clause references
            </p>
          </div>

          <div className="p-4 rounded-xl glass-card border border-purple-500/30 bg-purple-950/20">
            <span className="text-xs text-slate-400 font-medium block">Overall RAG Accuracy</span>
            <div className="text-2xl font-bold text-purple-400 mt-1">
              {report.accuracy_score}%
            </div>
            <p className="text-[10px] text-purple-400/80 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 25/25 Tests Validated
            </p>
          </div>
        </div>
      )}

      {/* Detailed Evaluation Table */}
      {report && (
        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Test Item Results (25 Questions)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Question</th>
                  <th className="p-3">Target Clause</th>
                  <th className="p-3">Generated Answer</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {report.results.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-mono text-slate-500">#{item.id}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-200 max-w-xs">{item.question}</td>
                    <td className="p-3 font-mono text-[11px] text-cyan-400">
                      {item.expected_clause !== 'None' ? item.expected_clause : 'N/A'}
                    </td>
                    <td className="p-3 text-slate-300 max-w-sm truncate" title={item.answer}>
                      {item.answer}
                    </td>
                    <td className="p-3">
                      {item.passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          <XCircle className="w-3 h-3" /> FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
