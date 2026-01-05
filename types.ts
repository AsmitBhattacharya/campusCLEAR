
export enum PrepLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  PRO = 'Pro'
}

export interface UserProfile {
  uid: string;
  displayName: string;
  branch: string;
  college: string;
  cgpa: number;
  gradYear: number;
  streakDays: number;
  streakWeeks: number;
  prepLevel: PrepLevel;
  milestones: Milestone[];
  weeklyCheck: boolean[]; // 7 days
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  userName: string;
  text: string;
  timestamp: number;
}

export interface Company {
  id: string;
  companyName: string;
  minCGPA: number;
  roles: string[];
  package: string;
  branches: string[];
  logo: string;
  comments: Comment[];
}

export interface GeminiCompanyOverview {
  stages: string[];
  mustKnowTopics: string[];
  hiringTrends: string;
}

export interface ResumeCritique {
  score: number;
  good: string[];
  bad: string[];
  summary: string;
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface InterviewFeedback {
  technicalAccuracy: string;
  communicationStyle: string;
  postureAndTechnique: string;
  confidence: string;
  overallScore: number; // Scale of 10
}
