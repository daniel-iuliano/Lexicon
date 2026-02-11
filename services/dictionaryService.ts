
import { WordData, Language } from "../types";

const LANG_MAP: Record<Language, string> = {
  English: 'en',
  Spanish: 'es',
  Italian: 'it'
};

export async function fetchRandomWord(letter: string, language: Language): Promise<WordData> {
  const langCode = LANG_MAP[language];
  const prefix = letter.toLowerCase();

  try {
    // 1. Fetch a list of words starting with the letter
    const listUrl = `https://${langCode}.wiktionary.org/w/api.php?action=query&list=allpages&apprefix=${prefix}&aplimit=100&format=json&origin=*`;
    const listResponse = await fetch(listUrl);
    const listData = await listResponse.json();
    const pages = listData.query?.allpages || [];

    if (pages.length === 0) throw new Error("No words found");

    // Pick a random word that isn't too short and likely a real word (not a fragment)
    const filteredPages = pages.filter((p: any) => p.title.length > 2);
    const targetPage = filteredPages[Math.floor(Math.random() * filteredPages.length)] || pages[0];
    const word = targetPage.title;

    // 2. Fetch the summary/definition
    const summaryUrl = `https://${langCode}.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();

    return {
      word: word.charAt(0).toUpperCase() + word.slice(1),
      definition: summaryData.extract || (language === 'Spanish' ? "Definición no encontrada." : "Definition not found."),
      partOfSpeech: summaryData.description || (language === 'Spanish' ? "Palabra" : "Word")
    };
  } catch (error) {
    console.error("Dictionary Fetch Error:", error);
    // Fallback logic
    return {
      word: letter.toUpperCase() + (language === 'Spanish' ? "alabra" : "ord"),
      definition: language === 'Spanish' ? "Unidad de la lengua que tiene significado." : "A unit of language with meaning.",
      partOfSpeech: language === 'Spanish' ? "Sustantivo" : "Noun"
    };
  }
}

export async function fetchDecoyWords(letter: string, count: number, language: Language): Promise<string[]> {
  const langCode = LANG_MAP[language];
  const prefix = letter.toLowerCase();
  
  try {
    const listUrl = `https://${langCode}.wiktionary.org/w/api.php?action=query&list=allpages&apprefix=${prefix}&aplimit=${count * 2}&format=json&origin=*`;
    const response = await fetch(listUrl);
    const data = await response.json();
    return (data.query?.allpages || []).map((p: any) => p.title).slice(0, count);
  } catch {
    return Array(count).fill(letter.toUpperCase());
  }
}
