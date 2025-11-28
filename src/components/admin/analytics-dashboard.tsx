'use client';
import { useMemo } from 'react';
import type { PC } from '@/lib/types';
import { BarChart, Users, DollarSign, Clock, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

type AnalyticsDashboardProps = {
  pcs: PC[];
};

const durationOptions = [
    { value: 30, label: '30 minutes', price: 30 },
    { value: 60, label: '1 hour', price: 50 },
    { value: 120, label: '2 hours', price: 90 },
    { value: 180, label: '3 hours', price: 120 },
  ];

export function AnalyticsDashboard({ pcs }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const totalRevenue = pcs
        .filter(pc => pc.status === 'pending_payment' || pc.status === 'in_use')
        .reduce((acc, pc) => {
            const durationInfo = durationOptions.find(d => d.value === pc.session_duration);
            return acc + (durationInfo?.price || 0);
        }, 0);

    const activeUsers = pcs.filter(pc => pc.status === 'in_use').length;
    const totalSessions = pcs.filter(pc => pc.status === 'in_use' || pc.status === 'pending_payment').length;

    const statusCounts = pcs.reduce((acc, pc) => {
      acc[pc.status] = (acc[pc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
    }));

    return { totalRevenue, activeUsers, totalSessions, chartData };
  }, [pcs]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₱{stats.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">from {stats.totalSessions} sessions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">Currently in session</p>
        </CardContent>
      </Card>
       <Card className="col-span-1 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">PC Status Distribution</CardTitle>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[120px] w-full">
            <RechartsBarChart
              data={stats.chartData}
              layout="vertical"
              margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                width={110}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
            </RechartsBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
