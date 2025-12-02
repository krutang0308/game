import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestions = async (): Promise<QuizQuestion[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 multiple-choice questions suitable for a Thai 4th-grade student about the "Sufficiency Economy Philosophy" (เศรษฐกิจพอเพียง). 
      Focus on concepts like moderation (ความพอประมาณ), reasonableness (ความมีเหตุผล), self-immunity (ภูมิคุ้มกัน), and agriculture (เกษตรทฤษฎีใหม่).
      Language MUST be Thai.
      Ensure the answers are short (1-3 words) so they fit in falling game objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The question text in Thai",
              },
              answers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 3 short answer options in Thai",
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "The index (0-2) of the correct answer",
              },
            },
            required: ["question", "answers", "correctAnswerIndex"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data as QuizQuestion[];
  } catch (error) {
    console.error("Failed to generate questions:", error);
    // Fallback questions in case of API error
    return [
      {
        question: "หลักปรัชญาเศรษฐกิจพอเพียงประกอบด้วยกี่ห่วง?",
        answers: ["2 ห่วง", "3 ห่วง", "4 ห่วง"],
        correctAnswerIndex: 1
      },
      {
        question: "การปลูกพืชหลายชนิดในพื้นที่เดียวกันเรียกว่าอะไร?",
        answers: ["เกษตรผสมผสาน", "เกษตรเชิงเดี่ยว", "ทำไร่เลื่อนลอย"],
        correctAnswerIndex: 0
      },
      {
        question: "ข้อใดคือความพอประมาณ?",
        answers: ["ใช้จ่ายเกินตัว", "ไม่โลภ", "กู้เงินมาเที่ยว"],
        correctAnswerIndex: 1
      }
    ];
  }
};
