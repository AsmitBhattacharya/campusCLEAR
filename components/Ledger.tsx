
import React, { useState, useMemo, useEffect } from 'react';
import { db as firebaseDb } from '../services/firebase';
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { Company, GeminiCompanyOverview, UserProfile } from '../types';
import { getCompanyOverview } from '../services/geminiService';
import { BRANCHES, MOCK_COMPANIES } from '../constants';

interface Props {
  user: UserProfile;
}

const Ledger: React.FC<Props> = ({ user }) => {
  const [firestoreCompanies, setFirestoreCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [insight, setInsight] = useState<GeminiCompanyOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [onlyEligible, setOnlyEligible] = useState(false);

  const [newCompany, setNewCompany] = useState({
    companyName: '',
    minCGPA: 7.0,
    roles: '',
    package: '',
    branches: [] as string[],
    experience: ''
  });

  const loadCompanies = async () => {
    setFetching(true);
    try {
      // Attempt read from Firebase. If rules allow public read, Guest users will see cloud data.
      const q = query(collection(firebaseDb, "companies"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetched: Company[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Company);
      });

      if (fetched.length === 0) {
        setFirestoreCompanies(MOCK_COMPANIES);
      } else {
        setFirestoreCompanies(fetched);
      }
    } catch (err: any) {
      console.warn("Restricted Firestore read. Fallback to Mock Intelligence.");
      setFirestoreCompanies(MOCK_COMPANIES);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const companies = useMemo(() => {
    let list = [...firestoreCompanies];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => 
        (c.companyName?.toLowerCase() || '').includes(s) || 
        (c.roles || []).some(r => r.toLowerCase().includes(s)) ||
        (c.branches || []).some(b => b.toLowerCase().includes(s))
      );
    }
    if (onlyEligible) {
      list = list.filter(c => (c.minCGPA || 0) <= (user.cgpa || 0) && (c.branches || []).includes(user.branch));
    }
    return list;
  }, [firestoreCompanies, search, onlyEligible, user.cgpa, user.branch]);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const companyData = {
      companyName: newCompany.companyName,
      minCGPA: newCompany.minCGPA,
      roles: newCompany.roles.split(',').map(s => s.trim()).filter(Boolean),
      package: newCompany.package,
      branches: newCompany.branches,
      logo: '',
      createdAt: Date.now(),
      comments: newCompany.experience ? [{ 
        userName: user.displayName || 'Anonymous', 
        text: newCompany.experience, 
        timestamp: Date.now() 
      }] : []
    };

    // GUEST BEHAVIOR: Do not write to cloud. Just update the local session state.
    if (user.uid.startsWith('guest-')) {
      const localOnlyCompany = { id: `local-${Date.now()}`, ...companyData } as Company;
      setFirestoreCompanies(prev => [localOnlyCompany, ...prev]);
      setShowAddModal(false);
      setNewCompany({ companyName: '', minCGPA: 7.0, roles: '', package: '', branches: [], experience: '' });
      setLoading(false);
      console.info("Entry added locally for Guest Session.");
      return;
    }

    try {
      const docRef = await addDoc(collection(firebaseDb, "companies"), companyData);
      const savedCompany = { id: docRef.id, ...companyData } as Company;
      setFirestoreCompanies(prev => [savedCompany, ...prev]);
      setShowAddModal(false);
      setNewCompany({ companyName: '', minCGPA: 7.0, roles: '', package: '', branches: [], experience: '' });
    } catch (err: any) {
      console.error("Cloud Save Permission Error:", err);
      alert("Permission denied. Only Email verified students can publish to cloud.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInsight = async (company: Company) => {
    setLoading(true);
    setSelectedCompany(company);
    try {
      const data = await getCompanyOverview(company.companyName, user.branch);
      setInsight(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBranch = (b: string) => {
    setNewCompany(prev => ({
      ...prev,
      branches: prev.branches.includes(b) 
        ? prev.branches.filter(item => item !== b) 
        : [...prev.branches, b]
    }));
  };

  const isGuest = user.uid.startsWith('guest-');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h2 className="text-3xl font-extrabold flex items-center gap-3">
          <span className={`p-2 rounded-lg shadow-lg ${isGuest ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            <i className="fas fa-book-open text-white"></i>
          </span>
          The Ledger
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-xl">
           <div className="relative flex-1">
             <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
             <input type="text" placeholder="Search campus intel..." className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
               value={search} onChange={e => setSearch(e.target.value)} />
           </div>
           <button 
             onClick={() => setOnlyEligible(!onlyEligible)} 
             className={`px-6 py-3 rounded-2xl border transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest ${onlyEligible ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
             Eligible Only
           </button>
        </div>
      </div>

      {fetching ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Scanning Network...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
          {companies.map((company) => (
            <div key={company.id} className="glass rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black ${isGuest ? 'text-emerald-500' : 'text-blue-500'}`}>
                    {company.companyName?.charAt(0) || '?'}
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-black text-lg">{company.package || 'N/A'}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Est. Package</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black mb-1">{company.companyName}</h3>
                <div className="flex items-center gap-2 mb-6">
                   <span className={`text-[10px] font-black px-2 py-0.5 rounded ${(company.minCGPA || 0) <= user.cgpa ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                     MIN {company.minCGPA || 0} CGPA
                   </span>
                   <div className="h-1 w-1 rounded-full bg-slate-700" />
                   <span className="text-[10px] text-slate-500 font-bold uppercase">{company.roles?.[0]}</span>
                </div>

                <div className="mb-8 space-y-2">
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Branches</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(company.branches || []).map(b => (
                      <span key={b} className={`px-2 py-1 rounded text-[9px] font-bold ${b === user.branch ? (isGuest ? 'bg-emerald-600' : 'bg-blue-600') + ' text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <button onClick={() => fetchInsight(company)} className={`w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2`}>
                  <i className="fas fa-sparkles"></i> Insights
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowAddModal(true)} className={`fixed bottom-28 right-8 w-16 h-16 ${isGuest ? 'bg-emerald-600' : 'bg-blue-600'} rounded-full flex items-center justify-center text-white text-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all z-50`}>
        <i className="fas fa-plus"></i>
      </button>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            <h2 className="text-3xl font-black mb-2">New Entry</h2>
            <p className="text-slate-500 text-sm mb-8">{isGuest ? "Simulation: Add to your local session." : "Publish intel to the campus network."}</p>
            
            <form onSubmit={handleAddCompany} className="space-y-6">
              <input required placeholder="Company Name" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500" value={newCompany.companyName} onChange={e => setNewCompany({...newCompany, companyName: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="0.1" placeholder="Min CGPA" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none" value={newCompany.minCGPA} onChange={e => setNewCompany({...newCompany, minCGPA: parseFloat(e.target.value)})} />
                <input required placeholder="Package (LPA)" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none" value={newCompany.package} onChange={e => setNewCompany({...newCompany, package: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Target Branches</label>
                <div className="flex flex-wrap gap-2">
                  {BRANCHES.map(b => (
                    <button type="button" key={b} onClick={() => toggleBranch(b)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${newCompany.branches.includes(b) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <textarea placeholder="Tell us about the process..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 h-32 outline-none" value={newCompany.experience} onChange={e => setNewCompany({...newCompany, experience: e.target.value})} />
              <button type="submit" disabled={loading} className={`w-full py-5 ${isGuest ? 'bg-emerald-600' : 'bg-blue-600'} text-white font-black rounded-2xl uppercase tracking-widest text-sm`}>
                {loading ? 'Processing...' : (isGuest ? 'Add to Local Ledger' : 'Publish to Cloud')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Selected Company Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] p-8 shadow-2xl relative">
            <button onClick={() => {setSelectedCompany(null); setInsight(null);}} className="absolute top-8 right-8 text-slate-400 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            <h2 className="text-3xl font-black mb-8">{selectedCompany.companyName}</h2>
            
            {loading && !insight ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">Generating IQ Report...</p>
              </div>
            ) : insight && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="bg-slate-800/40 p-8 rounded-[24px] border border-slate-700/50">
                    <h4 className="text-blue-400 font-black uppercase text-[10px] tracking-widest mb-4">Gemini Insight</h4>
                    <p className="text-sm italic text-slate-300 leading-relaxed">"{insight.hiringTrends}"</p>
                    <div className="grid grid-cols-2 gap-8 mt-8">
                       <div className="space-y-2">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stages</h5>
                          <ul className="space-y-1 text-xs text-slate-400">
                            {insight.stages.map((s, i) => <li key={i}>{i+1}. {s}</li>)}
                          </ul>
                       </div>
                       <div className="space-y-2">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prep Topics</h5>
                          <div className="flex flex-wrap gap-2">
                            {insight.mustKnowTopics.map(t => <span key={t} className="bg-blue-500/10 text-blue-300 px-2 py-1 rounded text-[10px] font-bold">{t}</span>)}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
