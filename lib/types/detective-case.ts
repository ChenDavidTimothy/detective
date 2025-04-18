// File: lib/types/detective-case.ts

export interface DetectiveCase {
  id: string;
  title: string;
  description: string;
  price: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  content?: string;
} 