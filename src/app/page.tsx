'use client';

import { useState } from 'react';
import { PcStatusGrid } from '@/components/pc-status-grid';
import { RoleSwitcher } from '@/components/role-switcher';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function Home() {
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const toggleRole = () => {
    setRole(current => (current === 'user' ? 'admin' : 'user'));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {role === 'user' ? (
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="absolute top-4 left-4">
              <RoleSwitcher role={role} onToggle={toggleRole} />
            </div>
            <header className="text-center mb-8 md:mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline tracking-tight">ComRent</h1>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Real-time status of all PCs. Click an available PC to begin your session.
              </p>
            </header>
            <PcStatusGrid />
            <footer className="py-6 mt-12 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} ComRent. All rights reserved.</p>
            </footer>
          </div>
        ) : (
          <AdminLayout>
             <div className="absolute top-4 right-4">
              <RoleSwitcher role={role} onToggle={toggleRole} />
            </div>
          </AdminLayout>
        )}
      </main>
    </div>
  );
}
