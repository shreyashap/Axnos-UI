'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  Mic,
  Paperclip,
  Bot,
  User,
  Sparkles,
  Database,
  Loader2,
  Menu,
  PanelRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  onNewChat: () => void;
  onMobileMenuToggle?: () => void;
  onMobileDetailsToggle?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onNewChat, onMobileMenuToggle, onMobileDetailsToggle }) => {
  const { activeChat, addMessage } = useChat();
  const { accessToken } = useAuth();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat || !accessToken) return;

    const userMessage = input;
    setInput('');

    addMessage(activeChat.id, {
      role: 'user',
      content: userMessage,
    });

    setIsTyping(true);

    try {
      // Call the code generation API
      const response = await fetch(`${API_URL}/code-generation/generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          model: 'openai/gpt-4o-mini', // Default model, can be made configurable
          chat_id: parseInt(activeChat.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addMessage(activeChat.id, {
          role: 'assistant',
          content: `I've generated the following code based on your request: "${userMessage}"`,
          code: data.generated_code,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate code');
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      addMessage(activeChat.id, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center justify-between md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-semibold">DataFlow</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMobileDetailsToggle}
          >
            <PanelRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-glow">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Start Your Analysis</h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Upload a dataset or connect to a database to begin exploring your data
            with AI-powered insights.
          </p>
          <Button onClick={onNewChat} size="lg" className="gap-2">
            <Database className="w-4 h-4" />
            New Analysis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden shrink-0"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-semibold truncate">{activeChat.title}</h2>
            <p className="text-sm text-muted-foreground">
              {activeChat.dataSource.type === 'file' ? 'File' : 'Database'}:{' '}
              {activeChat.dataSource.name}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden shrink-0"
          onClick={onMobileDetailsToggle}
        >
          <PanelRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {activeChat.messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 animate-fade-in',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-accent" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-secondary rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="icon" disabled>
            <Paperclip className="w-4 h-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about your data..."
              className="pr-12"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              disabled
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send • AI may make mistakes
        </p>
      </div>
    </div>
  );
};

export default ChatArea;

