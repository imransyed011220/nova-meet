/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface MeetingNote {
  id: string;
  title: string;
  timestamp: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems?: ActionItem[];
  keywords?: string[];
  studyCards?: { id: string; question: string; answer: string }[];
  speakerDetection?: { speaker: string; text: string; feedback?: 'correct' | 'incorrect' | string }[];
  speakerBreakdown?: { speaker: string; percentage: number; topics: string[] }[];
  analysis?: {
    sentiment: string;
    productivity: string;
    decisions: string[];
    risks: string[];
  };
  transcript_with_confidence?: {
    text: string;
    confidence: number;
  }[];
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
    overall: string;
  };
  health_score?: {
    score: number;
    label: string;
    reasons: string[];
  };
  key_moments?: {
    timestamp: string;
    description: string;
  }[];
  detected_language?: string;
  questions_detected?: string[];
  talk_time?: {
    speaker: string;
    percentage: number;
  }[];
  duration: number | string;
  feedback?: 'positive' | 'negative';
  type: 'recording' | 'upload';
  fileName?: string;
  fileSize?: string;
  startTime?: string;
  endTime?: string;
  userNotes?: { timestamp: string; content: string }[];
  extractedQuestions?: { question: string; answer?: string }[];
  keyDecisions?: string[];
  themes?: string[];
  importantPoints?: string[];

  // Advanced AI Intelligence
  riskAnalysis?: RiskItem[];
  unansweredQuestions?: UnansweredQuestion[];
  responsibilityGaps?: ResponsibilityGap[];
  conflicts?: ConflictItem[];
  meetingEfficiency?: MeetingEfficiency;
}

export interface RiskItem {
  text: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface UnansweredQuestion {
  question: string;
  context?: string;
}

export interface ResponsibilityGap {
  task: string;
  reason: string;
}

export interface ConflictItem {
  earlier: string;
  later: string;
  explanation: string;
}

export interface MeetingEfficiency {
  score: number;
  decisionsCount: number;
  actionItemsCount: number;
  unclearPoints: number;
  productivityLevel: 'Low' | 'Medium' | 'High';
}

export interface AnalyticsData {
  totalMeetings: number;
  totalRecordings: number;
  totalUploads: number;
  totalDurationSeconds: number;
  commonKeywords: { word: string; count: number }[];
}

export type RecordingStatus = 'idle' | 'listening' | 'recording' | 'processing' | 'completed' | 'error';
