'use client';

import { Suspense, useState, useMemo } from 'react';
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
import { ArrowLeft, Clock, QrCode, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const durationOptions = [
  { value: '30', label: '30 minutes', price: 30 },
  { value: '60', label: '1 hour', price: 50 },
  { value: '120', label: '2 hours', price: 90 },
  { value: '180', label: '3 hours', price: 120 },
];

function PaymentForm() {
  const searchParams = useSearchParams();
  const pcName = searchParams.get('pc');
  const router = useRouter();
  const { toast } = useToast();
  const [duration, setDuration] = useState(durationOptions[1].value);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedDuration = useMemo(
    () => durationOptions.find(opt => opt.value === duration),
    [duration]
  );

  const handlePayment = async (method: string) => {
    setIsProcessing(true);
    // Simulate a payment process
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsProcessing(false);

    toast({
      title: 'Payment Successful!',
      description: `Paid via ${method}. Your session on ${pcName} has started.`,
    });

    if (name && email) {
        // In a real app, you'd send the invoice here.
        console.log(`Sending invoice to ${name} at ${email}`);
    }

    router.push('/');
  };

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

  return (
    <Card className="w-full max-w-lg shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Start Your Session</CardTitle>
        <CardDescription>
          You are renting <span className="font-bold text-accent">{pcName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-8">
        <div className="space-y-2">
          <Label htmlFor="duration" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Select Duration
          </Label>
          <Select value={duration} onValueChange={setDuration} disabled={isProcessing}>
            <SelectTrigger id="duration" className="w-full">
              <SelectValue placeholder="Select rental time" />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map(opt => (
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
                    <Input id="name" placeholder="Your Name" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing} />
                </div>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="Your Email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isProcessing} />
                </div>
            </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="text-5xl font-bold">₱{selectedDuration?.price.toFixed(2)}</p>
        </div>

        <div className="space-y-3">
             <Label className="text-sm text-center block">Select Payment Method</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button size="lg" className="font-bold" onClick={() => handlePayment('GCash')} disabled={isProcessing}>
                    {isProcessing ? '...' : 'GCash'}
                </Button>
                <Button size="lg" className="font-bold" onClick={() => handlePayment('Maya')} disabled={isProcessing}>
                    {isProcessing ? '...' : 'Maya'}
                </Button>
                <Button size="lg" className="font-bold" onClick={() => handlePayment('QR Code')} disabled={isProcessing}>
                    <QrCode className="mr-2 h-5 w-5" />
                    {isProcessing ? '...' : 'QR'}
                </Button>
            </div>
        </div>
        

      </CardContent>
      <CardFooter className="flex flex-col gap-4 px-8 pb-8">
        <Button asChild variant="ghost" className="w-full" disabled={isProcessing}>
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
      <Suspense fallback={<Card className="w-full max-w-lg h-[600px]"><CardContent><div className="animate-pulse rounded-md bg-muted h-full w-full"></div></CardContent></Card>}>
        <PaymentForm />
      </Suspense>
    </main>
  );
}
