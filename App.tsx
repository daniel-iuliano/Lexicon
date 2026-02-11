
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRandomWord, fetchDecoyWords } from './services/geminiService';
import { WordData, Stats, Language } from './types';
import { FallingLetters } from './components/FallingLetters';
import { StatsDashboard } from './components/StatsDashboard';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const TRANSLATIONS = {
  English: {
    title: "P-LEXICON",
    subtitle: "Discover the hidden beauty of words.",
    startBtn: "Discover Word",
    loading: "Exploring...",
    letterLabel: "Letter",
    langLabel: "Lang",
    stats: { total: "Total", unique: "Unique", frequent: "Top Word" },
    placeholder: "Discover the Power of {letter}"
  },
  Spanish: {
    title: "P-LÉXICO",
    subtitle: "Descubre la belleza oculta de las palabras.",
    startBtn: "Descubrir Palabra",
    loading: "Explorando...",
    letterLabel: "Letra",
    langLabel: "Idioma",
    stats: { total: "Total", unique: "Únicas", frequent: "Más Usada" },
    placeholder: "Descubre el Poder de la {letter}"
  },
  Italian: {
    title: "P-LESSICO",
    subtitle: "Scopri la bellezza nascosta delle parole.",
    startBtn: "Scopri Parola",
    loading: "Esplorando...",
    letterLabel: "Lettera",
    langLabel: "Lingua",
    stats: { total: "Totale", unique: "Uniche", frequent: "Più Usata" },
    placeholder: "Scopri il Potere della {letter}"
  }
};

const App: React.FC = () => {
  const [selectedLetter, setSelectedLetter] = useState('P');
  const [language, setLanguage] = useState<Language>('Spanish');
  const [currentWord, setCurrentWord] = useState<WordData | null>(null);
  const [showDefinition, setShowDefinition] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [decoys, setDecoys] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalGenerated: 0,
    uniqueCount: 0,
    wordFrequency: {}
  });

  const t = TRANSLATIONS[language];

  // Load stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('p_lexicon_stats_v2');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // Save stats to localStorage
  const updateStats = useCallback((word: string) => {
    setStats(prev => {
      const newFrequency = { ...prev.wordFrequency };
      newFrequency[word] = (newFrequency[word] || 0) + 1;
      
      const newStats = {
        totalGenerated: prev.totalGenerated + 1,
        uniqueCount: Object.keys(newFrequency).length,
        wordFrequency: newFrequency
      };
      
      localStorage.setItem('p_lexicon_stats_v2', JSON.stringify(newStats));
      return newStats;
    });
  }, []);

  const handleDiscover = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setIsAnimating(true);
    setCurrentWord(null);
    setShowDefinition(false);

    try {
      const [wordResult, decoyList] = await Promise.all([
        fetchRandomWord(selectedLetter, language),
        fetchDecoyWords(selectedLetter, 12, language)
      ]);

      setDecoys(decoyList);

      // Animation phase
      setTimeout(() => {
        setCurrentWord(wordResult);
        updateStats(wordResult.word);
        setIsAnimating(false);
        setIsLoading(false);
        
        // Cinematic Delay for Definition
        setTimeout(() => {
          setShowDefinition(true);
        }, 2000);

      }, 2000);

    } catch (error) {
      console.error("Discovery failed", error);
      setIsAnimating(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-4 py-8 text-white overflow-hidden bg-slate-950">
      <FallingLetters isActive={isAnimating} decoys={decoys} />

      {/* Modern Compact Header */}
      <header className="w-full flex items-center justify-between z-10 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-sm">
            {selectedLetter}
          </div>
          <span className="font-extrabold text-lg tracking-tighter">{t.title}</span>
        </div>

        <div className="flex gap-2">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1">
            <span className="text-[10px] font-bold opacity-30 uppercase">{t.langLabel}</span>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border-none outline-none font-bold text-xs cursor-pointer text-cyan-400"
            >
              <option value="English">EN</option>
              <option value="Spanish">ES</option>
              <option value="Italian">IT</option>
            </select>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1">
            <span className="text-[10px] font-bold opacity-30 uppercase">{t.letterLabel}</span>
            <select 
              value={selectedLetter}
              onChange={(e) => setSelectedLetter(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs cursor-pointer"
            >
              {ALPHABET.map(l => <option key={l} value={l} className="bg-slate-900">{l}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Centered Word Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative">
        <AnimatePresence mode="wait">
          {!currentWord && !isAnimating && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <h2 className="text-3xl font-black mb-2 leading-tight">
                {t.placeholder.replace('{letter}', selectedLetter)}
              </h2>
              <p className="text-white/40 text-sm">{t.subtitle}</p>
            </motion.div>
          )}

          {currentWord && (
            <motion.div
              key="word-display"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center"
            >
              <motion.div 
                className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
                layoutId="wordCard"
              >
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-widest mb-4 border border-cyan-500/20"
                >
                  {currentWord.partOfSpeech}
                </motion.span>
                
                <h2 className="text-4xl font-black tracking-tighter text-white mb-2">
                  {currentWord.word}
                </h2>

                <AnimatePresence>
                  {showDefinition && (
                    <motion.div
                      initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="mt-6 pt-6 border-t border-white/5 w-full"
                    >
                      <p className="text-base text-white/70 leading-relaxed italic font-medium">
                        "{currentWord.definition}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <div className="mt-8 relative h-20 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDiscover}
            disabled={isLoading}
            className={`
              relative z-10 px-8 py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all
              ${isLoading 
                ? 'bg-white/10 text-white/20' 
                : 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.25)]'
              }
            `}
          >
            {isLoading ? t.loading : t.startBtn}
          </motion.button>
          
          {!isLoading && (
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute w-full h-full border border-white/10 rounded-2xl pointer-events-none"
            />
          )}
        </div>
      </main>

      {/* Compact Stats */}
      <footer className="w-full flex flex-col items-center">
        <StatsDashboard stats={stats} labels={t.stats} />
      </footer>
    </div>
  );
};

export default App;
