export interface PolicySummary {
  policy_id: string;
  policy_title: string;
  policy_number: string;
  effective_date: string;
  document_name: string;
  section_count: number;
  chunk_count: number;
  status: string;
}

export interface Clause {
  clause_number: string;
  clause_title: string;
  section_number: string;
  section_title: string;
  content: string;
}

export interface Section {
  section_number: string;
  section_title: string;
  clauses: Clause[];
}

export interface PolicyDetail {
  policy_id: string;
  policy_title: string;
  policy_number: string;
  effective_date: string;
  document_name: string;
  sections: Section[];
}

export interface SourceReference {
  policy_title: string;
  section: string;
  clause: string;
  clause_title: string;
  evidence: string;
}

export interface ChatResponse {
  answer: string;
  grounded: boolean;
  sources: SourceReference[];
  confidence_score?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  grounded?: boolean;
  sources?: SourceReference[];
  confidenceScore?: number;
  timestamp: string;
  feedback?: 'helpful' | 'not_helpful';
}

export interface ComparisonRow {
  feature: string;
  policy_a: string;
  policy_b: string;
}

export interface CompareResponse {
  policy_a_name: string;
  policy_b_name: string;
  comparison_table: ComparisonRow[];
  plain_language_difference: string;
}

export interface EvaluationItem {
  id: number;
  category: string;
  question: string;
  answerable: boolean;
  expected_policy: string;
  expected_clause: string;
  answer: string;
  grounded: boolean;
  passed: boolean;
  status_note: string;
  sources: SourceReference[];
}

export interface EvaluationReport {
  total_questions: number;
  grounded_count: number;
  declined_count: number;
  source_attribution_accuracy: number;
  accuracy_score: number;
  results: EvaluationItem[];
}

export interface FeedbackItem {
  id: number;
  question: string;
  answer: string;
  source?: string;
  rating: 'helpful' | 'not_helpful';
  timestamp: string;
}

export interface SystemStats {
  policies_indexed: number;
  clauses_indexed: number;
  questions_answered: number;
  feedback_received: number;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}
