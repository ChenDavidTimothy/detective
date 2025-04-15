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

export default function ProfilePage() {
  return <ProfileClient />;
}