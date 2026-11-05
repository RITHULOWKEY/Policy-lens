import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { FeedbackItem } from '../types';
import { fetchFeedbackList } from '../api/client';

export const FeedbackTab: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFeedbackList();
      setFeedbackList(data);
    } catch (e) {
      console.error('Failed to load feedback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const helpfulCount = feedbackList.filter((f) => f.rating === 'helpful').length;
  const notHelpfulCount = feedbackList.filter((f) => f.rating === 'not_helpful').length;

  return (
    <div className="space-y-6">
      
      {/* Banner & Controls */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-emerald-400" /> User Feedback Review Panel
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit logs of user ratings (👍 Helpful / 👎 Not Helpful) on generated policy answers.
          </p>
        </div>

        <button
          onClick={loadFeedback}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/40">
          <span className="text-xs text-slate-400 font-medium">Total Submissions</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">{feedbackList.length}</h3>
        </div>
        <div className="p-4 rounded-xl glass-card border border-emerald-500/30 bg-emerald-950/20">
          <span className="text-xs text-slate-400 font-medium">Helpful Ratings</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">{helpfulCount}</h3>
        </div>
        <div className="p-4 rounded-xl glass-card border border-rose-500/30 bg-rose-950/20">
          <span className="text-xs text-slate-400 font-medium">Not Helpful Ratings</span>
          <h3 className="text-2xl font-bold text-rose-400 mt-1">{notHelpfulCount}</h3>
        </div>
      </div>

      {/* Feedback Logs Table */}
      <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" /> Logged Q&A Feedback Records
        </h3>

        {feedbackList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
            No user feedback submitted yet. Submit thumbs up/down ratings in the Ask Policy chatbot tab to populate this review log!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Rating</th>
                  <th className="p-3">User Question</th>
                  <th className="p-3">Generated Answer</th>
                  <th className="p-3">Source Reference</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {feedbackList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50">
                    <td className="p-3">
                      {item.rating === 'helpful' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <ThumbsUp className="w-3 h-3" /> Helpful
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          <ThumbsDown className="w-3 h-3" /> Not Helpful
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-200 max-w-xs">{item.question}</td>
                    <td className="p-3 text-slate-300 max-w-sm truncate" title={item.answer}>
                      {item.answer}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-cyan-400">{item.source || 'N/A'}</td>
                    <td className="p-3 text-slate-500 font-mono text-[10px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
