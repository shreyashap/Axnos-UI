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
            
            // Load preview data if available in backend
            if (chat.preview) {
              try {
                let rawRecords: any[] = [];
                if (Array.isArray(chat.preview)) {
                  rawRecords = chat.preview;
                } else if (typeof chat.preview === 'object') {
                  const tableName = chat.table_name || chat.name || '';
                  const records = chat.preview[tableName];
                  if (Array.isArray(records)) {
                    rawRecords = records;
                  } else {
                    // Fallback to first available array in object
                    const firstKey = Object.keys(chat.preview).find(k => Array.isArray(chat.preview[k]));
                    if (firstKey) rawRecords = chat.preview[firstKey];
                  }
                }

                if (rawRecords.length > 0) {
                  previewData = rawRecords;
                  columns = Object.keys(rawRecords[0]).map(key => ({
                    name: key,
                    type: typeof rawRecords[0][key] === 'number' ? 'numeric' : 'string'
                  }));
                }
              } catch (error) {
                console.error('Failed to parse cached preview:', error);
              }
            }

            // Map historical messages (prompts) if available
            const messages: ChatMessage[] = [];
            if (chat.prompts && Array.isArray(chat.prompts)) {
              chat.prompts.forEach((p: any) => {
                // Add user message
                messages.push({
                  id: `prompt-u-${p.id}`,
                  role: 'user',
                  content: p.prompt,
                  timestamp: p.created_at
                });
                
                // Add assistant response
                messages.push({
                  id: `prompt-a-${p.id}`,
                  role: 'assistant',
                  content: p.result_txt || `I've generated the code based on your request.`,
                  code: p.generated_code,
                  promptId: p.id.toString(), // Store the ID for execution
                  timestamp: p.created_at
                });
              });
            }

            return {
              id: chat.id.toString(),
              title: chat.name || `Chat ${chat.id}`,
              updatedAt: new Date(chat.created_At || Date.now()),
              dataSource: {
                type: chat.source_type === 'database_url' ? 'database' : 'file',
                name: chat.name || chat.dataset || 'Unknown',
                fileName: chat.dataset?.split('/').pop(),
                fileType: chat.dataset?.endsWith('.csv') ? 'csv' : 'excel',
                dbUrl: chat.source_type === 'database_url' ? chat.dataset : undefined,
                tableName: chat.source_type === 'database_url' ? (chat.table_name || chat.name) : undefined,
                previewData,
                columns,
              },
              messages: messages,
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
      
      // Background refresh for database previews
      if (chat && chat.dataSource.type === 'database' && chat.dataSource.tableName && accessToken) {
        const tableName = chat.dataSource.tableName;
        const chatId = chat.id;
        const refreshPreview = async () => {
          try {
            const dataResponse = await fetch(`${API_URL}/db-connect/fetch-table-records/${chatId}/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ tables: [tableName] }),
            });

            if (dataResponse.ok) {
              const data = await dataResponse.json();
              const tableData = data.data[tableName] || [];
              
              if (tableData.length > 0) {
                const columns = Object.keys(tableData[0]).map(key => ({
                  name: key,
                  type: typeof tableData[0][key] === 'number' ? 'numeric' : 'string',
                }));

                updateChat(chat.id, {
                  dataSource: {
                    ...chat.dataSource,
                    previewData: tableData,
                    columns: columns,
                  }
                });
              }
            }
          } catch (error) {
            console.error('Failed to auto-refresh preview data:', error);
          }
        };
        refreshPreview();
      }
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

