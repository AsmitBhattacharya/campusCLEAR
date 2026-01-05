
import React, { useState, useRef } from 'react';
import { reviewResume } from '../services/geminiService';
import { ResumeCritique } from '../types';

declare const pdfjsLib: any;

interface Props {
  resumeText: string;
  setResumeText: (text: string) => void;
}

const ResumeReview: React.FC<Props> = ({ resumeText, setResumeText }) => {
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ResumeCritique | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (data: ArrayBuffer) => {
    setParsing(true);
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setResumeText(fullText);
    } catch (err) {
      console.error("PDF Parsing Error:", err);
      alert("Could not parse PDF. Try a different file or check permissions.");
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (file.type === "application/pdf") {
        await extractTextFromPDF(buffer);
      } else {
        const text = new TextDecoder().decode(buffer);
        setResumeText(text);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleReview = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    try {
      const data = await reviewResume(resumeText);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-[32px] p-8 text-center relative overflow-hidden">
        {parsing && (
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur z-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-400">Extracting PDF Data...</p>
          </div>
        )}
        
        <h3 className="text-xl font-black mb-2">Resume Intelligence</h3>
        <p className="text-slate-400 text-sm mb-8">Upload your PDF resume for deep content analysis.</p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.txt"
        />

        <div 
          onClick={triggerUpload}
          className={`border-2 border-dashed rounded-[24px] p-12 cursor-pointer transition-all hover:scale-[0.98] ${fileName ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5'}`}
        >
          {fileName ? (
            <div className="space-y-2">
              <i className="fas fa-file-pdf text-4xl text-emerald-500"></i>
              <div className="text-sm font-bold text-slate-200">{fileName}</div>
              <div className="text-[10px] text-emerald-400 uppercase font-black">Ready for Analysis</div>
            </div>
          ) : (
            <div className="space-y-2">
              <i className="fas fa-file-upload text-4xl text-slate-600"></i>
              <div className="text-sm font-bold text-slate-400">Select PDF File</div>
              <div className="text-[10px] text-slate-600 uppercase font-black">ATS Parsing enabled</div>
            </div>
          )}
        </div>

        <button
          onClick={handleReview}
          disabled={loading || !resumeText}
          className="mt-8 w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          {loading ? (
            <i className="fas fa-circle-notch animate-spin"></i>
          ) : (
            <i className="fas fa-wand-magic-sparkles"></i>
          )}
          {loading ? 'Consulting Gemini...' : 'Analyze My Background'}
        </button>
      </div>

      {result && (
        <div className="glass rounded-[32px] p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black mb-2">Profile Score</h3>
              <p className="text-slate-500 text-xs font-medium max-w-xs">Score based on content depth, formatting, and technical clarity.</p>
            </div>
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="66" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                <circle cx="72" cy="72" r="66" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={414} strokeDashoffset={414 - (414 * result.score) / 100} className="text-emerald-500 transition-all duration-1000" />
              </svg>
              <div className="absolute text-center">
                <span className="text-4xl font-black block">{result.score}</span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Score</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-circle-check"></i> Competitive Strengths
              </h4>
              <ul className="space-y-3">
                {result.good.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-xs text-slate-300">
                    <span className="text-emerald-500 mt-0.5"><i className="fas fa-check-double"></i></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-rose-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-hammer"></i> Strategic Fixes
              </h4>
              <ul className="space-y-3">
                {result.bad.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 text-xs text-slate-300">
                    <span className="text-rose-500 mt-0.5"><i className="fas fa-circle-exclamation"></i></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-blue-600/5 p-8 rounded-[24px] border border-blue-600/20">
            <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fas fa-sparkles"></i> Career Coach Insight
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed italic">"{result.summary}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeReview;
