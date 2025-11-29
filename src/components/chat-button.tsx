'use client';
import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function ChatButton() {
  const { conversations, activeConversation, sendMessage, unreadCounts } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasUnread = unreadCounts[activeConversation || ''] > 0 && !isOpen;
  
  const activeMessages = activeConversation ? conversations[activeConversation] || [] : [];
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        if(scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
        }
      }, 100);
    }
  }, [activeMessages, isOpen]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="h-14 w-14 rounded-full shadow-lg relative"
        >
          <MessageSquare className="h-7 w-7" />
          {hasUnread && (
             <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 h-96 p-0 flex flex-col" side="top" align="end">
        <div className="p-3 border-b bg-muted/50">
          <h4 className="font-semibold text-center">Chat with Admin</h4>
        </div>
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {activeMessages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg p-2 px-3 text-sm",
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p>{msg.text}</p>
                   <p className={cn("text-xs mt-1", msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70')}>
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </p>
                </div>
              </div>
            ))}
             {activeMessages.length === 0 && (
                <p className='text-center text-sm text-muted-foreground pt-12'>Send a message to start the conversation.</p>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for help..."
          />
          <Button size="icon" onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
