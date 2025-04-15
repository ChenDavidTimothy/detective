import type { Metadata } from "next";
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your detective case progress, statistics, and account information.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}