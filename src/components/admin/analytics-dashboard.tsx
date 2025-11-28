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
  PieChart as RechartsPieChart,
  ScatterChart as RechartsScatterChart,
  Pie,
  Cell,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  RadialBar,
  RadialBarChart,
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

const PIE_CHART_COLORS = {
  GCash: 'hsl(var(--chart-1))',
  Maya: 'hsl(var(--chart-2))',
  'QR Code': 'hsl(var(--chart-3))',
};

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export function AnalyticsDashboard({ pcs, historicalSessions, pricingTiers }: AnalyticsDashboardProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });

  const stats = useMemo(() => {
    const allSessions = [...historicalSessions, ...pcs.filter(pc => (pc.status === 'in_use' || pc.status === 'pending_payment'))];

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
    const totalMinutes = filteredSessions.reduce((acc, pc) => acc + (pc.session_duration || 0), 0);
    const averageSessionMinutes = totalSessions > 0 ? totalMinutes / totalSessions : 0;
    
    // --- Pie Chart Data ---
    const paymentMethodCounts = filteredSessions.reduce((acc, pc) => {
        if (pc.paymentMethod) {
            acc[pc.paymentMethod] = (acc[pc.paymentMethod] || 0) + 1;
        }
        return acc;
    }, {} as Record<PaymentMethod, number>);

    const paymentMethodChartData = Object.entries(paymentMethodCounts).map(([name, value]) => ({
        name,
        value,
        fill: PIE_CHART_COLORS[name as PaymentMethod]
    }));

    // --- Stacked Bar Chart Data ---
    const dailyActivity = filteredSessions.reduce((acc, session) => {
        if (!session.session_start) return acc;
        const day = format(startOfDay(new Date(session.session_start)), 'yyyy-MM-dd');
        if (!acc[day]) {
            acc[day] = { date: day, GCash: 0, Maya: 0, 'QR Code': 0, total: 0 };
        }
        if(session.paymentMethod) {
            acc[day][session.paymentMethod] = (acc[day][session.paymentMethod] || 0) + 1;
        }
        acc[day].total += 1;
        return acc;
    }, {} as Record<string, { date: string, GCash: number, Maya: number, 'QR Code': number, total: number }>);
    
    const dailyActivityChartData = Object.values(dailyActivity).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // --- Scatter Plot Data ---
    const sessionTimeVsDurationData = filteredSessions.map(session => ({
        hour: session.session_start ? new Date(session.session_start).getHours() + new Date(session.session_start).getMinutes() / 60 : 0,
        duration: session.session_duration || 0,
        weekday: session.session_start ? WEEKDAY_NAMES[getDay(new Date(session.session_start))] : 'N/A'
    }));

    // --- Gauge Data ---
    const activePcPercentage = pcs.length > 0 ? (activePcsCount / pcs.length) * 100 : 0;
    const activePcGaugeData = [{ name: 'active', value: activePcPercentage, fill: 'hsl(var(--primary))' }];

    return { 
        totalRevenue, 
        activePcsCount, 
        totalSessions, 
        averageSessionMinutes, 
        totalMinutes,
        paymentMethodChartData,
        dailyActivityChartData,
        sessionTimeVsDurationData,
        activePcGaugeData,
        totalPcCount: pcs.length,
    };
  }, [pcs, historicalSessions, pricingTiers, date]);

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>Pick a date</span>)}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
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
                    <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.averageSessionMinutes.toFixed(0)} min</div>
                    <p className="text-xs text-muted-foreground">Total time: {(stats.totalMinutes / 60).toFixed(1)} hrs</p>
                </CardContent>
            </Card>
            <Card className='lg:col-span-2'>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[100px] w-full">
                        <RechartsPieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={stats.paymentMethodChartData} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} paddingAngle={2}>
                                {stats.paymentMethodChartData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} />
                        </RechartsPieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
             <Card className="col-span-full lg:col-span-5">
                <CardHeader>
                    <CardTitle>Daily Activity</CardTitle>
                    <CardDescription>Number of sessions per day, stacked by payment method.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                        <RechartsBarChart data={stats.dailyActivityChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => format(new Date(value), 'MMM d')} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <ChartTooltip cursor={true} content={<ChartTooltipContent labelFormatter={(label) => format(new Date(label), 'PPP')} />} />
                            <Legend />
                            <Bar dataKey="GCash" stackId="a" fill={PIE_CHART_COLORS.GCash} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Maya" stackId="a" fill={PIE_CHART_COLORS.Maya} />
                            <Bar dataKey="QR Code" stackId="a" fill={PIE_CHART_COLORS['QR Code']} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="col-span-full lg:col-span-2">
                <CardHeader className='pb-2'>
                    <CardTitle>Currently Active PCs</CardTitle>
                    <CardDescription>{stats.activePcsCount} of {stats.totalPcCount} PCs are in use.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-0">
                    <ChartContainer config={{}} className="h-[300px] w-full">
                        <RadialBarChart 
                            data={stats.activePcGaugeData}
                            startAngle={90}
                            endAngle={-270}
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={30}
                        >
                            <RadialBar background dataKey="value" cornerRadius={8} />
                            <g>
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-4xl font-bold">
                                    {stats.activePcsCount}
                                </text>
                                <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">
                                    In Use
                                </text>
                            </g>
                        </RadialBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>


        <Card>
            <CardHeader>
                <CardTitle>Session Analysis</CardTitle>
                <CardDescription>Session duration vs. time of day. Each point is a session.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[350px] w-full">
                    <RechartsScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis 
                            type="number" 
                            dataKey="hour" 
                            name="Time of Day" 
                            unit=":00" 
                            domain={[0, 24]}
                            tickCount={12}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                        />
                        <YAxis 
                            type="number" 
                            dataKey="duration" 
                            name="Duration" 
                            unit=" min"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                        />
                        <ChartTooltip 
                            cursor={{ strokeDasharray: '3 3' }} 
                            content={<ChartTooltipContent labelFormatter={(value, payload) => `Day: ${payload[0]?.payload.weekday}`} />}
                        />
                         <Legend />
                        <Scatter name="Session" data={stats.sessionTimeVsDurationData} fill="hsl(var(--primary))" opacity={0.6} />
                    </RechartsScatterChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}

    