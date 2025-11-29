'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, Save, Info } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';

type EmailInvoiceManagementProps = { 
    addAuditLog: (log: string) => void;
}

export function EmailInvoiceManagement({ addAuditLog }: EmailInvoiceManagementProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/email-template');
        if (!response.ok) throw new Error('Failed to fetch template.');
        const template = await response.json();
        setSubject(template.subject);
        setBody(template.body);
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load email template.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [toast]);

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      if (!response.ok) throw new Error('Failed to save template.');
      
      addAuditLog('Updated the master email invoice template.');
      toast({ title: 'Template Saved!', description: 'The email invoice template has been updated.' });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save the template.' });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-96">
            <Loader className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Email Invoice Template</CardTitle>
        <CardDescription>
          Edit the template used for all invoice emails. The system will automatically replace placeholders like `{'{{customerName}}'}`.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
                Use placeholders to insert dynamic data: `{'{{customerName}}'}`, `{'{{pcName}}'}`, `{'{{duration}}'}`, `{'{{amount}}'}`, `{'{{companyName}}'}`.
            </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your Invoice from {{companyName}}"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Email Body</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[300px] font-mono"
            placeholder="Hello {{customerName}}, here is your invoice..."
          />
        </div>
        <div className="flex justify-end">
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
                {isSaving ? <Loader className="animate-spin mr-2"/> : <Save className="mr-2" />}
                {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
