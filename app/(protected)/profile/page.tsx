// app/(protected)/profile/page.tsx
import { createClient } from '@/utils/supabase/server';
import type { Metadata } from "next";
import ProfileClient from "./profile-client";
import { User } from '@supabase/supabase-js';

interface UserPreferences {
  id: string;
  user_id: string;
  has_completed_onboarding: boolean;
}

interface UserPurchase {
  case_id: string;
  purchase_date: string;
}

interface SupabaseUserData {
  id: string;
  email: string;
  full_name: string;
  preferences: {
    id: string;
    has_completed_onboarding: boolean;
  };
  purchases: UserPurchase[];
}

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
  
  // First get the user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return (
      <div className="p-8">
        <p>Unable to retrieve user data. Please try again.</p>
      </div>
    );
  }

  // Fetch user data, preferences, and purchases in a single query
  const { data: userData } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      preferences:user_preferences!user_preferences_user_id_fkey (
        id,
        has_completed_onboarding
      ),
      purchases:user_purchases!user_purchases_user_id_fkey (
        case_id,
        purchase_date
      )
    `)
    .eq('id', user.id)
    .single();

  if (!userData) {
    return (
      <div className="p-8">
        <p>Unable to retrieve user data. Please try again.</p>
      </div>
    );
  }

  const typedUserData = userData as unknown as SupabaseUserData;

  return (
    <ProfileClient 
      initialUserData={user} 
      initialPurchasedCases={typedUserData.purchases || []} 
      initialPreferences={{
        id: typedUserData.preferences.id,
        user_id: user.id,
        has_completed_onboarding: typedUserData.preferences.has_completed_onboarding
      }}
    />
  );
}