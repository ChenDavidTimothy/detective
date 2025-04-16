// app/(protected)/dashboard/dashboard-client.tsx
"use client";

import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetectiveCase } from "@/lib/detective-cases";
import { motion } from "framer-motion";
import { FileText, ExternalLink } from "lucide-react";

interface PurchasedCase {
  case_id: string;
  purchase_date?: string;
  details?: DetectiveCase;
}

interface DashboardClientProps {
  initialUserData: User | null;
  userCases: PurchasedCase[];
}

export default function DashboardClient({
  initialUserData,
  userCases,
}: DashboardClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Your Detective Cases
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome back
                {initialUserData?.email
                  ? `, ${initialUserData.email.split("@")[0]}!`
                  : "!"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCases.map((purchasedCase, index) => (
              <motion.div
                key={purchasedCase.case_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{purchasedCase.details?.title || "Unknown Case"}</CardTitle>
                      {purchasedCase.details?.difficulty && (
                        <Badge
                          variant={
                            purchasedCase.details.difficulty === 'easy'
                              ? 'default'
                              : purchasedCase.details.difficulty === 'medium'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {purchasedCase.details.difficulty}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {purchasedCase.purchase_date 
                        ? `Purchased on ${new Date(purchasedCase.purchase_date).toLocaleDateString()}`
                        : "Purchase date unknown"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground line-clamp-3">
                      {purchasedCase.details?.description || "No description available."}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="pt-4 border-t">
                    <Button 
                      onClick={() => router.push(`/cases/${purchasedCase.case_id}`)}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Open Case
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Cases Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven`&apos;`t purchased any detective cases yet. Browse our collection to find your first mystery to solve.
            </p>
            <Button onClick={() => router.push('/cases')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse Cases
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}