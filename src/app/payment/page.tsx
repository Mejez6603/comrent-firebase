'use client';

import { Suspense } from 'react';
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

function PaymentForm() {
  const searchParams = useSearchParams();
  const pcName = searchParams.get('pc');

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
          <Select defaultValue="60">
            <SelectTrigger id="duration" className="w-full">
              <SelectValue placeholder="Select rental time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="180">3 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="text-4xl font-bold">$10.00</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button size="lg" className="w-full font-bold">
          <CreditCard className="mr-2 h-5 w-5" />
          Proceed to Payment
        </Button>
        <Button asChild variant="ghost" className="w-full">
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
      <Suspense fallback={<Card className="w-full max-w-md h-[450px]"><CardContent><div className="animate-pulse rounded-md bg-muted h-full w-full"></div></CardContent></Card>}>
        <PaymentForm />
      </Suspense>
    </main>
  );
}
