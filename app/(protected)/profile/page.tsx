// app/(protected)/profile/page.tsx
import { createClient } from '@/utils/supabase/server';
import type { Metadata } from "next";
import ProfileClient from "./profile-client";

export const metadata: Metadata = {
  title: "Your Profile",
  description: "Manage your account settings and view your purchased detective cases.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user; // Already verified by layout
  
  // The user should always exist because of the protected layout,
  // but let's add a safety check anyway
  if (!user) {
    // This should rarely happen as the layout should catch this,
    // but as a fallback:
    return (
      <div className="p-8">
        <p>Unable to retrieve user data. Please try again.</p>
      </div>
    );
  }
  
  // Fetch user's purchased cases
  const { data: purchasedCases } = await supabase
    .from('user_purchases')
    .select('case_id, purchase_date')
    .eq('user_id', user.id);
  
  return (
    <ProfileClient 
      initialUserData={user} 
      initialPurchasedCases={purchasedCases || []} 
    />
  );
}