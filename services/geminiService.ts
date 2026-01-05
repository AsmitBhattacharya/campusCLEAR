
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { PrepLevel, UserProfile } from "../types";

export const getCompanyOverview = async (companyName: string, branch: string) => {
  // Replace: const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide a concise placement intelligence overview for ${companyName} for a student in ${branch}.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          stages: { type: Type.ARRAY, items: { type: Type.STRING } },
          mustKnowTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          hiringTrends: { type: Type.STRING }
        },
        required: ["stages", "mustKnowTopics", "hiringTrends"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const reviewResume = async (resumeText: string) => {
// Replace: const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Critique this resume text: \n\n${resumeText}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          good: { type: Type.ARRAY, items: { type: Type.STRING } },
          bad: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        },
        required: ["score", "good", "bad", "summary"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateInterviewQuestion = async (
  context: { user: UserProfile, history: string[], resume: string, difficulty: 'Easy' | 'Medium' | 'Hard' }
) => {
  // Replace: const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const prompt = `Based on the user's resume and current difficulty (${context.difficulty}), ask the next interview question. This is question #${context.history.length + 1}. Focus on technical and behavioral alignment with their background.
  
  User Resume: ${context.resume}
  Current History: ${context.history.join('\n')}
  Prep Level: ${context.user.prepLevel}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text;
};

export const evaluateInterview = async (history: string[], snapshotBase64?: string) => {
 // Replace: const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const parts: any[] = [
    { text: `Evaluate this interview transcript and provide feedback on technical accuracy, communication, and confidence. Score the candidate out of 10. Also, analyze the provided image frame for posture and professional technique if available.\n\nTranscript:\n${history.join('\n')}` }
  ];

  if (snapshotBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: snapshotBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + "\nWhen evaluating the image, look for eye contact, sitting posture, and professional attire. The overallScore must be an integer between 1 and 10.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          technicalAccuracy: { type: Type.STRING },
          communicationStyle: { type: Type.STRING },
          postureAndTechnique: { type: Type.STRING },
          confidence: { type: Type.STRING },
          overallScore: { type: Type.NUMBER }
        },
        required: ["technicalAccuracy", "communicationStyle", "postureAndTechnique", "confidence", "overallScore"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateQuiz = async (resumeText: string) => {
  // Replace: const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 10 technical MCQs based on this resume: ${resumeText}. Focus strictly on technical skills and projects mentioned. Ensure high relevance.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};
