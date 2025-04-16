"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  CreditCard,
  Settings,
  PlusCircle,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";

// Dashboard metrics data
const dashboardMetrics = [
  {
    title: "Total Users",
    value: "1,234",
    change: "+12.3%",
    icon: <Users className="h-6 w-6 text-primary" />,
    trend: "up",
  },
  {
    title: "Revenue",
    value: "$12.4k",
    change: "+8.2%",
    icon: <CreditCard className="h-6 w-6 text-primary" />,
    trend: "up",
  },
  {
    title: "Active Sessions",
    value: "432",
    change: "-3.1%",
    icon: <Activity className="h-6 w-6 text-primary" />,
    trend: "down",
  },
  {
    title: "Growth Rate",
    value: "18.2%",
    change: "+2.4%",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    trend: "up",
  },
];

// Recent activity data
const recentActivity = [
  {
    id: 1,
    action: "New user signup",
    timestamp: "2 minutes ago",
    icon: <PlusCircle className="h-4 w-4" />,
  },
  {
    id: 2,
    action: "Payment processed",
    timestamp: "15 minutes ago",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: 3,
    action: "Settings updated",
    timestamp: "1 hour ago",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    id: 4,
    action: "Session completed",
    timestamp: "2 hours ago",
    icon: <Clock className="h-4 w-4" />,
  },
];

interface DashboardClientProps {
  initialUserData: User | null;
}

export default function DashboardClient({
  initialUserData,
}: DashboardClientProps) {
  // Use user data from props
  const [user] = useState(initialUserData);

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Dashboard Overview
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome back
                {user?.email
                  ? `, ${user.email.split("@")[0]}!`
                  : "!"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 shadow-xs border border-border"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {metric.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    metric.trend === "up"
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-foreground">
                {metric.value}
              </h3>
              <p className="text-sm text-muted-foreground">
                {metric.title}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Activity Feed and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-card rounded-xl p-6 shadow-xs border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Analytics Overview
              </h3>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">Chart Placeholder</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-xl p-6 shadow-xs border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 text-sm"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-foreground">{activity.action}</p>
                    <p className="text-muted-foreground text-xs">
                      {activity.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
