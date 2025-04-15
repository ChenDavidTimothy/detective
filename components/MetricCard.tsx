import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  number: string;
  label: string;
  icon: ReactNode;
}

export const MetricCard = ({ number, label, icon }: MetricCardProps) => (
  <Card className="bg-muted">
    <CardContent className="pt-6">
      {/* Center icon */}
      <div className="flex justify-center mb-2 text-primary">
        {icon}
      </div>
      {/* Center number and label */}
      <div className="text-center">
        <div className="text-2xl font-bold">{number}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);