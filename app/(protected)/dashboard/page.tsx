// app/(protected)/dashboard/page.tsx
import type { Metadata } from "next";
import { createClient } from '@/utils/supabase/server';
import DashboardClient from "./dashboard-client";
import { User } from '@supabase/supabase-js';

type Difficulty = 'easy' | 'medium' | 'hard';

interface CaseDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  difficulty: Difficulty;
  image_url: string;
}

interface PurchasedCase {
  case_id: string;
  purchase_date: string;
  details: CaseDetails;
}

interface SupabasePurchase {
  case_id: string;
  purchase_date: string;
  case: CaseDetails;
}

export const metadata: Metadata = {
  title: "Your Detective Cases",
  description: "View your purchased detective cases and continue your investigations.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // First get the user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return <DashboardClient initialUserData={user} userCases={[]} />;
  }

  // Then fetch their cases in a single query
  const { data: cases } = await supabase
    .from('user_purchases')
    .select(`
      case_id,
      purchase_date,
      case:detective_cases!user_purchases_case_id_fkey (
        id,
        title,
        description,
        price,
        difficulty,
        image_url
      )
    `)
    .eq('user_id', user.id)
    .order('purchase_date', { ascending: false });

  // Transform the data to match the expected format
  const userCases: PurchasedCase[] = (cases as SupabasePurchase[] | null)?.map(purchase => ({
    case_id: purchase.case_id,
    purchase_date: purchase.purchase_date,
    details: purchase.case
  })) || [];

  return <DashboardClient initialUserData={user} userCases={userCases} />;
}