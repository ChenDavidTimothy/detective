// File: seed-cases.mjs
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env.local found, falling back to .env');
  dotenv.config();
}

// Check required env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in environment');
  process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
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
  console.log('Starting to seed detective cases...');
  try {
    // First ensure the table exists
    console.log('Checking for detective_cases table...');
    const { error: tableError } = await supabase.from('detective_cases').select('id').limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01') { // Table doesn't exist
        console.error('Table detective_cases does not exist. Please run the SQL setup script first.');
        process.exit(1);
      } else {
        throw tableError;
      }
    }
    
    console.log('Inserting cases...');
    const { data, error } = await supabase
      .from('detective_cases')
      .upsert(DETECTIVE_CASES, {
        onConflict: 'id',
        returning: 'minimal'
      });

    if (error) {
      throw error;
    }

    console.log('✅ Successfully seeded detective cases!');
  } catch (error) {
    console.error('❌ Error seeding detective cases:', error);
  }
}

// Run the seeding function
seedCases();