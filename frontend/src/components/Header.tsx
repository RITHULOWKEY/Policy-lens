import React from 'react';
import { ShieldCheck, MessageSquare, BookOpen, GitCompare, Award, ThumbsUp, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'chat', label: 'Ask Policy', icon: MessageSquare },
    { id: 'policies', label: 'Policies', icon: BookOpen },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'evaluation', label: 'Evaluation', icon: Award },
    { id: 'feedback', label: 'Feedback', icon: ThumbsUp },
    { id: 'glossary', label: 'Glossary', icon: HelpCircle },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">PolicyLens AI</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  RAG • Source Grounded • Demo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grounded answers strictly from your insurance policy documents.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
};
