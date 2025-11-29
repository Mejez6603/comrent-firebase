

'use client';

import { Suspense, useState, useMemo, useEffect, useCallback } from 'react';
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
import { ArrowLeft, Clock, Mail, User, CheckCircle, Loader, Send, Hourglass, PlusCircle, AlertCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PC, PaymentMethod, PricingTier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { add } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { PaymentHelpPopover } from '@/components/payment-help-popover';
import { useAlarm } from '@/hooks/use-alarm';
import { SessionEndedDialog } from '@/components/session-ended-dialog';
import { ChatProvider, useChat } from '@/hooks/use-chat';
import { ChatButton } from '@/components/chat-button';

type PaymentStep = 'selection' | 'pending_approval' | 'in_session' | 'session_ended';

const paymentMethodColors: Record<PaymentMethod, string> = {
    GCash: 'bg-blue-500',
    Maya: 'bg-green-900',
    'QR Code': 'bg-red-600',
};

function PaymentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { pc, setPc, pcName } = useChat();

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

  const [isSessionEndModalOpen, setIsSessionEndModalOpen] = useState(false);
  const { startAlarm, stopAlarm } = useAlarm();


  const selectedDuration = useMemo(
    () => pricingTiers.find(opt => opt.value === duration),
    [duration, pricingTiers]
  );
  
  const fetchInitialData = useCallback(async () => {
    if (!pcName) return;

    try {
        const pricingRes = await fetch('/api/pricing');
        if (!pricingRes.ok) throw new Error('Failed to fetch pricing');
        const pricingData: PricingTier[] = await pricingRes.json();
        const sortedPricingData = pricingData.sort((a, b) => Number(a.value) - Number(b.value));
        setPricingTiers(sortedPricingData);
        if (sortedPricingData.length > 0) {
            setDuration(sortedPricingData[0].value);
        }

        const pcResponse = await fetch('/api/pc-status');
        const allPcs: PC[] = await pcResponse.json();
        const currentPc = allPcs.find(p => p.name === pcName);
        
        if (currentPc) {
            if (currentPc.status === 'available') {
                const reserveResponse = await fetch('/api/pc-status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentPc.id, newStatus: 'pending_payment' }),
                });
                if (reserveResponse.ok) {
                    const reservedPc = await reserveResponse.json();
                    setPc(reservedPc);
                } else {
                    throw new Error('Failed to reserve PC');
                }
            } else {
                 const validInitialStatuses = ['pending_payment', 'pending_approval', 'in_use', 'time_up'];
                 if (validInitialStatuses.includes(currentPc.status)) {
                    setPc(currentPc);
                 } else {
                    toast({ variant: "destructive", title: "PC Not Available", description: `${pcName} is currently not available for rent.` });
                    router.push('/');
                 }
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: "PC not found." });
            router.push('/');
        }
    } catch (error) {
        console.error("Failed to fetch initial data", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load payment page." });
        router.push('/');
    }
  }, [pcName, router, toast, setPc]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  useEffect(() => {
    if (!pc) return;
  
    const storedUserDetailsRaw = localStorage.getItem(`session-details-${pc.name}`);
    const storedUserDetails = storedUserDetailsRaw ? JSON.parse(storedUserDetailsRaw) : null;
  
    let newStep: PaymentStep | null = null;
    let newSessionEndTime: Date | null = null;
  
    if (pc.status === 'in_use' && pc.session_start && pc.session_duration) {
      if (
        storedUserDetails &&
        (storedUserDetails.user === pc.user || storedUserDetails.user === '') &&
        storedUserDetails.duration === pc.session_duration
      ) {
        newStep = 'in_session';
        const startTime = new Date(pc.session_start);
        newSessionEndTime = add(startTime, { minutes: pc.session_duration });
      }
    } else if (pc.status === 'time_up') {
      newStep = 'session_ended';
      setTimeRemaining('00:00:00');
      startAlarm();
      setIsSessionEndModalOpen(true);
    } else if (pc.status === 'pending_approval') {
      if (
        storedUserDetails &&
        (storedUserDetails.user === pc.user || storedUserDetails.user === '') &&
        storedUserDetails.duration === pc.session_duration
      ) {
        newStep = 'pending_approval';
      }
    } else if (pc.status === 'pending_payment') {
      newStep = 'selection';
    } else if (pc.status === 'available' && ['pending_approval', 'pending_payment'].includes(step)) {
      localStorage.removeItem(`session-details-${pc.name}`);
      toast({ title: 'Request Cancelled', description: 'Your rental request was cancelled by an admin.' });
      router.push('/');
      return;
    }
  
    if (newStep && newStep !== step) {
      setStep(newStep);
    }
  
    if (newSessionEndTime) {
      // Check if sessionEndTime is null or different before setting
      if (!sessionEndTime || newSessionEndTime.getTime() !== sessionEndTime.getTime()) {
        setSessionEndTime(newSessionEndTime);
      }
    }
  }, [pc, step, router, toast, startAlarm, sessionEndTime]);


  useEffect(() => {
    if (step !== 'in_session' || !sessionEndTime || !pc) return;

    const timerId = setInterval(async () => {
      const now = new Date();
      const endTime = new Date(sessionEndTime);
      const totalSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);

      if (totalSeconds <= 0) {
        setTimeRemaining('00:00:00');
        clearInterval(timerId);
        
        try {
            await fetch('/api/pc-status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pc.id, newStatus: 'time_up' })
            });
        } catch (error) {
            console.error("Failed to update status to time_up", error);
        }
        return;
      }
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeRemaining(formattedTime);
      
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
  }, [step, sessionEndTime, toast, notified, pc]);


  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const handleSendPayment = async () => {
    if (!pc || !selectedDuration || !selectedPaymentMethod) return;

    setIsProcessing(true);
    try {
        const sessionDetails = {
            user: name,
            email: email,
            duration: parseInt(selectedDuration.value),
        };
        localStorage.setItem(`session-details-${pc.name}`, JSON.stringify(sessionDetails));

        const response = await fetch('/api/pc-status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: pc.id, 
                newStatus: 'pending_approval',
                duration: sessionDetails.duration,
                user: sessionDetails.user,
                email: sessionDetails.email,
                paymentMethod: selectedPaymentMethod,
            })
        });

        if (!response.ok) throw new Error('Failed to send payment notification');
        
        const updatedPc = await response.json();
        setPc(updatedPc);
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

  const handleCancelApproval = async () => {
    if (!pc) return;
    setIsProcessing(true);
    try {
        const response = await fetch('/api/pc-status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: pc.id,
                newStatus: 'available',
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to cancel session.');
        }

        localStorage.removeItem(`session-details-${pc.name}`);
        
        router.push('/');
        toast({
            title: 'Session Cancelled',
            description: 'Your rental request has been cancelled.',
        });
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not cancel the session.',
        });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleExtend = () => {
    toast({ title: "Extend Session", description: "This feature is coming soon!"})
  }

  const handleAcknowledgeSessionEnd = () => {
    stopAlarm();
    setIsSessionEndModalOpen(false);
    localStorage.removeItem(`session-details-${pc?.name}`);
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
                        <p className="text-muted-foreground">Your time on {pcName} has finished. Please settle your payment.</p>
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
                    </div>
                </div>
            )
        case 'pending_approval':
            return (
                <div className="text-center space-y-4 animate-in fade-in-50">
                    <Hourglass className="h-16 w-16 text-accent mx-auto animate-spin-slow" />
                    <h2 className="text-2xl font-bold">Waiting for Approval</h2>
                    <p className="text-muted-foreground">An admin has been notified. Your session will start shortly.</p>
                    <p className='text-sm pt-4'>You are renting <span className='font-bold text-accent'>{pcName}</span> for <span className='font-bold text-accent'>{pricingTiers.find(p => p.value === String(pc?.session_duration))?.label}</span>.</p>
                     <div className="pt-6">
                        <Button variant="ghost" onClick={handleCancelApproval} disabled={isProcessing}>
                            {isProcessing ? <Loader className="animate-spin mr-2"/> : <XCircle className="mr-2" />}
                            Cancel Request
                        </Button>
                    </div>
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
                                    <Button size="lg" className="font-bold bg-blue-500 hover:bg-blue-600" onClick={() => handlePaymentMethodSelect('GCash')} disabled={!duration}>
                                        GCash
                                    </Button>
                                    <Button size="lg" className="font-bold bg-green-800 hover:bg-green-900" onClick={() => handlePaymentMethodSelect('Maya')} disabled={!duration}>
                                        Maya
                                    </Button>
                                    <Button size="lg" className="font-bold bg-red-600 hover:bg-red-700" onClick={() => handlePaymentMethodSelect('QR Code')} disabled={!duration}>
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
    <>
        <SessionEndedDialog
            isOpen={isSessionEndModalOpen}
            onAcknowledge={handleAcknowledgeSessionEnd}
        />
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
            {pricingTiers.length > 0 && pc ? renderContent() : <div className="flex justify-center items-center h-48"><Loader className="h-8 w-8 animate-spin" /></div>}
        </CardContent>
        {(step === 'selection') && (
            <CardFooter className="flex flex-col gap-4 px-8 pb-8 mt-4">
                {step === 'selection' && !selectedPaymentMethod && <Separator className="my-4" />}
                {step === 'selection' && 
                    <Button asChild variant="ghost" className="w-full" disabled={isProcessing}>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel and Go Back
                        </Link>
                    </Button>
                }
            </CardFooter>
        )}
        </Card>
    </>
  );
}

function PaymentPageContent() {
    return (
        <ChatProvider>
            <PaymentForm />
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-4">
                <ChatButton />
                <PaymentHelpPopover />
            </div>
        </ChatProvider>
    );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Suspense fallback={<Card className="w-full max-w-lg h-[620px]"><CardContent><div className="animate-pulse rounded-md bg-muted h-full w-full"></div></CardContent></Card>}>
        <PaymentPageContent />
      </Suspense>
    </main>
  );
}
