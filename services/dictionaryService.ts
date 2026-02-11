
import { WordData, Language } from "../types";

/**
 * Robust Dictionary Service using specialized public APIs per language.
 */

const WIKTIONARY_LANG_MAP: Record<Language, string> = {
  English: 'en',
  Spanish: 'es',
  Italian: 'it'
};

/**
 * ENGLISH: Uses Datamuse for word lists and Free Dictionary API for definitions.
 */
async function fetchEnglish(letter: string): Promise<WordData> {
  const letterLower = letter.toLowerCase();
  
  // 1. Fetch word list from Datamuse (Reliable, Keyless, Letter-filtered)
  const listUrl = `https://api.datamuse.com/words?sp=${letterLower}*&max=100&md=p`;
  const listResponse = await fetch(listUrl);
  const words = await listResponse.json();
  
  if (!words || words.length === 0) throw new Error("No English words found");
  
  // Pick a random word that is a common noun/verb (has parts of speech)
  const filtered = words.filter((w: any) => w.word.length > 3 && w.tags);
  const selected = filtered[Math.floor(Math.random() * filtered.length)] || words[0];
  const word = selected.word;

  try {
    // 2. Fetch definition from Free Dictionary API
    const defUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    const defResponse = await fetch(defUrl);
    if (!defResponse.ok) throw new Error("Def not found");
    const defData = await defResponse.json();
    const entry = defData[0];
    const meaning = entry.meanings[0];

    return {
      word: word.charAt(0).toUpperCase() + word.slice(1),
      definition: meaning.definitions[0].definition,
      partOfSpeech: meaning.partOfSpeech || "Word"
    };
  } catch {
    return {
      word: word.charAt(0).toUpperCase() + word.slice(1),
      definition: "An important term utilized within the English vocabulary to describe specific concepts.",
      partOfSpeech: "Noun"
    };
  }
}

/**
 * SPANISH / ITALIAN: Uses the MediaWiki Action API (w/api.php) which is more stable for CORS.
 */
async function fetchMediaWiki(letter: string, language: Language): Promise<WordData> {
  const langCode = WIKTIONARY_LANG_MAP[language];
  const prefix = letter.toLowerCase();

  // 1. Get word list via OpenSearch
  const searchUrl = `https://${langCode}.wiktionary.org/w/api.php?action=opensearch&search=${prefix}&limit=50&format=json&origin=*`;
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();
  
  const words = searchData[1] || [];
  const validWords = words.filter((w: string) => w.length > 3 && !w.includes(':') && !w.includes(' '));
  
  if (validWords.length === 0) throw new Error(`No ${language} words found`);
  
  const word = validWords[Math.floor(Math.random() * validWords.length)];

  // 2. Get definition via Query/Extracts
  const queryUrl = `https://${langCode}.wiktionary.org/w/api.php?action=query&prop=extracts|description&exintro=1&explaintext=1&titles=${encodeURIComponent(word)}&format=json&origin=*`;
  const queryResponse = await fetch(queryUrl);
  const queryData = await queryResponse.json();
  
  const pageId = Object.keys(queryData.query.pages)[0];
  const pageData = queryData.query.pages[pageId];

  let rawExtract = pageData.extract || "";
  const pos = pageData.description || (language === 'Spanish' ? "Palabra" : "Parola");

  let definition = "";

  if (!rawExtract || rawExtract.length < 10) {
    definition = language === 'Spanish' 
      ? `Término esencial en la lengua española que comienza con la letra ${letter.toUpperCase()}.`
      : `Termine fondamentale nella lingua italiana che inizia con la lettera ${letter.toUpperCase()}.`;
  } else {
    // MediaWiki extracts for Wiktionary often follow a pattern:
    // "Word\n(Category)\nEtymology/Pronunciation\n1 Definition one.\n2 Definition two."
    const lines = rawExtract.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Improved regex to catch "1.", "1)", "1 " at the start of a line
    const numberedDefRegex = /^[1-9][\.\)\s]\s+/;
    
    // Look for the first line that matches a numbered definition
    const firstDefLine = lines.find(l => numberedDefRegex.test(l));
    
    if (firstDefLine) {
      // Remove the leading number and punctuation
      definition = firstDefLine.replace(numberedDefRegex, '');
    } else {
      // Fallback: Filter out lines that are just the word, headers, or parenthetical categories
      const substantialLine = lines.find(l => {
        const isWordItself = l.toLowerCase() === word.toLowerCase();
        const isHeader = l.startsWith('==') || l.endsWith('==');
        const isCategoryOnly = l.startsWith('(') && l.endsWith(')') && l.length < 30;
        const isTooShort = l.length < 15;
        return !isWordItself && !isHeader && !isCategoryOnly && !isTooShort;
      });
      
      definition = substantialLine || lines[0];
    }

    // Advanced cleaning: remove parenthetical notes at start (e.g., "(Transitive) ...")
    definition = definition.replace(/^\([^\)]+\)\s*/, '').trim();
    
    // Remove common Wiktionary artifacts
    definition = definition.replace(/^[:\-\s\.]/, '').trim();
    
    // Graceful truncation with word-boundary awareness
    const MAX_LENGTH = 190;
    if (definition.length > MAX_LENGTH) {
      const truncated = definition.substring(0, MAX_LENGTH);
      // Try to truncate at the last space within the limit
      const lastSpace = truncated.lastIndexOf(' ');
      definition = (lastSpace > 150 ? truncated.substring(0, lastSpace) : truncated) + "...";
    }

    // Final polish: Ensure sentence casing and punctuation
    if (definition.length > 0) {
      definition = definition.charAt(0).toUpperCase() + definition.slice(1);
      if (!definition.endsWith('.') && !definition.endsWith('!') && !definition.endsWith('?')) {
        definition += ".";
      }
    }
  }

  return {
    word: word.charAt(0).toUpperCase() + word.slice(1),
    definition: definition,
    partOfSpeech: pos
  };
}

export async function fetchRandomWord(letter: string, language: Language): Promise<WordData> {
  try {
    if (language === 'English') {
      return await fetchEnglish(letter);
    } else {
      return await fetchMediaWiki(letter, language);
    }
  } catch (error) {
    console.error(`Error fetching ${language} word:`, error);
    // Generic robust fallbacks
    const fallbacks: Record<Language, WordData> = {
      English: { word: letter + "henomenal", definition: "Something that is very remarkable, extraordinary, or exceptional in nature.", partOfSpeech: "Adjective" },
      Spanish: { word: letter + "oderoso", definition: "Dícese de aquello que posee una gran capacidad, influencia o fuerza superior.", partOfSpeech: "Adjetivo" },
      Italian: { word: letter + "rezioso", definition: "Qualcosa che possiede un grande valore intrinseco, pregio o rarità.", partOfSpeech: "Aggettivo" }
    };
    return fallbacks[language];
  }
}

export async function fetchDecoyWords(letter: string, count: number, language: Language): Promise<string[]> {
  try {
    if (language === 'English') {
      const url = `https://api.datamuse.com/words?sp=${letter.toLowerCase()}*&max=${count}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.map((d: any) => d.word);
    } else {
      const langCode = WIKTIONARY_LANG_MAP[language];
      const url = `https://${langCode}.wiktionary.org/w/api.php?action=opensearch&search=${letter.toLowerCase()}&limit=${count}&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      return data[1] || [];
    }
  } catch {
    return Array(count).fill(letter.toUpperCase());
  }
}
