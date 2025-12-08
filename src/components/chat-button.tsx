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
import { MessageSquare, Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

export function ChatButton() {
  const { conversations, activeConversation, sendMessage, unreadCounts } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (imagePreview) {
      sendMessage(imagePreview, 'image');
      setImagePreview(null);
    } else if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !imagePreview) {
      handleSendMessage();
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setNewMessage(''); // Clear text when image is selected
        };
        reader.readAsDataURL(file);
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
     // Reset file input value to allow selecting the same file again
     if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        processFile(file);
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
      <PopoverContent
        className="w-80 h-96 p-0 flex flex-col relative"
        side="top"
        align="end"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
            <div className="absolute inset-0 z-10 bg-primary/20 border-4 border-dashed border-primary flex flex-col items-center justify-center pointer-events-none rounded-md">
                <ImageIcon className="h-12 w-12 text-primary" />
                <p className="text-lg font-semibold text-primary">Drop image here</p>
            </div>
        )}
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
                    "max-w-[75%] rounded-lg p-2 text-sm",
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                    msg.text ? 'px-3' : 'p-1' // Less padding for images
                  )}
                >
                  {msg.text && <p>{msg.text}</p>}
                  {msg.imageUrl && (
                    <Image
                        src={msg.imageUrl}
                        alt="Chat image"
                        width={200}
                        height={200}
                        className="rounded-md object-cover"
                    />
                  )}
                   <p className={cn("text-xs mt-1", msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70')}>
                       {format(new Date(msg.timestamp), 'p')} • {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </p>
                </div>
              </div>
            ))}
             {activeMessages.length === 0 && (
                <p className='text-center text-sm text-muted-foreground pt-12'>Send a message to start the conversation.</p>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t">
          {imagePreview && (
            <div className="relative p-2">
              <Image src={imagePreview} alt="Preview" width={60} height={60} className="rounded-md" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-0 right-0 h-5 w-5"
                onClick={() => setImagePreview(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for help..."
              disabled={!!imagePreview}
            />
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />
            <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={!!imagePreview}>
                <Paperclip className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim() && !imagePreview}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
