
import { Company, PrepLevel, UserProfile } from './types';

export const BRANCHES = ['CSE', 'ECE', 'EE', 'EIE', 'ME', 'CE', 'BE', 'CH'];

export const INITIAL_USER: UserProfile = {
  uid: 'u1',
  displayName: 'Alex Rivers',
  branch: 'CSE',
  college: 'Engineering Institute of Tech',
  cgpa: 8.5,
  gradYear: 2025,
  streakDays: 12,
  streakWeeks: 2,
  prepLevel: PrepLevel.INTERMEDIATE,
  milestones: [],
  weeklyCheck: [false, false, false, false, false, false, false]
};

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'c1',
    companyName: 'Google',
    minCGPA: 8.0,
    roles: ['Software Engineer', 'Data Scientist'],
    package: '30-45 LPA',
    branches: ['CSE', 'ECE', 'EE'],
    logo: '',
    comments: []
  },
  {
    id: 'c2',
    companyName: 'Microsoft',
    minCGPA: 7.5,
    roles: ['Product Manager', 'Cloud Engineer'],
    package: '25-40 LPA',
    branches: ['CSE', 'IT', 'ECE'],
    logo: '',
    comments: []
  },
  {
    id: 'c3',
    companyName: 'Goldman Sachs',
    minCGPA: 8.5,
    roles: ['Analyst', 'Quant'],
    package: '28-35 LPA',
    branches: ['CSE', 'EE', 'CH'],
    logo: '',
    comments: []
  },
  {
    id: 'c4',
    companyName: 'Amazon',
    minCGPA: 7.0,
    roles: ['SDE-1', 'Operations'],
    package: '22-32 LPA',
    branches: ['CSE', 'ECE', 'EE', 'EIE', 'ME', 'CE', 'BE', 'CH'],
    logo: '',
    comments: []
  },
  {
    id: 'c5',
    companyName: 'Texas Instruments',
    minCGPA: 8.2,
    roles: ['Analog Design', 'Embedded Systems'],
    package: '18-24 LPA',
    branches: ['ECE', 'EE', 'EIE'],
    logo: '',
    comments: []
  }
];

export const SYSTEM_INSTRUCTION = `You are the core AI engine for CampusCLEAR, a social-media-cum-placement-prep app. Your goal is to act as a career coach, data organizer, and interviewer.

Operational Guidelines:
1. The Ledger (Placement Intelligence): Provide stage-wise interview breakdowns, technical topics, and hiring trends.
2. Practice Section (AI Coach): 
   - Resume Review: Use "Critique & Fix" framework.
   - Mock Interview: Adaptive difficulty based on Prep Level. 5 questions one-by-one.
   - Resume Quiz: 10-15 MCQs based 70% on technical skills in resume and 30% on experience.
3. Streak & Rank Logic: Acknowledge user level. Encouraging if low, challenging if high.`;
