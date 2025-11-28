'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Message } from '@/app/api/messages/route';

interface ChatContextType {
  conversations: Record<string, Message[]>;
  activeConversation: string | null;
  setActiveConversation: (pcName: string | null) => void;
  sendMessage: (text: string) => void;
  unreadCounts: Record<string, number>;
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
    role: 'user' | 'admin';
    pcName?: string; // For user role
};

export function ChatProvider({ children, role, pcName }: ChatProviderProps) {
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [activeConversation, setActiveConversationState] = useState<string | null>(pcName || null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const fetchMessages = useCallback(async () => {
    try {
      const allPcsResponse = await fetch('/api/pc-status');
      const allPcs = await allPcsResponse.json();
      const newConversations: Record<string, Message[]> = {};
      const newUnreadCounts: Record<string, number> = {};

      for (const pc of allPcs) {
        const response = await fetch(`/api/messages?pcName=${pc.name}`);
        const messages: Message[] = await response.json();
        if (messages.length > 0) {
            newConversations[pc.name] = messages;
            newUnreadCounts[pc.name] = messages.filter(m => !m.isRead && m.sender !== role).length;
        }
      }
      setConversations(newConversations);
      setUnreadCounts(newUnreadCounts);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [role]);

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [fetchMessages]);

  const sendMessage = async (text: string) => {
    const targetPcName = activeConversation;
    if (!targetPcName) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pcName: targetPcName, sender: role, text }),
      });
      fetchMessages(); // Re-fetch to get the latest messages
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const setActiveConversation = useCallback(async (pcName: string | null) => {
    setActiveConversationState(pcName);
    if (pcName && role === 'admin') {
      // Mark messages as read
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
