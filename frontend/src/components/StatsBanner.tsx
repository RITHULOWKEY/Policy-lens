import React from 'react';
import { FileText, Layers, MessageSquareText, ThumbsUp } from 'lucide-react';
import { SystemStats } from '../types';

interface StatsBannerProps {
  stats: SystemStats | null;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Policies Indexed',
      value: stats ? stats.policies_indexed : '3',
      icon: FileText,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20',
    },
    {
      label: 'Clauses Indexed',
      value: stats ? stats.clauses_indexed : '48',
      icon: Layers,
      color: 'from-cyan-500/20 to-teal-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      label: 'Questions Answered',
      value: stats ? stats.questions_answered : '0',
      icon: MessageSquareText,
      color: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20',
    },
    {
      label: 'Feedback Received',
      value: stats ? stats.feedback_received : '0',
      icon: ThumbsUp,
      color: 'from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {statItems.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-xl glass-card bg-gradient-to-br ${item.color} border flex items-center justify-between`}
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{item.value}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
