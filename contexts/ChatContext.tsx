'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Chat, ChatMessage, DataSource } from '@/types';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;
  createChat: (dataSource: DataSource) => Promise<{ chat: Chat; tables: string[]; previewData?: any[] }>;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  deleteChat: (chatId: string) => Promise<void>;
  addMessage: (chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function ChatProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load chats from backend
  useEffect(() => {
    if (accessToken) {
      loadChats();
    }
  }, [accessToken]);

  const loadChats = async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/chats/user-chats/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedChats: Chat[] = await Promise.all(
          data.map(async (chat: any) => {
            let previewData: any[] = [];
            let columns: Array<{ name: string; type: string }> = [];

            // Load preview data for file-based chats
            if (chat.source_type === 'file' && chat.dataset) {
              try {
                // For now we skip fetching full file content for list view to save bandwidth
                // We can implement lazy loading if needed, or rely on stored preview if backend provides it
                // If backend provides preview in list, use it:
                if (chat.preview) {
                  // Handle backend preview if available
                }
              } catch (error) {
                console.error('Failed to load preview data:', error);
              }
            }

            return {
              id: chat.id.toString(),
              title: chat.name || `Chat ${chat.id}`,
              updatedAt: new Date(chat.created_At || Date.now()),
              dataSource: {
                type: chat.source_type === 'database_url' ? 'database' : 'file',
                name: chat.dataset || 'Unknown',
                fileName: chat.dataset?.split('/').pop(),
                fileType: chat.dataset?.endsWith('.csv') ? 'csv' : 'excel',
                dbUrl: chat.source_type === 'database_url' ? chat.dataset : undefined,
                tableName: chat.source_type === 'database_url' ? chat.dataset : undefined,
                previewData,
                columns,
              },
              messages: [],
            };
          })
        );
        setChats(formattedChats);

        // Set first chat as active if available
        if (formattedChats.length > 0 && !activeChat) {
          setActiveChat(formattedChats[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const createChat = async (dataSource: DataSource): Promise<{ chat: Chat; tables: string[]; previewData?: any[] }> => {
    if (!accessToken) throw new Error('Not authenticated');


    const formData: FormData = new FormData();

    formData.append("source_type", dataSource.type === "database" ? "database_url" : "file");

    if (dataSource.type === "database") {
      formData.append("database_url", dataSource.dbUrl as string);
    } else {
      if (dataSource.file) {
        formData.append("file", dataSource.file);
      } else {
        formData.append("file", dataSource.fileName as string);
      }
    }

    try {
      setIsLoading(true);
      const chatResponse = await fetch(`${API_URL}/chats/chat-list-create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to create chat');
      }

      const chatData = await chatResponse.json();
      const chatId = chatData.chat.id.toString();

      let tables: string[] = [];
      if (chatData.preview?.tables) {
        tables = chatData.preview.tables;
      }

      let previewData: any[] = [];
      if (dataSource.type === 'file' && chatData.preview && Array.isArray(chatData.preview)) {
        previewData = chatData.preview;
      }

      const newChat: Chat = {
        id: chatId,
        title: dataSource.name || `Chat ${chatId}`,
        updatedAt: new Date(),
        dataSource: {
          ...dataSource,
          previewData: previewData.length > 0 ? previewData : undefined,
          columns: previewData.length > 0 ? Object.keys(previewData[0]).map(key => ({ name: key, type: 'string' })) : undefined
        },
        messages: [],
      };

      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);

      return { chat: newChat, tables, previewData };
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, ...updates, updatedAt: new Date() } : chat
    ));

    if (activeChat?.id === chatId) {
      setActiveChat(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_URL}/chats/chat-detail/${chatId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        if (activeChat?.id === chatId) {
          setActiveChat(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const addMessage = (chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, messages: [...chat.messages, newMessage], updatedAt: new Date() }
        : chat
    ));

    if (activeChat?.id === chatId) {
      setActiveChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage],
        updatedAt: new Date(),
      } : null);
    }
  };

  const value = {
    chats,
    activeChat,
    setActiveChat: (chat: Chat | null) => {
      setActiveChat(chat);
    },
    createChat,
    updateChat,
    deleteChat,
    addMessage,
    isLoading,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

