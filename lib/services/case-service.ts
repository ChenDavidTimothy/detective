// File: lib/services/case-service.ts

import { createClient } from '@/utils/supabase/server'
import { createStaticClient } from '@/utils/supabase/static-client'
import type { DetectiveCase } from '@/lib/types/detective-case'

type DetectiveCaseRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  difficulty: 'easy' | 'medium' | 'hard';
  image_url: string;
  content: string;
};

type ServiceOptions = { isStatic?: boolean }

let cachedCases: DetectiveCase[] | null = null

/**
 * Returns the proper Supabase client for static or runtime calls.
 */
async function getClient(isStatic = false) {
  return isStatic ? createStaticClient() : await createClient()
}

/**
 * Maps a DB row (snake_case) to our app model (camelCase).
 */
function mapCase(row: DetectiveCaseRow): DetectiveCase {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    imageUrl: row.image_url,
    content: row.content,
  }
}

/**
 * Fetch all cases.
 */
export async function getAllCases(
  { isStatic = false }: ServiceOptions = {},
): Promise<DetectiveCase[]> {
  const supabase = await getClient(isStatic)
  const { data, error } = await supabase
    .from('detective_cases')
    .select('*')
    .order('id')

  if (error) {
    console.error('Error fetching cases:', error)
    throw new Error(`Failed to fetch cases: ${error.message}`)
  }

  return data.map(mapCase)
}

/**
 * Fetch one case by ID. Returns null if not found.
 */
export async function getCaseById(
  id: string,
  { isStatic = false }: ServiceOptions = {},
): Promise<DetectiveCase | null> {
  const supabase = await getClient(isStatic)
  const { data, error } = await supabase
    .from('detective_cases')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error(`Error fetching case ${id}:`, error)
    throw new Error(`Failed to fetch case ${id}: ${error.message}`)
  }

  return mapCase(data)
}

/**
 * In‑memory cache for client‑side or SSG.
 */
export async function getCachedCases(
  opts: ServiceOptions = {},
): Promise<DetectiveCase[]> {
  if (!cachedCases) {
    cachedCases = await getAllCases(opts)
  }
  return cachedCases
}

/**
 * Cache‑aware single fetch.
 */
export async function getCachedCaseById(
  id: string,
  opts: ServiceOptions = {},
): Promise<DetectiveCase | null> {
  if (cachedCases) {
    const found = cachedCases.find(c => c.id === id)
    if (found) return found
  }
  return getCaseById(id, opts)
}

/**
 * Clear in‑memory cache (e.g. after data mutation).
 */
export function clearCasesCache() {
  cachedCases = null
}
