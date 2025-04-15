// Create file: /lib/detective-cases.ts

export interface DetectiveCase {
  id: string;
  title: string;
  description: string;
  price: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
}

export const DETECTIVE_CASES: DetectiveCase[] = [
  {
    id: "case-001",
    title: "The Missing Artifact",
    description: "A valuable artifact has disappeared from the city museum. Can you track down the thief?",
    price: 9.99,
    difficulty: "easy",
    imageUrl: "/images/cases/missing-artifact.jpg"
  },
  {
    id: "case-002",
    title: "The Encrypted Message",
    description: "An encrypted message was found at a crime scene. Decode the message to find the culprit.",
    price: 14.99,
    difficulty: "medium",
    imageUrl: "/images/cases/encrypted-message.jpg"
  },
  {
    id: "case-003",
    title: "The Double Murder",
    description: "Two victims found in separate locations but killed by the same person. Connect the dots.",
    price: 19.99,
    difficulty: "hard",
    imageUrl: "/images/cases/double-murder.jpg"
  },
  {
    id: "case-004",
    title: "The Corporate Sabotage",
    description: "Someone is sabotaging a tech company from the inside. Identify the mole.",
    price: 12.99,
    difficulty: "medium",
    imageUrl: "/images/cases/corporate-sabotage.jpg"
  },
  {
    id: "case-005",
    title: "The Vanishing Witness",
    description: "A key witness has disappeared before the trial. Find them before it's too late.",
    price: 15.99,
    difficulty: "medium",
    imageUrl: "/images/cases/vanishing-witness.jpg"
  }
];

// Helper function to get case by ID
export function getCaseById(id: string): DetectiveCase | undefined {
  return DETECTIVE_CASES.find(c => c.id === id);
}