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
          'h-full bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300',
          'fixed inset-y-0 left-0 z-50 md:relative md:z-0', // Mobile positioning
          isCollapsed ? 'w-16' : 'w-72',
          !isMobileOpen && 'hidden md:flex' // Hide on mobile if not open, always show on desktop (flex because original was flex)
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold gradient-text">DataFlow</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            className="shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={onNewChat}
            className={cn(
              'w-full justify-start gap-2',
              isCollapsed && 'justify-center px-0'
            )}
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            {!isCollapsed && <span>New Analysis</span>}
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                'group relative rounded-lg transition-all duration-200',
                activeChat?.id === chat.id
                  ? 'bg-sidebar-accent'
                  : 'hover:bg-sidebar-accent/50'
              )}
            >
              <button
                onClick={() => setActiveChat(chat)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 text-left',
                  isCollapsed && 'justify-center'
                )}
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 animate-fade-in">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(chat.updatedAt)}
                    </p>
                  </div>
                )}
              </button>
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          ))}

          {chats.length === 0 && !isCollapsed && (
            <div className="text-center py-8 text-muted-foreground text-sm animate-fade-in">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No analyses yet</p>
              <p className="text-xs">Start a new analysis above</p>
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border">
          <div
            className={cn(
              'flex items-center gap-3',
              isCollapsed ? 'flex-col' : ''
            )}
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="shrink-0"
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



