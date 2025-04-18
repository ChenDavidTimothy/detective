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
  
  // First get the user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return (
      <div className="p-8">
        <p>Unable to retrieve user data. Please try again.</p>
      </div>
    );
  }

  // Fetch user data, preferences, and purchases with case details in a single query
  const { data: userData, error: userError } = await supabase
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
        purchase_date,
        case:detective_cases!user_purchases_case_id_fkey ( 
          id, 
          title, 
          description, 
          price, 
          difficulty,
          image_url
        )
      )
    `)
    .eq('id', user.id)
    .maybeSingle(); // Use maybeSingle() to handle potentially missing users gracefully

  if (userError) {
    console.error("Error fetching user data:", userError);
    return (
      <div className="p-8">
        <p>Error retrieving user data. Please try again later.</p>
      </div>
    );
  }

  if (!userData) {
      console.warn(`No user data found for user ID: ${user.id}`);
      // Decide how to handle missing user data - maybe show profile client with defaults?
      // For now, returning an error message.
      return (
          <div className="p-8">
              <p>User profile data not found.</p>
          </div>
      );
  }
  
  // Handle potential array for preferences (take first element or default)
  const preferencesData = Array.isArray(userData.preferences) ? userData.preferences[0] : userData.preferences;
  const preferences = preferencesData || {
    id: `default-prefs-${user.id}`, // Provide a unique default ID
    has_completed_onboarding: false 
  };

  // Filter purchases to include only those with valid case details, then transform
  const purchasedCases = (userData.purchases || [])
    .map(purchase => {
      // Handle potential array for case details (take first element)
      const caseDetails = Array.isArray(purchase.case) ? purchase.case[0] : purchase.case;
      return {
        ...purchase, // Keep original purchase data
        caseDetails // Add processed case details (might be null)
      };
    })
    .filter(p => p.caseDetails != null) // Filter out entries where caseDetails is null/undefined
    .map(p => ({ // Map to the final structure expected by the client
      case_id: p.case_id,
      purchase_date: p.purchase_date,
      details: { // Now we know caseDetails is not null here
        id: p.caseDetails.id,
        title: p.caseDetails.title,
        description: p.caseDetails.description,
        price: p.caseDetails.price,
        difficulty: p.caseDetails.difficulty,
        image_url: p.caseDetails.image_url,
      }
    }));

  return (
    <ProfileClient 
      initialUserData={user} 
      initialPurchasedCases={purchasedCases} // This array now only contains valid cases
      initialPreferences={{
        id: preferences.id,
        user_id: user.id,
        has_completed_onboarding: preferences.has_completed_onboarding
      }}
    />
  );
}