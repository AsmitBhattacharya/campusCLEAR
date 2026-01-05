
import React, { useState, useEffect } from 'react';
import { generateQuiz } from '../services/geminiService';
import { MCQ } from '../types';

interface Props {
  resumeText: string;
}

const ResumeQuiz: React.FC<Props> = ({ resumeText }) => {
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const startQuiz = async () => {
    if (!resumeText.trim()) {
      alert("Please upload your resume in the 'Resume Review' section first!");
      return;
    }
    setLoading(true);
    try {
      const data = await generateQuiz(resumeText);
      setQuestions(data);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } catch (err) {
      console.error(err);
      alert("Error generating quiz. Gemini might be busy.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    setIsAnswered(true);
    if (idx === questions[currentIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-[32px] p-20 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-white font-black uppercase tracking-widest text-sm mb-2">Generating IQ Assessment</p>
          <p className="text-slate-500 text-xs">Customizing questions based on your unique skill set...</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="glass rounded-[32px] p-12 text-center space-y-8 animate-in zoom-in duration-300">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-3xl font-black">Assessment Final</h3>
        <div>
          <p className="text-slate-400 text-sm mb-2">Performance Score</p>
          <div className="text-5xl font-black text-white">{score} <span className="text-xl text-slate-500">/ {questions.length}</span></div>
        </div>
        
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
          <div 
            className={`h-full transition-all duration-1000 ${percentage > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
            style={{ width: `${percentage}%` }} 
          />
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-left">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Coach's Verdict</div>
          <p className="text-sm text-slate-300 italic">
            {percentage >= 80 ? "Outstanding mastery of the technical concepts in your resume. You're ready for the big stage." : 
             percentage >= 50 ? "Solid understanding, but revisit the core technical concepts mentioned in your projects." :
             "Needs focused study. Gemini suggests reviewing your core fundamentals."}
          </p>
        </div>

        <button 
          onClick={() => { setQuestions([]); }}
          className="w-full py-4 bg-blue-600 rounded-2xl font-black hover:bg-blue-500 shadow-xl transition-all uppercase tracking-widest text-xs"
        >
          Retake Assessment
        </button>
      </div>
    );
  }

  if (questions.length > 0) {
    const q = questions[currentIndex];
    return (
      <div className="glass rounded-[32px] p-10 max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span>Module {currentIndex + 1} of {questions.length}</span>
          <span className="text-blue-500">Points: {score}</span>
        </div>

        <h4 className="text-xl font-bold leading-relaxed text-white">{q.question}</h4>

        <div className="space-y-4">
          {q.options.map((opt, i) => {
            let colorClass = 'bg-slate-800/50 border-slate-700 hover:border-slate-500';
            if (isAnswered) {
              if (i === q.correctAnswer) colorClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
              else if (i === selectedAnswer) colorClass = 'bg-rose-500/20 border-rose-500 text-rose-400';
              else colorClass = 'bg-slate-800/30 border-slate-800 opacity-50';
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
                className={`w-full p-5 rounded-2xl border text-left transition-all ${colorClass} font-medium flex justify-between items-center text-sm`}
              >
                {opt}
                {isAnswered && i === q.correctAnswer && <i className="fas fa-check-circle"></i>}
                {isAnswered && i === selectedAnswer && i !== q.correctAnswer && <i className="fas fa-times-circle"></i>}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-blue-600/5 p-6 rounded-2xl text-xs text-slate-300 border border-blue-600/10 leading-relaxed">
              <span className="font-black text-blue-400 block mb-2 uppercase tracking-widest">Knowledge Nugget</span>
              {q.explanation}
            </div>
            <button
              onClick={nextQuestion}
              className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              {currentIndex === questions.length - 1 ? 'Finalize Score' : 'Continue Module'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-[32px] p-8 max-w-2xl mx-auto space-y-8 text-center">
      <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <i className="fas fa-brain text-purple-500 text-2xl"></i>
      </div>
      <h3 className="text-2xl font-black">Resume Technical Quiz</h3>
      <p className="text-slate-400 text-sm">Gemini will generate high-relevance technical questions based on the skills and projects listed in your resume.</p>
      
      {!resumeText && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <i className="fas fa-exclamation-triangle"></i> No Resume Context
        </div>
      )}

      <button
        onClick={startQuiz}
        disabled={!resumeText}
        className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm"
      >
        Initialize Assessment
      </button>
    </div>
  );
};

export default ResumeQuiz;
