'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import {
  Plus,
  MessageSquare,
  LogOut,
  User,
  Trash2,
  Database,
  ChevronLeft,
  ChevronRight,
  Bot,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onNewChat, isMobileOpen = false, onMobileClose }) => {
  const { user, logout } = useAuth();
  const { chats, activeChat, setActiveChat, deleteChat } = useChat();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <div
        className={cn(
          'h-full bg-zinc-950/50 backdrop-blur-xl flex flex-col border-r border-white/5 transition-all duration-300',
          'fixed inset-y-0 left-0 z-50 md:relative md:z-0', // Mobile positioning
          isCollapsed ? 'w-20' : 'w-72',
          !isMobileOpen && 'hidden md:flex' // Hide on mobile if not open
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 h-16">
          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-fade-in">
               <Bot className="text-primary w-6 h-6" />
               <span className="text-xl font-bold tracking-tight">Axnos<span className="text-primary">AI</span></span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            className={cn("shrink-0 hover:bg-white/5", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            )}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={onNewChat}
            className={cn(
              'w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 shadow-glow transition-all duration-300',
              isCollapsed && 'justify-center px-0 h-12 w-12 mx-auto rounded-xl'
            )}
            variant="outline"
          >
            <Plus className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-semibold">New Analysis</span>}
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                'group relative rounded-xl transition-all duration-200',
                activeChat?.id === chat.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              )}
            >
              <button
                onClick={() => setActiveChat(chat)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 text-left',
                  isCollapsed && 'justify-center'
                )}
              >
                <MessageSquare className={cn(
                  "w-4 h-4 shrink-0",
                  activeChat?.id === chat.id ? "text-primary" : "text-zinc-500"
                )} />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 animate-fade-in">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs opacity-50">
                      {formatDate(chat.updatedAt)}
                    </p>
                  </div>
                )}
              </button>
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-zinc-500 hover:text-destructive" />
                </Button>
              )}
            </div>
          ))}

          {chats.length === 0 && !isCollapsed && (
            <div className="text-center py-12 text-zinc-600 animate-fade-in">
              <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Ready for insight?</p>
              <p className="text-xs opacity-60">Upload a dataset to start</p>
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div
            className={cn(
              'flex items-center gap-3',
              isCollapsed ? 'flex-col' : ''
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-lg shadow-primary/5">
              <User className="w-5 h-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-bold truncate text-zinc-200">{user?.name || 'User'}</p>
                <p className="text-[10px] text-zinc-500 truncate uppercase tracking-tighter">
                  {user?.email}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="shrink-0 hover:bg-destructive/10 hover:text-destructive text-zinc-500"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

