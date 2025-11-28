'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Clock, Mail, User, CheckCircle, Loader, Send, Hourglass, PlusCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PC, PaymentMethod, PricingTier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { add } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { PaymentHelpPopover } from '@/components/payment-help-popover';

type PaymentStep = 'selection' | 'pending_approval' | 'in_session' | 'session_ended';

const paymentMethodColors: Record<PaymentMethod, string> = {
    GCash: 'bg-blue-500',
    Maya: 'bg-green-900',
    'QR Code': 'bg-red-600',
};

function PaymentForm() {
  const searchParams = useSearchParams();
  const pcName = searchParams.get('pc');
  const router = useRouter();
  const { toast } = useToast();

  const [pc, setPc] = useState<PC | null>(null);
  const [duration, setDuration] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<PaymentStep>('selection');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [notified, setNotified] = useState<Record<number, boolean>>({});

  const selectedDuration = useMemo(
    () => pricingTiers.find(opt => opt.value === duration),
    [duration, pricingTiers]
  );
  
  useEffect(() => {
    async function fetchInitialData() {
        if (!pcName) return;

        try {
            // Fetch pricing tiers
            const pricingRes = await fetch('/api/pricing');
            if (!pricingRes.ok) throw new Error('Failed to fetch pricing');
            const pricingData: PricingTier[] = await pricingRes.json();
            setPricingTiers(pricingData);
            if (pricingData.length > 0) {
                setDuration(pricingData[0].value);
            }

            // Fetch PC data
            const res = await fetch('/api/pc-status');
            const allPcs: PC[] = await res.json();
            const currentPc = allPcs.find(p => p.name === pcName);
            if (currentPc) {
                setPc(currentPc);
            } else {
                toast({ variant: "destructive", title: "Error", description: "PC not found." });
                router.push('/');
            }
        } catch (error) {
            console.error("Failed to fetch initial data", error)
            toast({ variant: "destructive", title: "Error", description: "Could not fetch page data." });
        }
    }
    fetchInitialData();
  }, [pcName, router, toast]);

  useEffect(() => {
    if (!pc || step !== 'pending_approval') return;

    // Poll for status changes
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/pc-status?id=${pc.id}`);
        const updatedPc: PC = await response.json();
        setPc(updatedPc);

        if (updatedPc.status === 'in_use' && updatedPc.session_start && updatedPc.session_duration) {
            setStep('in_session');
            const startTime = new Date(updatedPc.session_start);
            const endTime = add(startTime, { minutes: updatedPc.session_duration });
            setSessionEndTime(endTime);
            clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Failed to poll PC status:', error);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [step, pc]);

  useEffect(() => {
    if (step !== 'in_session' || !sessionEndTime) return;

    const timerId = setInterval(() => {
      const now = new Date();
      const endTime = new Date(sessionEndTime);
      const totalSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);

      if (totalSeconds <= 0) {
        setTimeRemaining('00:00:00');
        clearInterval(timerId);
        setStep('session_ended');
        toast({
          title: "Session Ended",
          description: "Your time is up. Would you like to extend your session?",
          duration: 20000,
          action: (
            <Button onClick={handleExtend}><PlusCircle className="mr-2"/>Extend</Button>
          )
        });
        return;
      }
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeRemaining(formattedTime);
      
      // Time-based notifications
      const remainingMinutes = Math.ceil(totalSeconds / 60);
      
      if (remainingMinutes <= 10 && !notified[10]) {
        toast({ title: "10 Minutes Remaining", description: "Your session is ending soon."});
        setNotified(prev => ({...prev, 10: true}));
      }
      if (remainingMinutes <= 5 && !notified[5]) {
        toast({ title: "5 Minutes Remaining", description: "Your session is ending soon."});
        setNotified(prev => ({...prev, 5: true}));
      }
      if (remainingMinutes <= 1 && !notified[1]) {
        toast({ variant: "destructive", title: "1 Minute Remaining!", description: "Your session will end in one minute."});
        setNotified(prev => ({...prev, 1: true}));
      }

    }, 1000);

    return () => clearInterval(timerId);
  }, [step, sessionEndTime, toast, notified]);


  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const handleSendPayment = async () => {
    if (!pc || !selectedDuration || !selectedPaymentMethod) return;

    setIsProcessing(true);
    try {
        const response = await fetch('/api/pc-status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: pc.id, 
                newStatus: 'pending_approval',
                duration: parseInt(selectedDuration.value),
                user: name,
                email: email,
                paymentMethod: selectedPaymentMethod,
            })
        });

        if (!response.ok) throw new Error('Failed to send payment notification');
        
        setStep('pending_approval');
        toast({
            title: 'Payment Sent!',
            description: 'Your payment has been sent for approval. Please wait for the admin.',
        });

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not notify admin.' });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleExtend = () => {
    toast({ title: "Extend Session", description: "This feature is coming soon!"})
  }

  if (!pcName) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>No PC was selected for rental.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please go back to the main page and select an available PC.</p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Overview
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const renderContent = () => {
    switch (step) {
        case 'session_ended':
            return (
                <div className="text-center space-y-6 animate-in fade-in-50">
                    <AlertCircle className="h-20 w-20 text-destructive mx-auto" />
                    <div>
                        <h2 className="text-2xl font-bold">Session Ended</h2>
                        <p className="text-muted-foreground">Your time on {pcName} has finished.</p>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <Button size="lg" onClick={handleExtend}>
                            <PlusCircle className="mr-2"/> Extend Time
                        </Button>
                        <Button size="lg" asChild variant="secondary">
                           <Link href="/">Back to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            )
        case 'in_session':
            return (
                <div className="text-center space-y-6 animate-in fade-in-50">
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                    <div>
                        <h2 className="text-2xl font-bold">Session Started!</h2>
                        <p className="text-muted-foreground">Enjoy your time on {pcName}.</p>
                    </div>
                    <div className='space-y-2'>
                        <p className="text-sm text-muted-foreground">Time Remaining</p>
                        <p className="text-5xl font-bold tracking-tighter">{timeRemaining}</p>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <Button size="lg" onClick={handleExtend}>
                            <PlusCircle className="mr-2"/> Extend Time
                        </Button>
                        <Button size="lg" asChild variant="secondary">
                           <Link href="/">Back to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            )
        case 'pending_approval':
            return (
                <div className="text-center space-y-4 animate-in fade-in-50">
                    <Hourglass className="h-16 w-16 text-accent mx-auto animate-spin-slow" />
                    <h2 className="text-2xl font-bold">Waiting for Approval</h2>
                    <p className="text-muted-foreground">An admin has been notified. Your session will start shortly.</p>
                    <p className='text-sm pt-4'>You are renting <span className='font-bold text-accent'>{pcName}</span> for <span className='font-bold text-accent'>{selectedDuration?.label}</span>.</p>
                </div>
            )
        case 'selection':
        default:
            return (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <div className='space-y-6 animate-in fade-in-50'>
                        <div className="space-y-2">
                            <Label htmlFor="duration" className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            Select Duration
                            </Label>
                            <Select value={duration} onValueChange={setDuration} disabled={!!selectedPaymentMethod}>
                            <SelectTrigger id="duration" className="w-full">
                                <SelectValue placeholder="Select rental time" />
                            </SelectTrigger>
                            <SelectContent>
                                {pricingTiers.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-4">
                            <Label className="text-sm text-muted-foreground">Email Invoice (Optional)</Label>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="name" placeholder="Your Name" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} disabled={!!selectedPaymentMethod} />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" type="email" placeholder="Your Email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!selectedPaymentMethod}/>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Cost</p>
                            <p className="text-5xl font-bold">₱{selectedDuration?.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex flex-col justify-between space-y-6">
                        {selectedPaymentMethod ? (
                             <div className="space-y-6 animate-in fade-in-50">
                                <div className='text-center'>
                                    <p className='text-muted-foreground'>Scan to pay via <span className='font-bold'>{selectedPaymentMethod}</span></p>
                                    <p className="text-4xl font-bold pt-2">₱{selectedDuration?.price.toFixed(2)}</p>
                                </div>
                                <div className={cn("w-64 h-64 mx-auto rounded-lg shadow-inner flex items-center justify-center", paymentMethodColors[selectedPaymentMethod])}>
                                    <p className='text-white/80 font-mono text-sm'>[QR CODE]</p>
                                </div>
                                <Button size="lg" className="w-full font-bold" onClick={handleSendPayment} disabled={isProcessing}>
                                    {isProcessing ? <Loader className='animate-spin mr-2'/> : <Send className="mr-2" />}
                                    {isProcessing ? 'Sending...' : 'I Have Sent The Payment'}
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => setSelectedPaymentMethod(null)}>Change Payment Method</Button>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in-50">
                                <Label className="text-sm text-center block">Select Payment Method</Label>
                                <div className="grid grid-cols-1 gap-3">
                                    <Button size="lg" className="font-bold bg-blue-500 hover:bg-blue-600" onClick={() => handlePaymentMethodSelect('GCash')}>
                                        GCash
                                    </Button>
                                    <Button size="lg" className="font-bold bg-green-800 hover:bg-green-900" onClick={() => handlePaymentMethodSelect('Maya')}>
                                        Maya
                                    </Button>
                                    <Button size="lg" className="font-bold bg-red-600 hover:bg-red-700" onClick={() => handlePaymentMethodSelect('QR Code')}>
                                        QR Code
                                    </Button>
                                </div>
                            </div>
                        )}
                       
                    </div>
                </div>
            )
    }
  }


  return (
    <Card className="w-full max-w-4xl shadow-2xl min-h-[620px]">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">
            {step === 'in_session' ? 'Session Active' : 'Start Your Session'}
        </CardTitle>
        <CardDescription>
          You are renting <span className="font-bold text-accent">{pcName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-8">
        {pricingTiers.length > 0 ? renderContent() : <div className="flex justify-center items-center h-48"><Loader className="h-8 w-8 animate-spin" /></div>}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 px-8 pb-8 mt-4">
       {(step === 'selection' && !selectedPaymentMethod) && <Separator className="my-4" />}
        <Button asChild variant="ghost" className="w-full" disabled={isProcessing || step === 'pending_approval' || step === 'in_session'}>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel and Go Back
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Suspense fallback={<Card className="w-full max-w-lg h-[620px]"><CardContent><div className="animate-pulse rounded-md bg-muted h-full w-full"></div></CardContent></Card>}>
        <PaymentForm />
      </Suspense>
      <PaymentHelpPopover />
    </main>
  );
}
