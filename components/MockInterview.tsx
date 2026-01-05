
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { evaluateInterview } from '../services/geminiService';
import { InterviewFeedback, UserProfile } from '../types';

interface Props {
  user: UserProfile;
  resumeText: string;
}

// Audio Utils
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const MockInterview: React.FC<Props> = ({ user, resumeText }) => {
  const [stage, setStage] = useState<'IDLE' | 'INTERVIEWING' | 'FEEDBACK'>('IDLE');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  // Audio/Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptRef = useRef<string[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  useEffect(() => {
    if (stage === 'INTERVIEWING' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [stage]);

  const stopSession = () => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close?.();
      } catch (e) {}
      sessionRef.current = null;
    }
    
    if (audioContextInRef.current) {
      if (audioContextInRef.current.state !== 'closed') {
        audioContextInRef.current.close().catch(() => {});
      }
      audioContextInRef.current = null;
    }
    
    if (audioContextOutRef.current) {
      if (audioContextOutRef.current.state !== 'closed') {
        audioContextOutRef.current.close().catch(() => {});
      }
      audioContextOutRef.current = null;
    }

    audioSourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    audioSourcesRef.current.clear();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if ((sessionRef as any).currentInterval) {
      clearInterval((sessionRef as any).currentInterval);
      (sessionRef as any).currentInterval = null;
    }
  };

  const startInterview = async () => {
    if (!resumeText.trim()) {
      alert("Please upload your resume in the 'Resume Review' section first!");
      return;
    }

    setLoading(true);
    transcriptRef.current = [];
    setTranscript([]);

    try {
      // Ensure API key is present before connecting
      if (!process.env.API_KEY) {
        throw new Error("API Key not found in environment.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextInRef.current = inputCtx;
      audioContextOutRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;

      setStage('INTERVIEWING');

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are a professional mock interviewer for CampusCLEAR. 
          Use the following resume context: ${resumeText}.
          Difficulty Level: ${difficulty}.
          Candidate Name: ${user.displayName}.
          Candidate Branch: ${user.branch}.
          
          Guidelines:
          1. Ask 5-6 questions one-by-one.
          2. Periodically comment on the candidate's posture and technique based on the video frames.
          3. Be encouraging but rigorous.
          4. When the user seems finished or clicks end, wait for them to finish.`,
        },
        callbacks: {
          onopen: () => {
            setLoading(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                if (session) session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            const interval = setInterval(() => {
              if (videoRef.current && canvasRef.current && sessionRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  canvasRef.current.width = 320; 
                  canvasRef.current.height = 240;
                  ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                  const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionPromise.then(session => {
                    if (session) session.sendRealtimeInput({ 
                      media: { data: base64, mimeType: 'image/jpeg' } 
                    });
                  });
                }
              }
            }, 2000); 
            (sessionRef as any).currentInterval = interval;
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputCtx && outputCtx.state !== 'closed') {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
              source.onended = () => audioSourcesRef.current.delete(source);
            }

            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              transcriptRef.current.push(`User: ${text}`);
              setTranscript([...transcriptRef.current]);
            }
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              transcriptRef.current.push(`AI: ${text}`);
              setTranscript([...transcriptRef.current]);
            }

            if (msg.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Live session error", e),
          onclose: () => console.log("Live session closed"),
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      alert("Failed to start session: " + err.message);
      setLoading(false);
      setStage('IDLE');
    }
  };

  const handleEndInterview = async () => {
    setLoading(true);
    const finalHistory = [...transcriptRef.current];
    
    let lastFrame = "";
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        lastFrame = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      }
    }

    stopSession();

    try {
      const evalData = await evaluateInterview(finalHistory, lastFrame);
      setFeedback(evalData);
      setStage('FEEDBACK');
    } catch (err) {
      console.error(err);
      alert("Feedback generation failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'IDLE') {
    return (
      <div className="glass rounded-3xl p-8 max-w-2xl mx-auto space-y-6 text-center">
        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-microphone-lines text-blue-500 text-2xl"></i>
        </div>
        <h3 className="text-2xl font-black">Live AI Voice Interview</h3>
        <p className="text-slate-400 text-sm">Speak naturally. Gemini will ask questions, listen to your answers, and watch your posture in real-time.</p>
        
        {!resumeText && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <i className="fas fa-exclamation-triangle"></i> No Resume Uploaded
          </div>
        )}

        <div className="space-y-6 pt-4 text-left">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={`py-3 rounded-xl border transition-all font-black text-xs ${difficulty === d ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{d}</button>
              ))}
            </div>
          </div>
          <button 
            onClick={startInterview} 
            disabled={!resumeText || loading}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm"
          >
            {loading ? 'Initializing Assistant...' : 'Start Voice Session'}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'FEEDBACK') {
    return (
      <div className="glass rounded-[32px] p-8 max-w-2xl mx-auto space-y-8 animate-in zoom-in duration-300">
        <div className="text-center">
          <div className="inline-block p-4 bg-emerald-500/10 rounded-full mb-4"><i className="fas fa-award text-4xl text-emerald-500"></i></div>
          <h3 className="text-3xl font-black">Performance: {feedback?.overallScore}/10</h3>
          <p className="text-slate-400 text-sm">Real-time coaching report finalized.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2">Technical Core</div>
            <div className="text-xs text-slate-300 leading-relaxed">{feedback?.technicalAccuracy}</div>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-2">Posture & Technique</div>
            <div className="text-xs text-slate-300 leading-relaxed">{feedback?.postureAndTechnique}</div>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="text-purple-400 font-black text-[10px] uppercase tracking-widest mb-2">Communication</div>
            <div className="text-xs text-slate-300 leading-relaxed">{feedback?.communicationStyle}</div>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-2">Self Confidence</div>
            <div className="text-xs text-slate-300 leading-relaxed">{feedback?.confidence}</div>
          </div>
        </div>

        <button onClick={() => {setStage('IDLE'); setTranscript([]);}} className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl">New Session</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto h-[600px]">
      <div className="lg:col-span-2 glass rounded-[32px] overflow-hidden relative bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover grayscale-[0.2]" 
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Voice Assistant Active
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
           <button 
             onClick={handleEndInterview}
             className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-full shadow-2xl transition-all flex items-center gap-3 uppercase tracking-widest text-xs"
           >
             <i className="fas fa-phone-slash"></i> End Interview
           </button>
        </div>
      </div>
      
      <div className="glass rounded-[32px] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-800/30">
          <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Live Transcription</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {transcript.map((line, i) => (
            <div key={i} className={`flex ${line.startsWith('AI:') ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[90%] p-3 rounded-2xl text-[10px] leading-relaxed ${line.startsWith('AI:') ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-blue-600/20 text-blue-300 border border-blue-500/20'}`}>
                {line.replace(/^(AI|User): /, '')}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase text-slate-500">Processing Evaluation...</p>
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-900/50 text-center">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Speak Clearly</div>
          <div className="flex items-center justify-center gap-1">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="w-1 bg-blue-500 rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 5}px`, animationDelay: `${i * 0.1}s` }} />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockInterview;
