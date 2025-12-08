'use client';
import type { PC, PCStatus, PaymentMethod, PricingTier } from '@/lib/types';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Monitor,
    Power,
    Hourglass,
    Ban,
    Wrench,
    Pencil,
    Save,
    X,
    Trash2,
    CircleHelp,
    Mail,
    Send,
    Loader,
    CreditCard,
    RefreshCw,
    PlusCircle,
    Clock,
    Receipt
  } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { sendGeneratedEmail, type GenerateInvoiceEmailOutput } from '@/ai/flows/send-invoice-email';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

type StatusConfig = {
    [key in PCStatus]: {
      label: string;
      icon: FC<{ className?: string }>;
      badgeClass: string;
    };
  };
  
const statusConfig: StatusConfig = {
    available: {
        label: 'Available',
        icon: Power,
        badgeClass: 'bg-status-online text-status-text border-green-400',
    },
    in_use: {
        label: 'In Use',
        icon: Monitor,
        badgeClass: 'bg-status-using text-status-text border-blue-400',
    },
    time_up: {
        label: 'Time\'s Up',
        icon: Clock,
        badgeClass: 'bg-destructive text-destructive-foreground border-red-400',
    },
    pending_payment: {
        label: 'Pending Payment',
        icon: Hourglass,
        badgeClass: 'bg-status-pending text-status-text border-orange-400',
    },
    pending_approval: {
        label: 'Pending Approval',
        icon: CircleHelp,
        badgeClass: 'bg-yellow-500 text-status-text border-yellow-400',
    },
    maintenance: {
      label: 'Maintenance',
      icon: Wrench,
      badgeClass: 'bg-gray-500 text-status-text border-gray-400',
    },
    unavailable: {
        label: 'Unavailable',
        icon: Ban,
        badgeClass: 'bg-status-unavailable text-status-text border-red-400',
    },
};

const ALL_STATUSES = Object.keys(statusConfig) as PCStatus[];

type AdminPcTableProps = { 
    pcs: PC[], 
    setPcs: React.Dispatch<React.SetStateAction<PC[]>>,
    addAuditLog: (log: string) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    pricingTiers: PricingTier[];
}

export function AdminPcTable({ pcs, setPcs, addAuditLog, onRefresh, isRefreshing, pricingTiers }: AdminPcTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PC | null>(null);
  
  const [invoicePc, setInvoicePc] = useState<PC | null>(null);
  const [invoiceContent, setInvoiceContent] = useState<GenerateInvoiceEmailOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [isAddPcDialogOpen, setIsAddPcDialogOpen] = useState(false);
  const [newPcName, setNewPcName] = useState('');
  const [isAddingPc, setIsAddingPc] = useState(false);

  const [screenshotToView, setScreenshotToView] = useState<string | null>(null);

  const { toast } = useToast();

  const handleEdit = (pc: PC) => {
    setEditingId(pc.id);
    setEditingName(pc.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveName = async (id: string) => {
    const oldPc = pcs.find(p => p.id === id);
    if (!oldPc) return;

    try {
      const response = await fetch('/api/pc-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, newName: editingName }),
      });

      if (!response.ok) throw new Error('Failed to update PC name');
      const updatedPc: PC = await response.json();
      
      setPcs(prevPcs => prevPcs.map(p => (p.id === updatedPc.id ? updatedPc : p)));
      addAuditLog(`Edited PC name from "${oldPc.name}" to "${updatedPc.name}".`);
      toast({ title: 'Success', description: `PC name updated to "${updatedPc.name}"` });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update PC name.' });
    } finally {
      handleCancelEdit();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch('/api/pc-status', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      if (!response.ok) throw new Error('Failed to delete PC');
      const { deletedPcId } = await response.json();
      
      setPcs(prevPcs => prevPcs.filter(p => p.id !== deletedPcId));
      addAuditLog(`Deleted PC "${deleteTarget.name}".`);
      toast({ title: 'Success', description: `PC "${deleteTarget.name}" has been deleted.` });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete PC.' });
    } finally {
        setDeleteTarget(null);
    }
  };

  const handleStatusChange = async (pcId: string, newStatus: PCStatus) => {
    const pcToUpdate = pcs.find(p => p.id === pcId);
    if (!pcToUpdate) return;

    try {
        const body: any = { id: pcId, newStatus };

        const response = await fetch('/api/pc-status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
  
        if (!response.ok) throw new Error('Failed to update PC status');
  
        const updatedPc: PC = await response.json();
        
        setPcs(prevPcs => prevPcs.map(p => (p.id === updatedPc.id ? updatedPc : p)));
        
        addAuditLog(`Changed status of "${updatedPc.name}" from "${pcToUpdate.status.replace(/_/g, ' ')}" to "${newStatus.replace(/_/g, ' ')}".`);
        toast({ title: 'Status Updated', description: `PC "${updatedPc.name}" is now ${statusConfig[newStatus].label}.` });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update PC status.' });
      }
  };

  // Simple string replacement function to populate the template
  const populateTemplate = (template: string, data: Record<string, string>): string => {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
        return data[key] || match;
    });
  };

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
        const templateResponse = await fetch('/api/email-template');
        if (!templateResponse.ok) throw new Error('Failed to fetch email template.');
        const template: { subject: string, body: string } = await templateResponse.json();

        const templateData = {
            customerName: pc.user,
            pcName: pc.name,
            duration: durationInfo.label,
            amount: `₱${durationInfo.price.toFixed(2)}`,
            companyName: 'ComRent',
        };

        const finalSubject = populateTemplate(template.subject, templateData);
        const finalBody = populateTemplate(template.body, templateData);

        setInvoiceContent({
            emailSubject: finalSubject,
            emailBody: finalBody,
        });

    } catch (error) {
        console.error("Failed to generate invoice content:", error);
        toast({ variant: 'destructive', title: 'Templating Error', description: 'Could not populate email content from template.' });
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

        if (result && result.success) {
            addAuditLog(`Sent invoice to ${invoicePc.email} for PC "${invoicePc.name}".`);
            toast({ title: 'Invoice Sent!', description: `Email has been sent to ${invoicePc.email}.`});
        } else {
            throw new Error(result?.message || 'Flow returned success: false');
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

  const handleAddNewPc = async () => {
    if (!newPcName.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'PC name cannot be empty.' });
        return;
    }
    setIsAddingPc(true);
    try {
        const response = await fetch('/api/pc-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newPcName }),
        });
        if (!response.ok) throw new Error('Failed to create new PC');

        const newPc: PC = await response.json();
        setPcs(prev => [...prev, newPc]);
        addAuditLog(`Added new PC: "${newPc.name}".`);
        toast({ title: 'Success', description: `PC "${newPc.name}" has been added.` });
        
        setIsAddPcDialogOpen(false);
        setNewPcName('');
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create new PC.' });
    } finally {
        setIsAddingPc(false);
    }
  };

  const PaymentMethodBadge: React.FC<{ method: PaymentMethod | undefined }> = ({ method }) => {
    if (!method) return <span className="text-muted-foreground">-</span>;
  
    let badgeClass = '';
    switch (method) {
      case 'GCash':
        badgeClass = 'bg-blue-500 hover:bg-blue-500';
        break;
      case 'Maya':
        badgeClass = 'bg-green-800 hover:bg-green-800';
        break;
      case 'QR Code':
        badgeClass = 'bg-black hover:bg-black';
        break;
      default:
        badgeClass = 'bg-gray-500 hover:bg-gray-500';
    }
  
    return (
      <Badge className={cn('text-white', badgeClass)}>
        <CreditCard className="mr-1 h-3 w-3" />
        {method}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>PC Status Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddPcDialogOpen(true)}>
                <PlusCircle className='mr-2 h-4 w-4' />
                Add New PC
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PC Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Time Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pcs.map((pc) => {
                const config = statusConfig[pc.status];
                const Icon = config.icon;
                const isEditing = editingId === pc.id;
                
                let timeRemaining = '-';
                if (pc.status === 'in_use' && pc.session_start && pc.session_duration) {
                  const endTime = new Date(pc.session_start).getTime() + pc.session_duration * 60 * 1000;
                  timeRemaining = formatDistanceToNow(endTime, { addSuffix: true });
                }

                const durationInfo = pricingTiers.find(d => d.value === String(pc.session_duration));
                const amount = durationInfo ? `₱${durationInfo.price.toFixed(2)}` : '-';

                return (
                  <TableRow key={pc.id}>
                    <TableCell className="font-medium">
                      {isEditing ? (
                        <Input 
                          value={editingName} 
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        pc.name
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge variant="outline" className={cn('border-2 cursor-pointer', config.badgeClass)}>
                                <Icon className="mr-2 h-4 w-4" />
                                {config.label}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {ALL_STATUSES.map(status => {
                                const statusConf = statusConfig[status];
                                const StatusIcon = statusConf.icon;
                                
                                const isPendingApproval = pc.status === 'pending_approval';
                                const isInUse = pc.status === 'in_use';

                                let isDisabled = pc.status === status;
                                if (isPendingApproval) {
                                    isDisabled = status !== 'in_use' && status !== 'available';
                                } else if (isInUse) {
                                    isDisabled = status !== 'time_up';
                                }
                                
                                return (
                                    <DropdownMenuItem key={status} onClick={() => handleStatusChange(pc.id, status)} disabled={isDisabled}>
                                        <StatusIcon className="mr-2 h-4 w-4" />
                                        <span>{statusConf.label}</span>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>{pc.user || '-'}</TableCell>
                    <TableCell>
                        {pc.email && ['pending_payment', 'in_use', 'pending_approval', 'time_up'].includes(pc.status) ? (
                            <Button
                                variant="link"
                                className="p-0 h-auto text-primary underline"
                                onClick={() => handleOpenInvoiceDialog(pc)}
                            >
                                {pc.email}
                            </Button>
                        ) : (
                            pc.email || '-'
                        )}
                    </TableCell>
                    <TableCell>
                        <PaymentMethodBadge method={pc.paymentMethod} />
                    </TableCell>
                    <TableCell className="font-semibold">{amount}</TableCell>
                    <TableCell>
                      {pc.paymentScreenshotUrl ? (
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setScreenshotToView(pc.paymentScreenshotUrl!)}>
                          <Receipt className="h-4 w-4" />
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{timeRemaining}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                            {isEditing ? (
                            <>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSaveName(pc.id)}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(pc)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(pc)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
                          )}
                        </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the PC named
              <span className="font-bold"> "{deleteTarget?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <Button variant="outline" onClick={() => { setInvoicePc(null); setInvoiceContent(null); }}>Cancel</Button>
            <Button onClick={handleSendInvoice} disabled={isSending || isGenerating || !invoiceContent}>
              {isSending ? <Loader className="animate-spin mr-2"/> : <Send className="mr-2" />}
              {isSending ? 'Sending...' : 'Send Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddPcDialogOpen} onOpenChange={setIsAddPcDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New PC</DialogTitle>
                <DialogDescription>
                    Enter the name for the new PC you want to add to the system.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-pc-name" className="text-right">
                        PC Name
                    </Label>
                    <Input
                        id="new-pc-name"
                        value={newPcName}
                        onChange={(e) => setNewPcName(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., PC-13"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddPcDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddNewPc} disabled={isAddingPc}>
                    {isAddingPc ? <Loader className="animate-spin mr-2" /> : <PlusCircle className="mr-2" />}
                    {isAddingPc ? 'Adding...' : 'Add PC'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!screenshotToView} onOpenChange={() => setScreenshotToView(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Image src={screenshotToView!} alt="Payment Screenshot" width={800} height={600} className="rounded-md w-full h-auto" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
