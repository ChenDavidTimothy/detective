// app/(protected)/dashboard/page.tsx
import type { Metadata } from "next";
import { createClient } from '@/utils/supabase/server';
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your detective case progress, statistics, and account information.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user; // Already verified by protected layout
  
  // You can fetch additional data needed for the dashboard here
  // This is more efficient than fetching in client components
  
  return <DashboardClient initialUserData={user} />;
}