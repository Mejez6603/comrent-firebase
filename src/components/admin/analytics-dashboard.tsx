'use client';
import { useMemo, useState } from 'react';
import type { PC, PricingTier, PCStatus } from '@/lib/types';
import { Users, DollarSign, Clock, Computer, Calendar as CalendarIcon, PieChart as PieChartIcon, BarChart2, Briefcase, Coffee, TrendingUp, Tag, Percent, ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart as RechartsBarChart,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Cell,
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


const PIE_CHART_COLORS = {
    'GCash': 'hsl(var(--chart-1))',
    'Maya': 'hsl(var(--chart-2))',
    'QR Code': 'hsl(var(--chart-3))',
    
    'available': 'hsl(var(--status-online))',
    'in_use': 'hsl(var(--status-using))',
    'pending_payment': 'hsl(var(--status-pending))',
    'pending_approval': 'hsl(var(--chart-4))',
    'maintenance': '#808080',
    'unavailable': 'hsl(var(--status-unavailable))',
    'time_up': 'hsl(var(--destructive))',
};

const DURATION_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(225 52% 30%)',
    'hsl(273 59% 45%)',
]

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't render label for small slices

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const DiffIndicator = ({ value }: { value: number }) => {
    if (value === 0 || !isFinite(value)) {
        return <span className="text-muted-foreground">-</span>;
    }
    const isPositive = value > 0;
    return (
        <span className={cn('flex items-center text-xs font-semibold', isPositive ? 'text-green-500' : 'text-red-500')}>
            {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
            {Math.abs(value).toFixed(1)}%
        </span>
    );
}

export function AnalyticsDashboard({ pcs, historicalSessions, pricingTiers }: AnalyticsDashboardProps) {
    const [primaryDate, setPrimaryDate] = useState<DateRange | undefined>({
        from: startOfDay(subMonths(new Date(), 1)),
        to: new Date(),
    });

    const allSessions = useMemo(() => {
        return [...historicalSessions, ...pcs.filter(pc => pc.status === 'in_use' || pc.status === 'pending_payment')];
    }, [historicalSessions, pcs]);


    const filteredSessions = useMemo(() => {
        if (!primaryDate?.from) return [];
        const from = startOfDay(primaryDate.from);
        const to = primaryDate.to ? startOfDay(addDays(primaryDate.to, 1)) : startOfDay(addDays(new Date(), 1));
        return allSessions.filter(pc => {
            if (!pc.session_start) return false;
            const sessionDate = new Date(pc.session_start);
            return sessionDate >= from && sessionDate < to;
        });
    }, [allSessions, primaryDate]);

    const mainStats = useMemo(() => {
        const totalRevenue = filteredSessions.reduce((acc, pc) => {
            const durationInfo = pricingTiers.find(d => d.value === String(pc.session_duration));
            return acc + (durationInfo?.price || 0);
        }, 0);
        
        const totalSessions = filteredSessions.length;
        const averageSessionMinutes = totalSessions > 0 ? filteredSessions.reduce((acc, pc) => acc + (pc.session_duration || 0), 0) / totalSessions : 0;
        const averageRevenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
        
        return { totalRevenue, totalSessions, averageSessionMinutes, averageRevenuePerSession };
    }, [filteredSessions, pricingTiers]);


    const monthlyPerformance = useMemo(() => {
        const performance = filteredSessions.reduce((acc, session) => {
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
        
        return Object.values(performance).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    }, [filteredSessions, pricingTiers]);


    const detailedAnalytics = useMemo(() => {
        const paymentDistribution = filteredSessions.reduce((acc, session) => {
            if (session.paymentMethod) {
                acc[session.paymentMethod] = (acc[session.paymentMethod] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const peakHours = filteredSessions.reduce((acc, session) => {
            if (session.session_start) {
                const hour = new Date(session.session_start).getHours();
                acc[hour] = (acc[hour] || 0) + 1;
            }
            return acc;
        }, {} as Record<number, number>);

        const dayType = filteredSessions.reduce((acc, session) => {
            if (session.session_start) {
                const day = new Date(session.session_start).getDay();
                const type = (day === 0 || day === 6) ? 'weekend' : 'weekday';
                acc[type] = (acc[type] || 0) + 1;
            }
            return acc;
        }, { weekday: 0, weekend: 0});
        
        const pcUsageByDuration = filteredSessions.reduce((acc, session) => {
            const durationLabel = pricingTiers.find(p => p.value === String(session.session_duration))?.label || 'Unknown';
            
            if (!acc[session.name]) {
                acc[session.name] = { name: session.name };
            }
            acc[session.name][durationLabel] = (acc[session.name][durationLabel] || 0) + 1;
            
            return acc;
        }, {} as Record<string, { name: string, [durationLabel: string]: number | string }>);
        
        const peakHoursData = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i.toString().padStart(2, '0')}:00`,
            sessions: peakHours[i] || 0,
        }));

        const paymentDistributionData = Object.entries(paymentDistribution).map(([name, value]) => ({ name, value }));

        return { peakHoursData, paymentDistributionData, dayType, pcUsageByDurationData: Object.values(pcUsageByDuration) };
    }, [filteredSessions, pricingTiers]);


    const liveStatusDistribution = useMemo(() => {
        const statusCounts = pcs.reduce((acc, pc) => {
            acc[pc.status] = (acc[pc.status] || 0) + 1;
            return acc;
        }, {} as Record<PCStatus, number>);

        return Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })) as { name: string; value: number }[];
    }, [pcs]);

    const activePcsCount = pcs.filter(pc => pc.status === 'in_use').length;

    const chartConfig = {
        revenue: { label: "Revenue (₱)", color: "hsl(var(--chart-1))" },
        sessions: { label: "Sessions", color: "hsl(var(--chart-2))" },
    };

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
                            !primaryDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {primaryDate?.from ? (
                                primaryDate.to ? (
                                <>
                                {format(primaryDate.from, "LLL dd, y")} - {format(primaryDate.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(primaryDate.from, "LLL dd, y")
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
                            defaultMonth={primaryDate?.from}
                            selected={primaryDate}
                            onSelect={setPrimaryDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{mainStats.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">for selected period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{mainStats.totalSessions}</div>
                        <p className="text-xs text-muted-foreground">for selected period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Revenue / Session</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{mainStats.averageRevenuePerSession.toFixed(2)}</div>
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
                        <p className="text-xs text-muted-foreground">for selected period</p>
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
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Monthly Performance</CardTitle>
                    <CardDescription>Revenue and sessions for each month in the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <RechartsBarChart data={monthlyPerformance} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5" />Peak Hours</CardTitle>
                        <CardDescription>Busiest hours in the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{ sessions: { label: 'Sessions', color: 'hsl(var(--chart-1))'}}} className="h-[250px] w-full">
                            <RechartsBarChart data={detailedAnalytics.peakHoursData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="sessions" fill="var(--color-sessions)" radius={4} />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Coffee className="mr-2 h-5 w-5" />Day Type Activity</CardTitle>
                            <CardDescription>Session counts for weekdays vs. weekends.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-lg bg-muted">
                                <Briefcase className="h-6 w-6 mx-auto text-muted-foreground" />
                                <p className="text-2xl font-bold mt-2">{detailedAnalytics.dayType.weekday}</p>
                                <p className="text-sm text-muted-foreground">Weekday Sessions</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted">
                                <Users className="h-6 w-6 mx-auto text-muted-foreground" />
                                <p className="text-2xl font-bold mt-2">{detailedAnalytics.dayType.weekend}</p>
                                <p className="text-sm text-muted-foreground">Weekend Sessions</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5" />Payment Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={{}} className="h-[130px] w-full">
                            <RechartsPieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={detailedAnalytics.paymentDistributionData} dataKey="value" nameKey="name" innerRadius={30} strokeWidth={2} labelLine={false} label={<CustomPieLabel />}>
                                        {detailedAnalytics.paymentDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[entry.name as keyof typeof PIE_CHART_COLORS] || '#8884d8'} />
                                        ))}
                                    </Pie>
                                    <Legend iconSize={10} />
                            </RechartsPieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Computer className="mr-2 h-5 w-5" />Live PC Status</CardTitle>
                        <CardDescription>Current distribution of PC statuses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[250px] w-full">
                            <RechartsPieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={liveStatusDistribution} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={2}>
                                        {liveStatusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[entry.name.replace(/ /g,'_') as keyof typeof PIE_CHART_COLORS] || '#8884d8'} />
                                        ))}
                                    </Pie>
                                    <Legend />
                            </RechartsPieChart>
                            </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Computer className="mr-2 h-5 w-5" />Session Duration per PC</CardTitle>
                    <CardDescription>Breakdown of popular session times on each computer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                        <RechartsBarChart data={detailedAnalytics.pcUsageByDurationData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Legend />
                            {pricingTiers.map((tier, i) => (
                                <Bar 
                                    key={tier.value}
                                    dataKey={tier.label}
                                    fill={DURATION_COLORS[i % DURATION_COLORS.length]}
                                    radius={4} 
                                    stackId="a"
                                />
                            ))}
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
