
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationParticle } from '../types';

interface FallingLettersProps {
  isActive: boolean;
  decoys: string[];
}

export const FallingLetters: React.FC<FallingLettersProps> = ({ isActive, decoys }) => {
  const [particles, setParticles] = useState<AnimationParticle[]>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: 25 }).map((_, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        text: decoys[Math.floor(Math.random() * decoys.length)] || 'P',
        x: Math.random() * 100, // percentage
        y: -10 - Math.random() * 50,
        rotation: Math.random() * 360,
        velocity: 1 + Math.random() * 2
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isActive, decoys]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: `${p.y}%`, x: `${p.x}%`, rotate: 0, opacity: 0 }}
            animate={{ 
              y: '120%', 
              x: `${p.x + (Math.random() * 10 - 5)}%`, 
              rotate: p.rotation + 720,
              opacity: [0, 1, 1, 0]
            }}
            transition={{ 
              duration: p.velocity + 1.5, 
              ease: "easeIn",
              times: [0, 0.1, 0.8, 1]
            }}
            className="absolute text-white/40 font-bold text-2xl select-none"
          >
            {p.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
