'use client';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';

type WelcomeDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pcName: string;
};

export function WelcomeDialog({ isOpen, onOpenChange, pcName }: WelcomeDialogProps) {
  const router = useRouter();

  const handleStartSession = () => {
    onOpenChange(false);
    router.push(`/payment?pc=${pcName}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <PartyPopper className="h-8 w-8 text-accent" />
            Welcome!
          </DialogTitle>
          <DialogDescription>
            You've selected <span className="font-bold text-accent">{pcName}</span>. Get ready to start your session.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Click the button below to proceed with selecting your session duration and payment. Enjoy your time!
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleStartSession}>Start Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
