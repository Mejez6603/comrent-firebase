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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CreditCard, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const durationOptions = [
  { value: '30', label: '30 minutes', price: 5 },
  { value: '60', label: '1 hour', price: 10 },
  { value: '120', label: '2 hours', price: 18 },
  { value: '180', label: '3 hours', price: 25 },
];


function PaymentForm() {
  const searchParams = useSearchParams();
  const pcName = searchParams.get('pc');
  const router = useRouter();
  const { toast } = useToast();
  const [duration, setDuration] = useState(durationOptions[1].value);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedDuration = useMemo(() => 
    durationOptions.find(opt => opt.value === duration),
    [duration]
  );

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate a payment process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsProcessing(false);

    toast({
        title: "Payment Successful!",
        description: `Your session on ${pcName} has started.`,
    });

    router.push('/');
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

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Start Your Session</CardTitle>
        <CardDescription>
          You are renting <span className="font-bold text-accent">{pcName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="duration" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Select Duration
          </Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration" className="w-full">
              <SelectValue placeholder="Select rental time" />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="text-4xl font-bold">${selectedDuration?.price.toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button size="lg" className="w-full font-bold" onClick={handlePayment} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Proceed to Payment
            </>
          )}
        </Button>
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
      <Suspense fallback={<Card className="w-full max-w-md h-[480px]"><CardContent><div className="animate-pulse rounded-md bg-muted h-full w-full"></div></CardContent></Card>}>
        <PaymentForm />
      </Suspense>
    </main>
  );
}
