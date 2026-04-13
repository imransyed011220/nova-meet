/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

const executeWithRetry = async (operation: () => Promise<any>, retries = 1, delay = 60000): Promise<any> => {
  try {
    return await operation();
  } catch (error: any) {
    if (error?.status === 429 && retries > 0) {
      console.warn(`Quota exceeded (429). Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      return executeWithRetry(operation, retries - 1, delay);
    }
    throw error;
  }
};

export const geminiService = {
  processAudio: async (audioBlob: Blob, apiKey: string) => {
    const ai = new GoogleGenAI({ apiKey });

    // Convert blob to base64
    const base64Audio = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(audioBlob);
    });

    const prompt = `
      You are a professional meeting assistant. 
      Analyze the provided audio and perform a complete synthesis in ONE pass.
      
      Requirements:
      1. Transcribe the audio accurately.
      2. Summary: Provide a concise executive summary.
      3. Action Items: List tasks with assignee and suggested due date.
      4. Study Cards: Create Q&A cards to help learn from the session.
      5. Extracted Questions: Find all explicit/implicit questions asked.
      6. AI Answers: Provide the best possible answer for each extracted question based on audio content.
      7. Key Decisions: List all binding decisions made.
      8. Themes: Identify primary recurring topics.
      9. Title: Suggest a professional meeting title.
      10. Important Points: List critical takeaways.
      11. Risk Analysis: Identify risky or unclear decisions (e.g. deploying without testing, no timeline given, budget unclear). Rate severity as low/medium/high.
      12. Unanswered Questions: Detect questions asked during the meeting that were NOT answered.
      13. Responsibility Gaps: Detect tasks mentioned without a clear owner assigned.
      14. Conflict Detection: Find contradictions within the meeting (e.g. someone says "deadline Friday" then later "need another week").
      15. Meeting Efficiency: Score the meeting 0-100 based on how productive it was. Count decisions, action items, and unclear points.
      
      Format the response as JSON only:
      {
        "transcript": "...",
        "summary": "...",
        "actionItems": [{"text": "...", "assignee": "...", "dueDate": "..."}],
        "studyCards": [{"question": "...", "answer": "..."}],
        "extractedQuestions": ["..."],
        "answers": ["..."],
        "keyDecisions": ["..."],
        "themes": ["..."],
        "title": "...",
        "importantPoints": ["..."],
        "speakerBreakdown": [{"speaker": "...", "percentage": 0, "role": "Lead/Contributor/Observer", "topics": ["..."]}],
        "participants": ["Speaker 1", "Speaker 2"],
        "analysis": {
          "sentiment": "...",
          "productivity": "...",
          "decisions": ["..."],
          "risks": ["..."]
        },
        "health_score": { "score": 85, "label": "Good", "reasons": [] },
        "detected_language": "English",
        "talk_time": [{"speaker": "...", "percentage": 0}],
        "riskAnalysis": [{"text": "...", "reason": "...", "severity": "low|medium|high"}],
        "unansweredQuestions": [{"question": "...", "context": "..."}],
        "responsibilityGaps": [{"task": "...", "reason": "No owner assigned"}],
        "conflicts": [{"earlier": "...", "later": "...", "explanation": "..."}],
        "meetingEfficiency": {"score": 0, "decisionsCount": 0, "actionItemsCount": 0, "unclearPoints": 0, "productivityLevel": "Low|Medium|High"}
      }
    `;

    return executeWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: audioBlob.type,
                  data: base64Audio
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("Invalid AI response format");
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response format");
      
      return JSON.parse(jsonMatch[0]);
    });
  },

  transcribeOnly: async (audioBlob: Blob, apiKey: string) => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const mimeType = audioBlob.type || 'audio/webm';

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + (apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio
              }
            },
            {
              text: 'Please transcribe this audio file exactly word for word. Only return the transcription text, nothing else. Do not summarize or change the content.'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Transcription failed');
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  processTranscript: async (transcript: string, apiKey: string) => {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a professional meeting assistant. 
      Analyze the provided meeting transcript and perform a complete synthesis in ONE pass.
      
      Requirements:
      1. Summary: Provide a concise executive summary.
      2. Action Items: List tasks with assignee and suggested due date.
      3. Study Cards: Create Q&A cards to help learn from the session.
      4. Extracted Questions: Find all explicit/implicit questions asked.
      5. AI Answers: Provide the best possible answer for each extracted question based on transcript.
      6. Key Decisions: List all binding decisions made.
      7. Themes: Identify primary recurring topics.
      8. Title: Suggest a professional meeting title.
      9. Important Points: List critical takeaways not covered by items above.
      10. Risk Analysis: Identify risky or unclear decisions (e.g. deploying without testing, no timeline given, budget unclear). Rate severity as low/medium/high.
      11. Unanswered Questions: Detect questions asked during the meeting that were NOT answered.
      12. Responsibility Gaps: Detect tasks mentioned without a clear owner assigned.
      13. Conflict Detection: Find contradictions within the meeting (e.g. someone says "deadline Friday" then later "need another week").
      14. Meeting Efficiency: Score the meeting 0-100 based on how productive it was. Count decisions, action items, and unclear points.
      
      Format the response as JSON only:
      {
        "summary": "...",
        "actionItems": [{"text": "...", "assignee": "...", "dueDate": "..."}],
        "studyCards": [{"question": "...", "answer": "..."}],
        "extractedQuestions": ["..."],
        "answers": ["..."],
        "keyDecisions": ["..."],
        "themes": ["..."],
        "title": "...",
        "importantPoints": ["..."],
        "speakerBreakdown": [{"speaker": "...", "percentage": 0, "role": "Lead/Contributor/Observer", "topics": ["..."]}],
        "participants": ["Speaker 1", "Speaker 2"],
        "analysis": {
          "sentiment": "...",
          "productivity": "...",
          "decisions": ["..."],
          "risks": ["..."]
        },
        "health_score": { "score": 85, "label": "Good", "reasons": [] },
        "detected_language": "English",
        "talk_time": [{"speaker": "...", "percentage": 0}],
        "riskAnalysis": [{"text": "...", "reason": "...", "severity": "low|medium|high"}],
        "unansweredQuestions": [{"question": "...", "context": "..."}],
        "responsibilityGaps": [{"task": "...", "reason": "No owner assigned"}],
        "conflicts": [{"earlier": "...", "later": "...", "explanation": "..."}],
        "meetingEfficiency": {"score": 0, "decisionsCount": 0, "actionItemsCount": 0, "unclearPoints": 0, "productivityLevel": "Low|Medium|High"}
      }
    `;

    return executeWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt + "\n\nTranscript:\n" + transcript }] }],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text;
      if (!text) throw new Error("Invalid AI response format");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response format");
      return JSON.parse(jsonMatch[0]);
    });
  },

  askAssistant: async (context: string, question: string, apiKey: string) => {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a helpful meeting assistant. 
      Use the following meeting context to answer the user's question.
      Context: ${context}
      
      Question: ${question}
      
      Provide a concise, professional, and helpful answer.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text || "I couldn't generate an answer. Please try again.";
  },
  

};
