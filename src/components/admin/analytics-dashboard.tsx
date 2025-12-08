'use client';
import { useMemo, useState, useEffect } from 'react';
import type { PC, PricingTier } from '@/lib/types';
import { Users, DollarSign, Clock, Computer, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { addDays, format, subMonths, startOfDay, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';

type AnalyticsDashboardProps = {
  pcs: PC[];
  historicalSessions: PC[];
  pricingTiers: PricingTier[];
};


export function AnalyticsDashboard({ pcs, historicalSessions, pricingTiers }: AnalyticsDashboardProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
  });

  const allSessions = useMemo(() => {
    return [...historicalSessions, ...pcs.filter(pc => pc.status === 'in_use' || pc.status === 'pending_payment')];
  }, [historicalSessions, pcs]);


  const mainStats = useMemo(() => {
    if (!date?.from) return { totalRevenue: 0, totalSessions: 0, averageSessionMinutes: 0, monthlyPerformanceData: [] };
    
    const fromDate = startOfDay(date.from);
    const toDate = date.to ? startOfDay(addDays(date.to, 1)) : startOfDay(addDays(new Date(), 1));

    const filteredSessions = allSessions.filter(pc => {
        if (!pc.session_start) return false;
        const sessionDate = new Date(pc.session_start);
        return sessionDate >= fromDate && sessionDate < toDate;
    });

    const totalRevenue = filteredSessions.reduce((acc, pc) => {
        const durationInfo = pricingTiers.find(d => d.value === String(pc.session_duration));
        return acc + (durationInfo?.price || 0);
    }, 0);
    
    const totalSessions = filteredSessions.length;
    const averageSessionMinutes = totalSessions > 0 ? filteredSessions.reduce((acc, pc) => acc + (pc.session_duration || 0), 0) / totalSessions : 0;
    
    const monthlyPerformance = filteredSessions.reduce((acc, session) => {
        if (!session.session_start) return acc;
        const month = format(new Date(session.session_start), 'MMM yyyy');
        const durationInfo = pricingTiers.find(d => d.value === String(session.session_duration));
        const price = durationInfo?.price || 0;
        if (!acc[month]) {
            acc[month] = { month, revenue: 0, sessions: 0 };
        }
        acc[month].revenue += price;
        acc[month].sessions += 1;
        return acc;
    }, {} as Record<string, { month: string, revenue: number, sessions: number }>);
    const monthlyPerformanceData = Object.values(monthlyPerformance).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return { totalRevenue, totalSessions, averageSessionMinutes, monthlyPerformanceData };
  }, [allSessions, pricingTiers, date]);

  const activePcsCount = pcs.filter(pc => pc.status === 'in_use').length;

  const chartConfig = {
    revenue: {
      label: "Revenue (₱)",
      color: "hsl(var(--chart-1))",
    },
    sessions: {
      label: "Sessions",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap gap-4 justify-between items-end">
            <div className='flex flex-wrap gap-4'>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-[260px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₱{mainStats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">from selected period</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active PCs</CardTitle>
                <Computer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{activePcsCount}</div>
                <p className="text-xs text-muted-foreground">out of {pcs.length} total PCs</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+{mainStats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">from selected period</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{mainStats.averageSessionMinutes.toFixed(0)} min</div>
                <p className="text-xs text-muted-foreground">from selected period</p>
            </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Revenue and sessions for each month in the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <RechartsBarChart data={mainStats.monthlyPerformanceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" fontSize={12} tickFormatter={(val) => `₱${(val/1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} name="Revenue (₱)"/>
                        <Bar yAxisId="right" dataKey="sessions" fill="var(--color-sessions)" radius={[4, 4, 0, 0]} name="Sessions"/>
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
        </Card>

    </div>
  );
}
