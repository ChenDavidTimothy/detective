// Create file: /scripts/seed-cases.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DETECTIVE_CASES = [
  {
    id: "case-001",
    title: "The Missing Artifact",
    description: "A valuable artifact has disappeared from the city museum. Can you track down the thief?",
    price: 9.99,
    difficulty: "easy",
    image_url: "/images/cases/missing-artifact.jpg"
  },
  {
    id: "case-002",
    title: "The Encrypted Message",
    description: "An encrypted message was found at a crime scene. Decode the message to find the culprit.",
    price: 14.99,
    difficulty: "medium",
    image_url: "/images/cases/encrypted-message.jpg"
  },
  {
    id: "case-003",
    title: "The Double Murder",
    description: "Two victims found in separate locations but killed by the same person. Connect the dots.",
    price: 19.99,
    difficulty: "hard",
    image_url: "/images/cases/double-murder.jpg"
  },
  {
    id: "case-004",
    title: "The Corporate Sabotage",
    description: "Someone is sabotaging a tech company from the inside. Identify the mole.",
    price: 12.99,
    difficulty: "medium",
    image_url: "/images/cases/corporate-sabotage.jpg"
  },
  {
    id: "case-005",
    title: "The Vanishing Witness",
    description: "A key witness has disappeared before the trial. Find them before it's too late.",
    price: 15.99,
    difficulty: "medium",
    image_url: "/images/cases/vanishing-witness.jpg"
  }
];

async function seedCases() {
  try {
    const { data, error } = await supabase
      .from('detective_cases')
      .upsert(DETECTIVE_CASES, {
        onConflict: 'id'
      });

    if (error) {
      throw error;
    }

    console.log('Successfully seeded detective cases!');
  } catch (error) {
    console.error('Error seeding detective cases:', error);
  }
}

seedCases();