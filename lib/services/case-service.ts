// File: lib/services/case-service.ts

import { createClient } from '@/utils/supabase/server';
import { createStaticClient } from '@/utils/supabase/static-client';
import type { DetectiveCase } from '@/lib/types/detective-case';

/**
 * Fetches all detective cases from Supabase
 * Used for listings and static site generation
 * @param options - Options object
 * @param options.isStatic - Whether this is being called in a static context (build time)
 */
export async function getAllCases({ isStatic = false }: { isStatic?: boolean } = {}): Promise<DetectiveCase[]> {
  // Use the appropriate client based on the isStatic flag
  const supabase = isStatic 
    ? createStaticClient() 
    : await createClient();
  
  const { data, error } = await supabase
    .from('detective_cases')
    .select('*')
    .order('id');
  
  if (error) {
    console.error('Error fetching all cases:', error);
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }
  
  // Map from database schema to application schema (snake_case to camelCase)
  return data.map(caseData => ({
    id: caseData.id,
    title: caseData.title,
    description: caseData.description,
    price: caseData.price,
    difficulty: caseData.difficulty as 'easy' | 'medium' | 'hard',
    imageUrl: caseData.image_url,
    content: caseData.content
  }));
}

/**
 * Fetches a single detective case by ID
 * Returns null if case doesn't exist
 * @param id - The ID of the case to fetch
 * @param options - Options object
 * @param options.isStatic - Whether this is being called in a static context (build time)
 */
export async function getCaseById(id: string, { isStatic = false }: { isStatic?: boolean } = {}): Promise<DetectiveCase | null> {
  // Use the appropriate client based on the isStatic flag
  const supabase = isStatic 
    ? createStaticClient() 
    : await createClient();
  
  const { data, error } = await supabase
    .from('detective_cases')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      return null;
    }
    console.error(`Error fetching case ${id}:`, error);
    throw new Error(`Failed to fetch case: ${error.message}`);
  }
  
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    price: data.price,
    difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
    imageUrl: data.image_url,
    content: data.content
  };
}

/**
 * Caches cases for static and client-side rendering
 * This helps with performance and prevents re-fetching
 */
let cachedCases: DetectiveCase[] | null = null;

/**
 * Gets all cases with caching for client-side use
 * Important for static site generation and initial renders
 * @param options - Options object
 * @param options.isStatic - Whether this is being called in a static context (build time)
 */
export async function getCachedCases({ isStatic = false }: { isStatic?: boolean } = {}): Promise<DetectiveCase[]> {
  // Return cached data if available
  // Note: Cache is shared between static and dynamic calls. Clear cache if data updates.
  if (cachedCases) {
    return cachedCases;
  }
  
  const cases = await getAllCases({ isStatic }); // Pass the flag down
  cachedCases = cases;
  return cases;
}

/**
 * Gets a case by ID with caching for client-side use
 * @param id - The ID of the case to fetch
 * @param options - Options object
 * @param options.isStatic - Whether this is being called in a static context (build time)
 */
export async function getCachedCaseById(id: string, { isStatic = false }: { isStatic?: boolean } = {}): Promise<DetectiveCase | null> {
  // Check cache first if available
  if (cachedCases) {
    const foundCase = cachedCases.find(c => c.id === id);
    // If found in cache, assume it was populated correctly (either static or dynamic)
    if (foundCase) return foundCase; 
  }
  
  // If not in cache or not found, fetch directly, passing the flag
  return getCaseById(id, { isStatic });
}

/**
 * Clear the cases cache (used when data changes)
 */
export function clearCasesCache() {
  cachedCases = null;
} 