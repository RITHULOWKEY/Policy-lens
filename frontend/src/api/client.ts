import {
  SystemStats,
  PolicySummary,
  PolicyDetail,
  ChatResponse,
  CompareResponse,
  EvaluationReport,
  FeedbackItem,
  GlossaryTerm
} from '../types';

const API_BASE_URL = '/api';

export async function fetchStats(): Promise<SystemStats> {
  const res = await fetch(`${API_BASE_URL}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchPolicies(): Promise<PolicySummary[]> {
  const res = await fetch(`${API_BASE_URL}/policies`);
  if (!res.ok) throw new Error('Failed to fetch policies');
  const data = await res.json();
  return data.policies;
}

export async function fetchPolicyDetail(policyId: string): Promise<PolicyDetail> {
  const res = await fetch(`${API_BASE_URL}/policies/${policyId}`);
  if (!res.ok) throw new Error('Failed to fetch policy details');
  return res.json();
}

export async function sendChatMessage(query: string, policyFilter?: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, policy_filter: policyFilter }),
  });
  if (!res.ok) throw new Error('Failed to send question');
  return res.json();
}

export async function compareClauses(
  policy_a_id: string,
  clause_a_num: string,
  policy_b_id: string,
  clause_b_num: string
): Promise<CompareResponse> {
  const res = await fetch(`${API_BASE_URL}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policy_a_id, clause_a_num, policy_b_id, clause_b_num }),
  });
  if (!res.ok) throw new Error('Failed to compare clauses');
  return res.json();
}

export async function submitFeedback(
  question: string,
  answer: string,
  source: string,
  rating: 'helpful' | 'not_helpful'
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer, source, rating }),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
}

export async function fetchFeedbackList(): Promise<FeedbackItem[]> {
  const res = await fetch(`${API_BASE_URL}/feedback`);
  if (!res.ok) throw new Error('Failed to fetch feedback list');
  const data = await res.json();
  return data.feedback;
}

export async function runEvaluationSuite(): Promise<EvaluationReport> {
  const res = await fetch(`${API_BASE_URL}/evaluate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to run evaluation suite');
  return res.json();
}

export async function fetchGlossary(): Promise<GlossaryTerm[]> {
  const res = await fetch(`${API_BASE_URL}/glossary`);
  if (!res.ok) throw new Error('Failed to fetch glossary');
  const data = await res.json();
  return data.terms;
}
