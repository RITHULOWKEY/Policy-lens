import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { ChatTab } from './components/ChatTab';
import { PoliciesTab } from './components/PoliciesTab';
import { CompareTab } from './components/CompareTab';
import { EvaluationTab } from './components/EvaluationTab';
import { FeedbackTab } from './components/FeedbackTab';
import { GlossaryTab } from './components/GlossaryTab';
import { Disclaimer } from './components/Disclaimer';

import { SystemStats, PolicySummary } from './types';
import { fetchStats, fetchPolicies } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [comparePolicyId, setComparePolicyId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    try {
      const [sData, pData] = await Promise.all([fetchStats(), fetchPolicies()]);
      setStats(sData);
      setPolicies(pData);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAskPolicy = (policyId: string) => {
    setActiveTab('chat');
  };

  const handleComparePolicy = (policyId?: string) => {
    if (policyId) setComparePolicyId(policyId);
    setActiveTab('compare');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StatsBanner stats={stats} />

        {activeTab === 'chat' && (
          <ChatTab policies={policies} onQuestionAsked={loadData} />
        )}

        {activeTab === 'policies' && (
          <PoliciesTab
            policies={policies}
            onAskQuestions={handleAskPolicy}
            onCompare={handleComparePolicy}
          />
        )}

        {activeTab === 'compare' && (
          <CompareTab policies={policies} initialPolicyId={comparePolicyId} />
        )}

        {activeTab === 'evaluation' && <EvaluationTab />}

        {activeTab === 'feedback' && <FeedbackTab />}

        {activeTab === 'glossary' && <GlossaryTab />}
      </main>

      <Disclaimer />
    </div>
  );
};

export default App;
