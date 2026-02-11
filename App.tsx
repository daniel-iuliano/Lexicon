
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRandomWord, fetchDecoyWords } from './services/dictionaryService';
import { WordData, Stats, Language } from './types';
import { FallingLetters } from './components/FallingLetters';
import { StatsDashboard } from './components/StatsDashboard';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const TRANSLATIONS = {
  English: {
    title: "P-LEXICON",
    subtitle: "Explore refined language, mobile-first.",
    startBtn: "Start",
    loading: "Finding...",
    letterLabel: "Letter",
    langLabel: "Lang",
    stats: { total: "Total", unique: "Unique", frequent: "Top" },
    placeholder: "Discover the word starting with {letter}"
  },
  Spanish: {
    title: "P-LÉXICO",
    subtitle: "Explora el lenguaje, optimizado para móvil.",
    startBtn: "Comenzar",
    loading: "Buscando...",
    letterLabel: "Letra",
    langLabel: "Idioma",
    stats: { total: "Total", unique: "Únicas", frequent: "Top" },
    placeholder: "Descubre palabras con la {letter}"
  },
  Italian: {
    title: "P-LESSICO",
    subtitle: "Esplora la lingua, mobile-first.",
    startBtn: "Inizia",
    loading: "Ricerca...",
    letterLabel: "Lettera",
    langLabel: "Lingua",
    stats: { total: "Totale", unique: "Uniche", frequent: "Top" },
    placeholder: "Scopri parole con la {letter}"
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

  // Sync Stats with Storage
  useEffect(() => {
    const saved = localStorage.getItem('lexicon_v3_stats');
    if (saved) setStats(JSON.parse(saved));
  }, []);

  const updateStats = useCallback((word: string) => {
    setStats(prev => {
      const freq = { ...prev.wordFrequency };
      freq[word] = (freq[word] || 0) + 1;
      const next = {
        totalGenerated: prev.totalGenerated + 1,
        uniqueCount: Object.keys(freq).length,
        wordFrequency: freq
      };
      localStorage.setItem('lexicon_v3_stats', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleDiscover = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setIsAnimating(true);
    setCurrentWord(null);
    setShowDefinition(false);

    try {
      const [wordRes, decoyRes] = await Promise.all([
        fetchRandomWord(selectedLetter, language),
        fetchDecoyWords(selectedLetter, 15, language)
      ]);

      setDecoys(decoyRes);

      // Animation anticipation
      setTimeout(() => {
        setCurrentWord(wordRes);
        updateStats(wordRes.word);
        setIsAnimating(false);
        setIsLoading(false);
        
        // Cinematic Delay for Definition Reveal
        setTimeout(() => setShowDefinition(true), 2000);
      }, 2000);

    } catch (e) {
      console.error(e);
      setIsAnimating(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-5 py-10 text-white overflow-hidden bg-slate-950 font-sans selection:bg-cyan-500/30">
      <FallingLetters isActive={isAnimating} decoys={decoys} />

      {/* Mobile-First Header */}
      <header className="w-full flex items-center justify-between z-20 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-lg shadow-lg shadow-cyan-500/20"
          >
            {selectedLetter}
          </motion.div>
          <span className="font-black text-xl tracking-tighter uppercase">{t.title}</span>
        </div>

        <div className="flex gap-2">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-1.5 flex items-center">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border-none outline-none font-bold text-xs cursor-pointer appearance-none text-cyan-400 text-center"
            >
              <option value="English">EN</option>
              <option value="Spanish">ES</option>
              <option value="Italian">IT</option>
            </select>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-1.5 flex items-center">
            <select 
              value={selectedLetter}
              onChange={(e) => setSelectedLetter(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs cursor-pointer appearance-none text-center"
            >
              {ALPHABET.map(l => <option key={l} value={l} className="bg-slate-900">{l}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Center Reveal Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-sm px-4">
        <AnimatePresence mode="wait">
          {!currentWord && !isAnimating && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <h2 className="text-4xl font-black mb-3 leading-tight tracking-tight">
                {t.placeholder.replace('{letter}', selectedLetter)}
              </h2>
              <p className="text-white/30 text-xs uppercase tracking-widest font-bold">{t.subtitle}</p>
            </motion.div>
          )}

          {currentWord && (
            <motion.div
              key="word-view"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 w-full shadow-2xl flex flex-col items-center text-center relative">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6 px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  {currentWord.partOfSpeech}
                </motion.div>
                
                <h2 className="text-5xl font-black tracking-tighter text-white mb-4 break-words w-full">
                  {currentWord.word}
                </h2>

                <AnimatePresence>
                  {showDefinition && (
                    <motion.div
                      initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      className="mt-8 pt-8 border-t border-white/5 w-full"
                    >
                      <p className="text-sm md:text-base text-white/50 leading-relaxed font-medium">
                        {currentWord.definition}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Button */}
        <div className="mt-12 relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDiscover}
            disabled={isLoading}
            className={`
              relative z-10 px-10 py-4 rounded-3xl font-black text-sm tracking-widest uppercase transition-all
              ${isLoading 
                ? 'bg-white/5 text-white/10' 
                : 'bg-white text-slate-950 shadow-xl shadow-white/5 hover:bg-cyan-50'
              }
            `}
          >
            {isLoading ? t.loading : t.startBtn}
          </motion.button>
          
          <AnimatePresence>
            {!isLoading && (
              <motion.div 
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.4, opacity: [0, 0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 bg-white/20 rounded-3xl pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Compact Stats Footer */}
      <footer className="w-full flex flex-col items-center max-w-sm mx-auto">
        <StatsDashboard stats={stats} labels={t.stats} />
      </footer>
    </div>
  );
};

export default App;
