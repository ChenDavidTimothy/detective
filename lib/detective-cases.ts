export interface DetectiveCase {
  id: string;
  title: string;
  description: string;
  price: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  content?: string; // <-- Add this line
}

export const DETECTIVE_CASES: DetectiveCase[] = [
  {
    id: "case-001",
    title: "The Missing Artifact",
    description: "A valuable artifact has disappeared from the city museum. Can you track down the thief?",
    price: 9.99,
    difficulty: "easy",
    imageUrl: "/images/cases/missing-artifact.jpg",
    content: "Full details about the missing artifact case, including suspects, timeline, and clues."
  },
  {
    id: "case-002",
    title: "The Encrypted Message",
    description: "An encrypted message was found at a crime scene. Decode the message to find the culprit.",
    price: 14.99,
    difficulty: "medium",
    imageUrl: "/images/cases/encrypted-message.jpg",
    content: "Full details about the encrypted message case, including the message, cipher hints, and suspects."
  },
  {
    id: "case-003",
    title: "The Double Murder",
    description: "Two victims found in separate locations but killed by the same person. Connect the dots.",
    price: 19.99,
    difficulty: "hard",
    imageUrl: "/images/cases/double-murder.jpg",
    content: "Full details about the double murder case, including victim backgrounds, timelines, and evidence."
  },
  {
    id: "case-004",
    title: "The Corporate Sabotage",
    description: "Someone is sabotaging a tech company from the inside. Identify the mole.",
    price: 12.99,
    difficulty: "medium",
    imageUrl: "/images/cases/corporate-sabotage.jpg",
    content: "Full details about the corporate sabotage case, including company structure, suspects, and incidents."
  },
  {
    id: "case-005",
    title: "The Vanishing Witness",
    description: "A key witness has disappeared before the trial. Find them before it's too late.",
    price: 15.99,
    difficulty: "medium",
    imageUrl: "/images/cases/vanishing-witness.jpg",
    content: "Full details about the vanishing witness case, including last known whereabouts and possible motives."
  }
];

// Helper function to get case by ID
export function getCaseById(id: string): DetectiveCase | undefined {
  return DETECTIVE_CASES.find(c => c.id === id);
}
