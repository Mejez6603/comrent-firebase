'use client';
import type { PC, PricingTier } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { generateInvoiceEmail, sendGeneratedEmail, GenerateInvoiceEmailOutput } from '@/ai/flows/send-invoice-email';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Loader, Send, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type EmailInvoiceManagementProps = { 
    pcs: PC[];
    pricingTiers: PricingTier[];
    addAuditLog: (log: string) => void;
}

export function EmailInvoiceManagement({ pcs, pricingTiers, addAuditLog }: EmailInvoiceManagementProps) {
  const [invoicePc, setInvoicePc] = useState<PC | null>(null);
  const [invoiceContent, setInvoiceContent] = useState<GenerateInvoiceEmailOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();

  const eligiblePcs = pcs.filter(pc => 
    pc.email && 
    pc.user && 
    pc.session_duration && 
    ['in_use', 'time_up', 'pending_payment'].includes(pc.status)
  );

  const handleOpenInvoiceDialog = async (pc: PC) => {
    if (!pc.email || !pc.session_duration || !pc.user) return;
    
    setInvoicePc(pc);
    setIsGenerating(true);

    const durationInfo = pricingTiers.find(d => d.value === String(pc.session_duration));
    if (!durationInfo) {
        toast({variant: "destructive", title: "Error", description: "Invalid session duration."});
        setIsGenerating(false);
        return;
    };

    try {
        const content = await generateInvoiceEmail({
            customerName: pc.user,
            pcName: pc.name,
            duration: durationInfo.label,
            amount: `₱${durationInfo.price.toFixed(2)}`,
            companyName: 'ComRent',
        });
        setInvoiceContent(content);
    } catch (error) {
        console.error("Failed to generate invoice content:", error);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Could not generate email content.' });
        setInvoicePc(null);
    } finally {
        setIsGenerating(false);
    }
  }

  const handleSendInvoice = async () => {
    if (!invoicePc || !invoiceContent || !invoicePc.email) return;

    setIsSending(true);
    try {
        const result = await sendGeneratedEmail({
            customerEmail: invoicePc.email,
            emailSubject: invoiceContent.emailSubject,
            emailBody: invoiceContent.emailBody,
            fromAddress: 'ComRent <onboarding@resend.dev>'
        });

        if (result.success) {
            addAuditLog(`Sent invoice to ${invoicePc.email} for PC "${invoicePc.name}".`);
            toast({ title: 'Invoice Sent!', description: `Email has been sent to ${invoicePc.email}.`});
        } else {
            throw new Error(result.message || 'Flow returned success: false');
        }
    } catch(error: any) {
        console.error('Failed to send invoice email:', error);
        toast({ variant: 'destructive', title: 'Sending Error', description: error.message || 'Could not send invoice email.' });
    } finally {
        setIsSending(false);
        setInvoicePc(null);
        setInvoiceContent(null);
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Email Invoices</CardTitle>
          <CardDescription>
            View, edit, and send email invoices to users for their sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PC Name</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Session Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligiblePcs.length > 0 ? eligiblePcs.map((pc) => {
                const durationInfo = pricingTiers.find(d => d.value === String(pc.session_duration));
                const amount = durationInfo ? `₱${durationInfo.price.toFixed(2)}` : '-';
                
                let timeInfo = '-';
                if (pc.status === 'in_use' && pc.session_start && pc.session_duration) {
                  const endTime = new Date(pc.session_start).getTime() + pc.session_duration * 60 * 1000;
                  timeInfo = `Ends in ${formatDistanceToNow(endTime)}`;
                } else if (durationInfo) {
                    timeInfo = durationInfo.label;
                }

                return (
                  <TableRow key={pc.id}>
                    <TableCell className="font-medium">{pc.name}</TableCell>
                    <TableCell>{pc.user}</TableCell>
                    <TableCell>{pc.email}</TableCell>
                    <TableCell className="font-semibold">{amount}</TableCell>
                    <TableCell>{timeInfo}</TableCell>
                    <TableCell className="text-right">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInvoiceDialog(pc)}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Manage Invoice
                        </Button>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No active sessions with user emails available for invoicing.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!invoicePc} onOpenChange={() => { setInvoicePc(null); setInvoiceContent(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Email Invoice</DialogTitle>
            <DialogDescription>
              Preview and edit the invoice email for {invoicePc?.user} ({invoicePc?.email}).
            </DialogDescription>
          </DialogHeader>
          {isGenerating ? (
            <div className='flex items-center justify-center h-64'>
                <Loader className='h-8 w-8 animate-spin text-primary'/>
            </div>
          ) : invoiceContent && (
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right">Subject</Label>
                    <Input
                        id="subject"
                        value={invoiceContent.emailSubject}
                        onChange={(e) => setInvoiceContent(prev => prev ? {...prev, emailSubject: e.target.value} : null)}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="body" className="text-right">Body</Label>
                    <Textarea
                        id="body"
                        value={invoiceContent.emailBody}
                        onChange={(e) => setInvoiceContent(prev => prev ? {...prev, emailBody: e.target.value} : null)}
                        className="col-span-3 min-h-[250px]"
                    />
                </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoicePc(null)}>Cancel</Button>
            <Button onClick={handleSendInvoice} disabled={isSending || isGenerating || !invoiceContent}>
              {isSending ? <Loader className="animate-spin mr-2"/> : <Send className="mr-2" />}
              {isSending ? 'Sending...' : 'Send Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
