'use client';
import { useMemo, useState } from 'react';
import type { PC, PricingTier, PaymentMethod } from '@/lib/types';
import { BarChart, Users, DollarSign, Clock, BarChart2, Computer, Timer, Calendar as CalendarIcon } from 'lucide-react';
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
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

type AnalyticsDashboardProps = {
  pcs: PC[];
  pricingTiers: PricingTier[];
};

export function AnalyticsDashboard({ pcs, pricingTiers }: AnalyticsDashboardProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const stats = useMemo(() => {
    const allSessions = pcs.filter(pc => (pc.status === 'in_use' || pc.status === 'pending_payment') && pc.session_start && pc.session_duration);

    const filteredSessions = allSessions.filter(pc => {
        if (!date?.from || !pc.session_start) return true;
        const sessionDate = new Date(pc.session_start);
        const fromDate = date.from;
        const toDate = date.to ? addDays(date.to, 1) : addDays(fromDate, 1);
        return sessionDate >= fromDate && sessionDate < toDate;
    });

    const totalRevenue = filteredSessions.reduce((acc, pc) => {
        const durationInfo = pricingTiers.find(d => d.value === String(pc.session_duration));
        return acc + (durationInfo?.price || 0);
    }, 0);

    const activeUsers = pcs.filter(pc => pc.status === 'in_use').length;
    const totalSessions = filteredSessions.length;

    const totalMinutes = filteredSessions.reduce((acc, pc) => acc + (pc.session_duration || 0), 0);
    const averageSessionMinutes = totalSessions > 0 ? totalMinutes / totalSessions : 0;


    const statusCounts = pcs.reduce((acc, pc) => {
      acc[pc.status] = (acc[pc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
    }));

    const paymentMethodCounts = filteredSessions.reduce((acc, pc) => {
        if (pc.paymentMethod) {
            acc[pc.paymentMethod] = (acc[pc.paymentMethod] || 0) + 1;
        }
        return acc;
    }, {} as Record<PaymentMethod, number>);

    const paymentMethodChartData = Object.entries(paymentMethodCounts).map(([name, value]) => ({
        name,
        value,
    }));

    const pcUtilization = filteredSessions.reduce((acc, pc) => {
        acc[pc.name] = (acc[pc.name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pcUtilizationChartData = Object.entries(pcUtilization)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    const durationPopularity = filteredSessions.reduce((acc, pc) => {
        const durationLabel = pricingTiers.find(d => d.value === String(pc.session_duration))?.label || `${pc.session_duration} min`;
        acc[durationLabel] = (acc[durationLabel] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const durationPopularityChartData = Object.entries(durationPopularity).map(([name, value]) => ({
        name,
        value,
    })).sort((a,b) => b.value - a.value);


    return { 
        totalRevenue, 
        activeUsers, 
        totalSessions, 
        statusChartData, 
        averageSessionMinutes, 
        paymentMethodChartData,
        totalMinutes,
        pcUtilizationChartData,
        durationPopularityChartData,
    };
  }, [pcs, pricingTiers, date]);

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                    date.to ? (
                        <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(date.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Summary Cards */}
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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.averageSessionMinutes.toFixed(0)} min</div>
                    <p className="text-xs text-muted-foreground">Average rental duration</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Session Time</CardTitle>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(stats.totalMinutes / 60).toFixed(1)} hrs</div>
                    <p className="text-xs text-muted-foreground">Total time PCs were rented</p>
                </CardContent>
            </Card>

            {/* Charts */}
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>PC Utilization</CardTitle>
                    <CardDescription>Number of sessions per computer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <RechartsBarChart data={stats.pcUtilizationChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Session Duration Popularity</CardTitle>
                    <CardDescription>Most frequently chosen rental durations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <RechartsBarChart data={stats.durationPopularityChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[200px] w-full">
                        <RechartsBarChart data={stats.paymentMethodChartData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="value" fill="hsl(var(--accent))" radius={8} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Live PC Status Distribution</CardTitle>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-2">
                    <ChartContainer config={{}} className="h-[200px] w-full">
                        <RechartsBarChart data={stats.statusChartData} layout="vertical" margin={{ left: 50, right: 10, top: 0, bottom: 0 }}>
                            <CartesianGrid horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={110} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

    

    