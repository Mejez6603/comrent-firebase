'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Message } from '@/app/api/messages/route';
import { PC } from '@/lib/types';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

interface ChatContextType {
  conversations: Record<string, Message[]>;
  activeConversation: string | null;
  setActiveConversation: (pcName: string | null) => void;
  sendMessage: (text: string) => void;
  unreadCounts: Record<string, number>;
  pc: PC | null;
  setPc: Dispatch<SetStateAction<PC | null>>;
  pcName: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

type ChatProviderProps = {
    children: ReactNode;
    role?: 'user' | 'admin';
};

export function ChatProvider({ children, role = 'user' }: ChatProviderProps) {
  const searchParams = useSearchParams();
  const pcNameFromUrl = searchParams.get('pc');
  const { toast } = useToast();
  const router = useRouter();

  const [pc, setPc] = useState<PC | null>(null);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [activeConversation, setActiveConversationState] = useState<string | null>(pcNameFromUrl || null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  

  // For user-side, fetch the specific PC data
  useEffect(() => {
    if (role !== 'user' || !activeConversation) return;

    async function fetchAndReservePc() {
        try {
            const res = await fetch(`/api/pc-status`);
            const allPcs: PC[] = await res.json();
            const currentPc = allPcs.find(p => p.name === activeConversation);

            if (currentPc) {
                 // Only users can access available PCs, or PCs they are already interacting with
                const validInitialStatuses = ['available', 'pending_payment', 'pending_approval', 'in_use', 'time_up'];
                if (!validInitialStatuses.includes(currentPc.status)) {
                    toast({ variant: "destructive", title: "PC Not Available", description: `${activeConversation} is currently not available for rent.` });
                    router.push('/');
                    return;
                }

                if (currentPc.status === 'available') {
                    // Reserve the PC by setting it to pending_payment
                    const response = await fetch('/api/pc-status', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: currentPc.id, newStatus: 'pending_payment' })
                    });
                    if (!response.ok) {
                        throw new Error('Failed to reserve PC.');
                    }
                    const updatedPc: PC = await response.json();
                    setPc(updatedPc);
                } else {
                    setPc(currentPc);
                }

            } else {
                toast({ variant: "destructive", title: "Error", description: "PC not found." });
                router.push('/');
            }
        } catch (error) {
            console.error("Failed to fetch initial PC data", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch page data." });
            router.push('/');
        }
    }

    // Only run this logic once when the component mounts and pc is not yet set.
    if (!pc) {
      fetchAndReservePc();
    }

  }, [role, activeConversation, pc, router, toast]);

  const fetchMessagesAndStatus = useCallback(async () => {
    try {
        if (role === 'admin') {
            const allPcsResponse = await fetch('/api/pc-status');
            const allPcs: PC[] = await allPcsResponse.json();
            const newConversations: Record<string, Message[]> = {};
            const newUnreadCounts: Record<string, number> = {};
            const activePcNamesWithMessages = new Set<string>();

            // Fetch all messages in a single call if your API supports it.
            // Assuming an endpoint `/api/messages/all` that returns a map or object.
            try {
                const msgResponse = await fetch(`/api/messages`);
                if(msgResponse.ok) {
                    const allMessagesByPc: Map<string, Message[]> = new Map(Object.entries(await msgResponse.json()));

                    for (const [pcName, messages] of allMessagesByPc.entries()) {
                         if (messages.length > 0) {
                            newConversations[pcName] = messages;
                            newUnreadCounts[pcName] = messages.filter(m => !m.isRead && m.sender !== role).length;
                            activePcNamesWithMessages.add(pcName);
                        }
                    }
                }
            } catch (e) {
                // It's possible for this to fail if the route is not set up, which is fine.
                console.warn("Could not fetch all messages at once.", e);
            }
             
            setConversations(currentConversations => {
                const updatedConversations: Record<string, Message[]> = {};
                // Only keep conversations for PCs that still have messages on the server
                for(const pcName of activePcNamesWithMessages) {
                    if (newConversations[pcName]) {
                        updatedConversations[pcName] = newConversations[pcName];
                    }
                }
                
                // Clear out old conversations that are no longer active
                Object.keys(currentConversations).forEach(pcName => {
                    if (activePcNamesWithMessages.has(pcName)) {
                        updatedConversations[pcName] = newConversations[pcName];
                    }
                });

                return updatedConversations;
            });

            setUnreadCounts(newUnreadCounts);
        } else if (role === 'user' && pc) {
            // Fetch messages for the user's current PC
            const msgResponse = await fetch(`/api/messages?pcName=${pc.name}`);
            const messages: Message[] = await msgResponse.json();
            setConversations(prev => ({ ...prev, [pc.name]: messages }));

            // Poll for status changes on the user's PC
            const statusResponse = await fetch(`/api/pc-status?id=${pc.id}`);
            const updatedPc: PC = await statusResponse.json();
            setPc(updatedPc);
        }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }, [role, pc]);


  useEffect(() => {
    fetchMessagesAndStatus();
    const intervalId = setInterval(fetchMessagesAndStatus, 3000);
    return () => clearInterval(intervalId);
  }, [fetchMessagesAndStatus]);

  const sendMessage = async (text: string) => {
    const targetPcName = activeConversation;
    if (!targetPcName) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pcName: targetPcName, sender: role, text }),
      });
      fetchMessagesAndStatus(); // Re-fetch to get the latest messages
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const setActiveConversation = useCallback(async (pcName: string | null) => {
    setActiveConversationState(pcName);
    if (pcName && role === 'admin') {
      setUnreadCounts(prev => ({...prev, [pcName]: 0}));
      try {
        await fetch('/api/messages', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pcName }),
        });
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    }
  }, [role]);


  const value = {
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    unreadCounts,
    pc,
    setPc,
    pcName: activeConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
