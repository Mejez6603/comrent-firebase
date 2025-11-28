'use client';
import { useState, useEffect, useRef } from 'react';
import { useChat, ChatProvider } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';

function AdminChatUI() {
  const { conversations, activeConversation, setActiveConversation, sendMessage, unreadCounts } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const activeMessages = activeConversation ? conversations[activeConversation] || [] : [];
  const hasUnread = Object.values(unreadCounts).some(count => count > 0);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A simple way to scroll to bottom
        setTimeout(() => {
            if(scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
            }
        }, 100);
    }
  }, [activeMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && activeConversation) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg">
          <MessageSquare className="h-8 w-8" />
          {hasUnread && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] h-[500px] p-0 flex" side="top" align="end">
        <div className="w-1/3 border-r bg-muted/50 flex flex-col">
            <div className="p-2 border-b">
                <h4 className="font-semibold text-center">Active Chats</h4>
            </div>
            <ScrollArea>
                {Object.keys(conversations).map(pcName => (
                    <button
                        key={pcName}
                        onClick={() => setActiveConversation(pcName)}
                        className={cn(
                            "w-full text-left p-3 text-sm hover:bg-accent hover:text-accent-foreground",
                            activeConversation === pcName && "bg-accent text-accent-foreground"
                        )}
                    >
                        <div className='flex justify-between items-center'>
                            <span className="font-semibold">{pcName}</span>
                            {unreadCounts[pcName] > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {unreadCounts[pcName]}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
                {Object.keys(conversations).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center p-4">No active chats.</p>
                )}
            </ScrollArea>
        </div>
        <div className="w-2/3 flex flex-col">
            {activeConversation ? (
                <>
                    <div className="p-2 border-b flex items-center justify-between">
                        <h4 className="font-semibold">{activeConversation}</h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveConversation(null)}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                        {activeMessages.map(msg => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-end gap-2",
                                    msg.sender === 'admin' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {msg.sender === 'user' && (
                                    <Avatar className='h-8 w-8'>
                                        <AvatarFallback>
                                            <User />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                    "max-w-[75%] rounded-lg p-2 px-3 text-sm",
                                    msg.sender === 'admin'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    )}
                                >
                                    <p>{msg.text}</p>
                                    <p className={cn("text-xs mt-1", msg.sender === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                    <div className="p-2 border-t flex items-center gap-2">
                        <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        />
                        <Button size="icon" onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">Select a chat to view messages.</p>
                </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AdminChat() {
    return (
        <ChatProvider role="admin">
            <AdminChatUI />
        </ChatProvider>
    )
}
