'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Home, LineChart, List, User, Tag } from 'lucide-react';
import { AdminDashboard } from './admin-dashboard';
import { AnalyticsDashboard } from './analytics-dashboard';
import { AuditLog } from './audit-log';
import { PricingManagement } from './pricing-management';
import { PC, PricingTier } from '@/lib/types';
import type { Notification } from '@/components/admin/admin-notification-panel';
import { AdminChat } from './admin-chat';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pcs, setPcs] = useState<PC[]>([]);
  const [historicalSessions, setHistoricalSessions] = useState<PC[]>([]);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addAuditLog = useCallback((log: string) => {
    const timestamp = new Date().toLocaleString();
    const newLog = `[${timestamp}] ${log}`;
    // Prevent duplicate logs in a short time frame
    setAuditLogs(prev => {
        if(prev.some(p => p.endsWith(log))) return prev;
        return [newLog, ...prev];
    });
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
        ...notification,
        id: `${notification.pc.id}-${notification.type}-${Date.now()}`,
        timestamp: new Date(),
    };
    setNotifications(prev => {
        // Avoid duplicate notifications for the same event
        const isDuplicate = prev.some(n => 
            n.pc.id === newNotification.pc.id &&
            n.type === newNotification.type &&
            n.rawMessage === newNotification.rawMessage
        );
        if (isDuplicate) return prev;
        const newNotifications = [newNotification, ...prev];
        if (newNotifications.length > 50) {
            newNotifications.length = 50; // Keep the list from growing indefinitely
        }
        return newNotifications;
    });
    addAuditLog(notification.rawMessage);
  }, [addAuditLog]);

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch('/api/pricing');
        const data: PricingTier[] = await res.json();
        setPricingTiers(data.sort((a,b) => Number(a.value) - Number(b.value)));
      } catch (error) {
        console.error("Failed to fetch pricing tiers", error);
      }
    }
    async function fetchHistoricalData() {
      try {
        const res = await fetch('/api/historical-sessions');
        const data = await res.json();
        setHistoricalSessions(data);
      } catch (error) {
        console.error("Failed to fetch historical sessions", error);
      }
    }
    fetchPricing();
    fetchHistoricalData();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsDashboard pcs={pcs} historicalSessions={historicalSessions} pricingTiers={pricingTiers} />;
      case 'audit-log':
        return <AuditLog logs={auditLogs} />;
      case 'pricing':
        return <PricingManagement pricingTiers={pricingTiers} setPricingTiers={setPricingTiers} addAuditLog={addAuditLog} />;
      case 'dashboard':
      default:
        return (
            <AdminDashboard 
                pcs={pcs} 
                setPcs={setPcs} 
                addAuditLog={addAuditLog} 
                pricingTiers={pricingTiers}
                notifications={notifications}
                addNotification={addNotification}
                dismissNotification={dismissNotification}
            />
        );
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <User className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Admin</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveTab('dashboard')}
                isActive={activeTab === 'dashboard'}
                tooltip="Dashboard"
              >
                <Home />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveTab('analytics')}
                isActive={activeTab === 'analytics'}
                tooltip="Analytics"
              >
                <LineChart />
                <span>Analytics</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveTab('pricing')}
                isActive={activeTab === 'pricing'}
                tooltip="Pricing"
              >
                <Tag />
                <span>Pricing</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveTab('audit-log')}
                isActive={activeTab === 'audit-log'}
                tooltip="Audit Log"
              >
                <List />
                <span>Audit Log</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="text-xs text-muted-foreground p-4">
            &copy; {new Date().getFullYear()} ComRent
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-2xl font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
        </div>
        {children}
        {renderContent()}
      </SidebarInset>
      <AdminChat />
    </SidebarProvider>
  );
}
