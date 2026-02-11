
export type Language = 'English' | 'Spanish' | 'Italian';

export interface WordData {
  word: string;
  definition: string;
  partOfSpeech: string;
}

export interface Stats {
  totalGenerated: number;
  uniqueCount: number;
  wordFrequency: Record<string, number>;
}

export interface AnimationParticle {
  id: string;
  text: string;
  x: number;
  y: number;
  rotation: number;
  velocity: number;
}
