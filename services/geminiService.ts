
import { GoogleGenAI, Type } from "@google/genai";
import { WordData, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchRandomWord(letter: string, language: Language): Promise<WordData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate one interesting, valid word that starts with the letter '${letter}'. 
               The language must be ${language}.
               Provide its definition and part of speech in ${language}. 
               Avoid extremely obscure words; prefer words a well-read person would know.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The word itself" },
          definition: { type: Type.STRING, description: "A clear dictionary definition in the requested language" },
          partOfSpeech: { type: Type.STRING, description: "Noun, verb, etc. in the requested language" },
        },
        required: ["word", "definition", "partOfSpeech"],
      },
    },
  });

  try {
    const data = JSON.parse(response.text.trim());
    return data;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return {
      word: letter.toUpperCase() + (language === 'Spanish' ? "alabra" : "ord"),
      definition: language === 'Spanish' ? "Una unidad de lenguaje." : "A unit of language.",
      partOfSpeech: language === 'Spanish' ? "Sustantivo" : "Noun"
    };
  }
}

export async function fetchDecoyWords(letter: string, count: number, language: Language): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide a list of ${count} common words in ${language} that start with the letter '${letter}'. Return as a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
    },
  });

  try {
    return JSON.parse(response.text.trim());
  } catch {
    return Array(count).fill(letter.toUpperCase());
  }
}
