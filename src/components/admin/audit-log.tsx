'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AuditLog({ logs }: { logs: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
            {logs.length > 0 ? (
                logs.map((log, index) => (
                    <div key={index} className="text-sm text-muted-foreground mb-2 font-mono">
                        {log}
                    </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground">No activities logged yet.</div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
