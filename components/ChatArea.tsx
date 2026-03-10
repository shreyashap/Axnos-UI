'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
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
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VoiceToText from './VoiceToText';

interface ChatAreaProps {
  onNewChat: () => void;
  onMobileMenuToggle?: () => void;
  onMobileDetailsToggle?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onNewChat, onMobileMenuToggle, onMobileDetailsToggle }) => {
  const { activeChat, addMessage, updateChat } = useChat();
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
        
        // Update chat name if it was auto-generated
        if (data.updated_chat_name) {
          updateChat(activeChat.id, { title: data.updated_chat_name });
        }

        addMessage(activeChat.id, {
          role: 'assistant',
          content: `I've generated the following code based on your request: "${userMessage}"`,
          code: data.generated_code,
          promptId: data.prompt_id,
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
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between md:hidden bg-zinc-950/50 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-5 h-5 text-zinc-400" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="text-primary w-5 h-5" />
            <span className="font-bold tracking-tight">Axnos<span className="text-primary">AI</span></span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMobileDetailsToggle}
          >
            <PanelRight className="w-5 h-5 text-zinc-400" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 shadow-glow outline outline-1 outline-primary/20"
          >
            <Sparkles className="w-12 h-12 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-black mb-4 tracking-tighter">Evolution Starts Here.</h2>
          <p className="text-zinc-400 max-w-md mb-12 leading-relaxed font-light text-lg">
            Deploy your data into the <span className="text-primary font-medium">Axnos Engine</span> and witness the transformation of raw information into crystal insights.
          </p>
          <Button 
            onClick={onNewChat} 
            size="lg" 
            className="gap-3 bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 rounded-full shadow-glow transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Initialize New Analysis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4 bg-zinc-950/40 backdrop-blur-md h-16 shrink-0 relative z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden shrink-0 hover:bg-white/5"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-5 h-5 text-zinc-400" />
          </Button>
          <div className="min-w-0">
            <h2 className="font-bold truncate text-zinc-100">{activeChat.title}</h2>
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                activeChat.dataSource.type === 'file' ? "bg-primary" : "bg-purple-500"
              )} />
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest truncate font-medium">
                {activeChat.dataSource.type === 'file' ? 'File Stream' : 'Database Node'} • {activeChat.dataSource.name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden shrink-0 hover:bg-white/5"
            onClick={onMobileDetailsToggle}
          >
            <PanelRight className="w-5 h-5 text-zinc-400" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-8 space-y-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-8">
          {activeChat.messages.map((message, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={message.id}
              className={cn(
                'flex gap-4 group',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 shadow-lg mt-1">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-5 py-4 shadow-sm relative',
                  message.role === 'user'
                    ? 'bg-primary text-white font-medium rounded-tr-none'
                    : 'bg-zinc-900/50 backdrop-blur-sm border border-white/5 text-zinc-200 rounded-tl-none'
                )}
              >
                <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{message.content}</div>
                
                {message.code && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-black/50">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">generated_code.py</span>
                      <Sparkles className="w-3 h-3 text-primary opacity-50" />
                    </div>
                    <pre className="p-4 text-xs md:text-sm font-mono text-zinc-300 overflow-x-auto scrollbar-thin">
                      <code>{message.code}</code>
                    </pre>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0 shadow-lg mt-1">
                  <User className="w-5 h-5 text-zinc-300" />
                </div>
              )}
            </motion.div>
          ))}

          {isTyping && (
            <div className="flex gap-4 animate-fade-in pl-14">
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl px-6 py-4">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot" />
                  <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot" />
                  <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pointer-events-none z-30">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto">
          <div className="relative glass-card rounded-2xl p-2 border-white/10 shadow-2xl transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <div className="flex gap-2 items-end">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-11 w-11 rounded-xl hover:bg-white/5 text-zinc-400"
                disabled
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Query your database with Axnos Intelligence..."
                  className="w-full bg-transparent border-none outline-none resize-none py-3 px-2 text-zinc-200 placeholder:text-zinc-500 min-h-[44px] max-h-48 scrollbar-thin"
                  rows={1}
                />
              </div>
              <VoiceToText 
                onTranscript={(text) => setInput(prev => prev + (prev ? ' ' : '') + text)} 
                className="shrink-0 mb-0.5"
              />
              <Button 
                onClick={handleSend} 
                className={cn(
                  "h-11 w-11 rounded-xl transition-all duration-300",
                  input.trim() ? "bg-primary text-white shadow-glow" : "bg-zinc-800 text-zinc-500"
                )}
                disabled={!input.trim() || isTyping}
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
              Powered by Axnos-Core v1.0
            </p>
            <div className="flex items-center gap-4">
               {/* Voice placeholder removed as it's now integrated in input */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
