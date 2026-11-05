import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ThumbsUp, ThumbsDown, Filter, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatMessage, PolicySummary } from '../types';
import { sendChatMessage, submitFeedback } from '../api/client';
import { SourceCard } from './SourceCard';

interface ChatTabProps {
  policies: PolicySummary[];
  onQuestionAsked?: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ policies, onQuestionAsked }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am PolicyLens AI. Ask me any question regarding your insurance policy coverage, exclusions, deductibles, or claim duties. I provide answers strictly grounded in your policy documents.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = [
    "What is the collision deductible under SecureDrive?",
    "Within how many hours must an accident be reported in RoadGuard?",
    "Does SecureDrive cover damage caused by a volcanic eruption?",
    "How much does TravelShield reimburse for delayed baggage?",
    "What are the claim documents required under SecureDrive?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingStep]);

  const handleSend = async (queryText?: string) => {
    const query = queryText || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      // Step-by-step loading state sequence for hackathon visual feedback
      setLoadingStep('Searching policy clauses...');
      await new Promise((r) => setTimeout(r, 250));
      
      setLoadingStep('Retrieving relevant sections...');
      await new Promise((r) => setTimeout(r, 250));

      setLoadingStep('Generating grounded answer...');
      const res = await sendChatMessage(query, selectedPolicy);

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        grounded: res.grounded,
        sources: res.sources,
        confidenceScore: res.confidence_score,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (onQuestionAsked) onQuestionAsked();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to retrieve supporting policy sections. Policy service is temporarily unavailable.',
          grounded: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleFeedback = async (msgId: string, question: string, answer: string, sourceStr: string, rating: 'helpful' | 'not_helpful') => {
    try {
      await submitFeedback(question, answer, sourceStr, rating);
      setFeedbackSubmitted((prev) => ({ ...prev, [msgId]: rating }));
    } catch (e) {
      console.error('Error submitting feedback:', e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[580px] glass-card rounded-2xl border border-slate-800 overflow-hidden">
      
      {/* Policy Selection Header Bar */}
      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Target Policy Scope:</span>
          <select
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Indexed Policies (Global Search)</option>
            {policies.map((p) => (
              <option key={p.policy_id} value={p.policy_id}>
                {p.policy_title}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[11px] text-slate-400">
          Strict RAG Refusal Mode Active
        </span>
      </div>

      {/* Preset Suggestions Chips */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="text-[11px] font-medium text-slate-400 shrink-0">Try Demo Queries:</span>
        {presetQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Content Bubble */}
            <div className={`space-y-1 max-w-[85%]`}>
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none font-medium'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Grounded Source Evidence Block */}
                {msg.sender === 'assistant' && msg.id !== 'welcome' && (
                  <SourceCard
                    sources={msg.sources || []}
                    grounded={msg.grounded ?? false}
                  />
                )}
              </div>

              {/* Timestamp & Feedback Footer for Assistant */}
              <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && msg.id !== 'welcome' && (
                  <div className="flex items-center gap-2">
                    {feedbackSubmitted[msg.id] ? (
                      <span className="text-emerald-400 font-medium">
                        ✓ Thanks — feedback recorded
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleFeedback(
                              msg.id,
                              messages.find((m) => m.id < msg.id && m.sender === 'user')?.text || '',
                              msg.text,
                              msg.sources?.[0]?.policy_title || '',
                              'helpful'
                            )
                          }
                          className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3" /> Helpful
                        </button>
                        <button
                          onClick={() =>
                            handleFeedback(
                              msg.id,
                              messages.find((m) => m.id < msg.id && m.sender === 'user')?.text || '',
                              msg.text,
                              msg.sources?.[0]?.policy_title || '',
                              'not_helpful'
                            )
                          }
                          className="hover:text-rose-400 flex items-center gap-1 transition-colors"
                        >
                          <ThumbsDown className="w-3 h-3" /> Not Helpful
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-cyan-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{loadingStep || 'Processing RAG query...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a policy coverage, deductible, exclusion, or claim question..."
            disabled={isLoading}
            className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
