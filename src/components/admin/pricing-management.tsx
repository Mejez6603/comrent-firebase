'use client';
import { useState } from 'react';
import type { PricingTier } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Save, X, Loader } from 'lucide-react';
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

type PricingManagementProps = {
  pricingTiers: PricingTier[];
  setPricingTiers: React.Dispatch<React.SetStateAction<PricingTier[]>>;
  addAuditLog: (log: string) => void;
};

export function PricingManagement({ pricingTiers, setPricingTiers, addAuditLog }: PricingManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [newTier, setNewTier] = useState<Omit<PricingTier, 'value'>>({ label: '', price: 0 });
  const [newTierValue, setNewTierValue] = useState('');
  const [editedTier, setEditedTier] = useState<PricingTier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleAddNew = () => {
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewTier({ label: '', price: 0 });
    setNewTierValue('');
  };

  const handleSaveNew = async () => {
    if (!newTier.label || !newTierValue || newTier.price <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill out all fields correctly.' });
      return;
    }

    setIsLoading(true);
    try {
        const response = await fetch('/api/pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newTier, value: newTierValue }),
        });
        if (!response.ok) throw new Error('Failed to save new pricing tier');
        
        const createdTier: PricingTier = await response.json();
        setPricingTiers(prev => [...prev, createdTier].sort((a,b) => Number(a.value) - Number(b.value)));
        addAuditLog(`Added new pricing tier: ${createdTier.label} for ₱${createdTier.price}.`);
        toast({ title: 'Success', description: 'New pricing tier added.' });
        handleCancelAdd();
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add pricing tier.' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleEdit = (tier: PricingTier) => {
    setEditingValue(tier.value);
    setEditedTier({ ...tier });
  };

  const handleCancelEdit = () => {
    setEditingValue(null);
    setEditedTier(null);
  };

  const handleSaveEdit = async () => {
    if (!editedTier || !editingValue) return;
    if (!editedTier.label || !editedTier.value || editedTier.price <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill out all fields correctly.' });
        return;
    }

    setIsLoading(true);
    try {
        const response = await fetch('/api/pricing', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ originalValue: editingValue, updatedTier: editedTier }),
        });
        if (!response.ok) throw new Error('Failed to update pricing tier');

        const updatedTier: PricingTier = await response.json();
        setPricingTiers(prev => prev.map(t => t.value === editingValue ? updatedTier : t).sort((a,b) => Number(a.value) - Number(b.value)));
        addAuditLog(`Edited pricing tier for ${updatedTier.value} mins.`);
        toast({ title: 'Success', description: 'Pricing tier updated.' });
        handleCancelEdit();
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update pricing tier.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsLoading(true);
    try {
        const response = await fetch('/api/pricing', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: deleteTarget.value }),
        });
        if (!response.ok) throw new Error('Failed to delete pricing tier.');

        setPricingTiers(prev => prev.filter(t => t.value !== deleteTarget.value));
        addAuditLog(`Deleted pricing tier: ${deleteTarget.label}.`);
        toast({ title: 'Success', description: 'Pricing tier deleted.' });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete pricing tier.' });
    } finally {
        setDeleteTarget(null);
        setIsLoading(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Manage Pricing</CardTitle>
                <CardDescription>Add, edit, or delete rental time and price tiers.</CardDescription>
            </div>
            <Button onClick={handleAddNew} disabled={isAdding || !!editingValue || isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Duration (minutes)</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Price (₱)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && (
              <TableRow>
                <TableCell>
                  <Input 
                    type="number" 
                    placeholder="e.g., 30" 
                    value={newTierValue}
                    onChange={(e) => setNewTierValue(e.target.value)}
                    className="h-8"
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    placeholder="e.g., 30 minutes" 
                    value={newTier.label}
                    onChange={(e) => setNewTier({ ...newTier, label: e.target.value })}
                    className="h-8"
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    placeholder="e.g., 30" 
                    value={newTier.price || ''}
                    onChange={(e) => setNewTier({ ...newTier, price: Number(e.target.value) })}
                    className="h-8"
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleSaveNew} disabled={isLoading}>
                            {isLoading ? <Loader className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelAdd} disabled={isLoading}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
              </TableRow>
            )}
            {pricingTiers.map((tier) => {
                const isEditing = editingValue === tier.value;
                return (
                    <TableRow key={tier.value}>
                        <TableCell>
                            {isEditing ? (
                                <Input type="number" value={editedTier?.value} onChange={(e) => setEditedTier(t => t ? {...t, value: e.target.value} : null)} className="h-8" disabled={isLoading} />
                            ) : (
                                tier.value
                            )}
                        </TableCell>
                        <TableCell>
                            {isEditing ? (
                                <Input value={editedTier?.label} onChange={(e) => setEditedTier(t => t ? {...t, label: e.target.value} : null)} className="h-8" disabled={isLoading} />
                            ) : (
                                tier.label
                            )}
                        </TableCell>
                        <TableCell>
                            {isEditing ? (
                                <Input type="number" value={editedTier?.price} onChange={(e) => setEditedTier(t => t ? {...t, price: Number(e.target.value)} : null)} className="h-8" disabled={isLoading} />
                            ) : (
                                tier.price.toFixed(2)
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleSaveEdit} disabled={isLoading}>
                                            {isLoading ? <Loader className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit} disabled={isLoading}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tier)} disabled={isAdding || !!editingValue || isLoading}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(tier)} disabled={isAdding || !!editingValue || isLoading}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                )
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
              This will permanently delete the <strong>{deleteTarget?.label}</strong> tier. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader className="h-4 w-4 animate-spin"/> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
