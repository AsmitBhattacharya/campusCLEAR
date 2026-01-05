
import { Company, UserProfile, PrepLevel } from '../types';
import { MOCK_COMPANIES } from '../constants';

// Simulated Firebase Store
class MockDb {
  private users: UserProfile[] = [];
  private companies: Company[] = [...MOCK_COMPANIES];

  constructor() {
    this.initMockUsers();
  }

  private initMockUsers() {
    const mockNames = [
      'Priya Sharma', 'Rahul Varma', 'Sneha Reddy', 'Amit Kumar', 
      'Ananya Das', 'Vikram Singh', 'Zoya Khan', 'Rohan Mehta', 
      'Isha Gupta', 'Karan Johar', 'Siddharth Malhotra', 'Kiara Advani',
      'Varun Dhawan', 'Alia Bhatt', 'Ranbir Kapoor', 'Deepika Padukone',
      'Arjun Kapoor', 'Malaika Arora', 'Kartik Aaryan', 'Sara Ali Khan'
    ];
    const branches = ['CSE', 'ECE', 'EE', 'EIE', 'ME', 'CE', 'BE', 'CH'];
    
    mockNames.forEach((name, i) => {
      // Create diverse progress for different users
      const streakWeeks = Math.floor(Math.random() * 12);
      const streakDays = (streakWeeks * 7) + Math.floor(Math.random() * 7);
      
      let level = PrepLevel.BEGINNER;
      if (streakWeeks >= 4) level = PrepLevel.PRO;
      else if (streakWeeks >= 2) level = PrepLevel.ADVANCED;
      else if (streakWeeks >= 1) level = PrepLevel.INTERMEDIATE;

      this.users.push({
        uid: `mock-${i}`,
        displayName: name,
        branch: branches[i % branches.length],
        college: 'Engineering Institute of Tech',
        cgpa: 7.0 + Math.random() * 2.8,
        gradYear: 2025,
        streakDays: streakDays,
        streakWeeks: streakWeeks,
        prepLevel: level,
        milestones: [],
        weeklyCheck: [true, true, i % 2 === 0, true, i % 3 === 0, false, false]
      });
    });
  }

  saveUser(user: UserProfile) {
    const idx = this.users.findIndex(u => u.uid === user.uid);
    if (idx > -1) this.users[idx] = user;
    else this.users.push(user);
    localStorage.setItem('campus_user', JSON.stringify(user));
  }

  getUser(uid: string) {
    return this.users.find(u => u.uid === uid);
  }

  getCompanies() {
    return this.companies;
  }

  addCompany(company: Company) {
    this.companies.unshift(company);
  }

  addComment(companyId: string, comment: { userName: string, text: string }) {
    const company = this.companies.find(c => c.id === companyId);
    if (company) {
      company.comments.unshift({ ...comment, timestamp: Date.now() });
    }
  }

  getRankings(college: string) {
    return this.users
      .filter(u => u.college === college)
      .sort((a, b) => {
        if (b.streakWeeks !== a.streakWeeks) return b.streakWeeks - a.streakWeeks;
        return b.streakDays - a.streakDays;
      });
  }
}

export const db = new MockDb();
