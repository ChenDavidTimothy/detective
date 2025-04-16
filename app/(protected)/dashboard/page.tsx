// app/(protected)/dashboard/page.tsx
import type { Metadata } from "next";
import { createClient } from '@/utils/supabase/server';
import DashboardClient from "./dashboard-client";
import { DETECTIVE_CASES } from "@/lib/detective-cases";

export const metadata: Metadata = {
  title: "Your Detective Cases",
  description: "View your purchased detective cases and continue your investigations.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user; // Already verified by protected layout
  
  // Fetch user's purchased cases
  const { data: purchasedCases, error } = await supabase
    .from('user_purchases')
    .select('case_id, purchase_date')
    .eq('user_id', user?.id || '');
  
  if (error) {
    console.error('Error fetching purchased cases:', error);
  }
  
  // Map purchased case IDs to actual case details
  const userCases = (purchasedCases || []).map(purchase => {
    const caseDetails = DETECTIVE_CASES.find(c => c.id === purchase.case_id);
    return {
      ...purchase,
      details: caseDetails
    };
  }).filter(c => c.details); // Filter out any cases that don't have matching details
  
  return <DashboardClient initialUserData={user} userCases={userCases} />;
}