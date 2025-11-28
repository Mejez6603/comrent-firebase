'use client';
import { useMemo, useState } from 'react';
import type { PC, PricingTier, PaymentMethod } from '@/lib/types';
import { Users, DollarSign, Clock, Computer, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  Line,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
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
import { addDays, format, subMonths, startOfDay, getDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

type AnalyticsDashboardProps = {
  pcs: PC[];
  historicalSessions: PC[];
  pricingTiers: PricingTier[];
};

export function AnalyticsDashboard({ pcs, historicalSessions, pricingTiers }: AnalyticsDashboardProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  const stats = useMemo(() => {
    const allSessions = [...historicalSessions, ...pcs.filter(pc => pc.status === 'in_use' || pc.status === 'pending_payment')];

    const filteredSessions = allSessions.filter(pc => {
        if (!date?.from || !pc.session_start) return false;
        const sessionDate = new Date(pc.session_start);
        const fromDate = startOfDay(date.from);
        const toDate = date.to ? startOfDay(addDays(date.to, 1)) : startOfDay(addDays(new Date(), 1));
        return sessionDate >= fromDate && sessionDate < toDate;
    });

    const totalRevenue = filteredSessions.reduce((acc, pc) => {
        const durationInfo = pricingTiers.find(d => d.value === String(pc.session_duration));
        return acc + (durationInfo?.price || 0);
    }, 0);

    const activePcsCount = pcs.filter(pc => pc.status === 'in_use').length;
    const totalSessions = filteredSessions.length;
    const averageSessionMinutes = totalSessions > 0 ? filteredSessions.reduce((acc, pc) => acc + (pc.session_duration || 0), 0) / totalSessions : 0;
    
    const paymentMethodCounts = filteredSessions.reduce((acc, pc) => {
        if (pc.paymentMethod) {
            acc[pc.paymentMethod] = (acc[pc.paymentMethod] || 0) + 1;
        }
        return acc;
    }, {} as Record<PaymentMethod, number>);

    const pcStatusCounts = pcs.reduce((acc, pc) => {
        acc[pc.status] = (acc[pc.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // New analytics data
    const dailyRevenue = filteredSessions.reduce((acc, session) => {
        if (!session.session_start) return acc;
        const day = format(new Date(session.session_start), 'yyyy-MM-dd');
        const durationInfo = pricingTiers.find(d => d.value === String(session.session_duration));
        const price = durationInfo?.price || 0;
        if (!acc[day]) {
            acc[day] = { date: day, revenue: 0 };
        }
        acc[day].revenue += price;
        return acc;
    }, {} as Record<string, { date: string, revenue: number }>);
    const dailyRevenueChartData = Object.values(dailyRevenue).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    const hourlyActivity = filteredSessions.reduce((acc, session) => {
        if (!session.session_start) return acc;
        const hour = new Date(session.session_start).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const hourlyActivityChartData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        sessions: hourlyActivity[i] || 0,
      }));

    return { totalRevenue, activePcsCount, totalSessions, averageSessionMinutes, paymentMethodCounts, pcStatusCounts, dailyRevenueChartData, hourlyActivityChartData };
  }, [pcs, historicalSessions, pricingTiers, date]);

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
            <CardTitle className="text-sm font-medium">Active PCs</CardTitle>
            <Computer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePcsCount}</div>
            <p className="text-xs text-muted-foreground">out of {pcs.length} total PCs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">within the selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageSessionMinutes.toFixed(0)} min</div>
            <p className="text-xs text-muted-foreground">average time per session</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
          <ChartContainer config={{
                revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-1))",
                },
            }}>
              <RechartsLineChart
                data={stats.dailyRevenueChartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                    yAxisId="left" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(value) => `₱${value}`}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Legend />
                <Line
                  dataKey="revenue"
                  type="monotone"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  yAxisId="left"
                  name="Daily Revenue"
                />
              </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>Most popular times for sessions.</CardDescription>
          </CardHeader>
          <CardContent>
          <ChartContainer config={{
                sessions: {
                    label: "Sessions",
                    color: "hsl(var(--chart-2))",
                },
            }}>
              <RechartsBarChart data={stats.hourlyActivityChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessions" />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {Object.entries(stats.paymentMethodCounts).map(([method, count]) => (
                        <div key={method} className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{method}</span>
                            <span className="font-bold">{count}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Live PC Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {Object.entries(stats.pcStatusCounts).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground capitalize">{status.replace('_', ' ')}</span>
                            <span className="font-bold">{count}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    