'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import ChatArea from '@/components/ChatArea';
import NewChatModal from '@/components/NewChatModal';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth');
    return null;
  }

  return (
    <ChatProvider>
      <div className="flex h-screen bg-background overflow-hidden relative">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNewChat={() => setShowNewChatModal(true)}
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 w-full relative">
          <ChatArea
            onNewChat={() => setShowNewChatModal(true)}
            onMobileMenuToggle={() => setMobileSidebarOpen(true)}
            onMobileDetailsToggle={() => setMobileRightPanelOpen(true)}
          />
        </div>

        <RightPanel
          isCollapsed={rightPanelCollapsed}
          onToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          isMobileOpen={mobileRightPanelOpen}
          onMobileClose={() => setMobileRightPanelOpen(false)}
        />

        <NewChatModal
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
        />
      </div>
    </ChatProvider>
  );
}
