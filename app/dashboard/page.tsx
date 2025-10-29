'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Upload, Send, User, LogOut, Code, BarChart3, Copy, Download, Maximize2, Mic, FileText, Clock, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Chat {
  id: string;
  title: string;
  timestamp: string;
  fileId?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  code?: string;
  data?: any;
}

export default function ModernDashboard() {
  const router = useRouter();
  const { user, accessToken, logout, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'code' | 'visuals'>('code');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  // Load chat history
  useEffect(() => {
    if (accessToken) {
      loadChatHistory();
    }
  }, [accessToken]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const handleNewChat = () => {
    setShowUploadModal(true);
    setUploadedFile(null);
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.xls', '.json', '.pdf'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        setError('Invalid file type. Please upload CSV, Excel, JSON, or PDF files.');
        return;
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit.');
        return;
      }

      setUploadedFile(file);
      setError('');
    }
  };

  const handleFileUpload = async () => {
    if (!uploadedFile || !accessToken) return;

    setUploadLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'File upload failed');
      }

      // Create new chat
      const newChat: Chat = {
        id: data.chatId || Date.now().toString(),
        title: uploadedFile.name.replace(/\.[^/.]+$/, ''),
        timestamp: 'Just now',
        fileId: data.fileId,
      };

      setChats([newChat, ...chats]);
      setActiveChat(newChat.id);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `I've successfully loaded ${uploadedFile.name}. The dataset contains ${data.rows || 0} rows and ${data.columns || 0} columns. What would you like to analyze?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setShowUploadModal(false);
      setUploadedFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !accessToken || !activeChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setMessageLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: activeChat,
          query: inputMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process query');
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Here are the results of your query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        code: data.code,
        data: data.result,
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#0d0d0d]">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 flex flex-col bg-[#1a1a1a]">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
            <h1 className="text-lg font-semibold text-white">DataInsight AI</h1>
          </div>
          <p className="text-xs text-gray-400 ml-10">Powered by AI</p>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                  activeChat === chat.id
                    ? 'bg-gray-800 shadow-lg'
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    activeChat === chat.id ? 'text-blue-400' : 'text-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      activeChat === chat.id ? 'text-white' : 'text-gray-300'
                    }`}>
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{chat.timestamp}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col border-r border-gray-800">
          {/* Chat Header */}
          <div className="border-b border-gray-800 px-6 py-4 bg-[#1a1a1a]">
            <h2 className="text-lg font-semibold text-white">
              {chats.find(c => c.id === activeChat)?.title || 'Select a chat or create new one'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Ask questions about your data</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-300">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && !activeChat && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Welcome to DataInsight AI</h3>
                  <p className="text-gray-400 mb-6 max-w-md">Upload your dataset and start asking questions to analyze your data with AI-powered insights.</p>
                  <button
                    onClick={handleNewChat}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-2xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <div className="flex items-center mt-2 space-x-2">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <p className="text-xs text-gray-500">{message.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}

            {messageLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-sm text-gray-300">Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 p-6 bg-[#1a1a1a]">
            <div className="flex items-end space-x-3">
              <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask anything about your data..."
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none resize-none"
                  rows={1}
                  disabled={!activeChat || messageLoading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !activeChat || messageLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
              >
                {messageLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Code/Visuals */}
        <div className="w-[500px] flex flex-col bg-[#1a1a1a]">
          {/* Tabs */}
          <div className="border-b border-gray-800">
            <div className="flex">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'code'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Code</span>
                {activeTab === 'code' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('visuals')}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'visuals'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Visuals</span>
                {activeTab === 'visuals' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'code' ? (
              <div className="space-y-6">
                {/* Generated Code */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">Generated Code</span>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <pre className="text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto">
                      <code>{messages[messages.length - 1]?.code || '# No code generated yet'}</code>
                    </pre>
                  </div>
                </div>

                {/* Data Preview */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <span className="text-sm font-medium text-white">Data Preview</span>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left py-2 px-3 font-medium text-gray-300">Column</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-300">Value</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-400">
                          <tr className="border-b border-gray-800/50">
                            <td className="py-2 px-3">No data</td>
                            <td className="text-right py-2 px-3">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bar Chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <span className="text-sm font-medium text-white">Visualization</span>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-end justify-between h-64 space-x-2">
                      {[
                        { value: 85, color: 'from-blue-500 to-blue-600' },
                        { value: 70, color: 'from-purple-500 to-purple-600' },
                        { value: 60, color: 'from-pink-500 to-pink-600' },
                        { value: 55, color: 'from-orange-500 to-orange-600' },
                        { value: 48, color: 'from-green-500 to-green-600' }
                      ].map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex items-end h-full">
                            <div
                              className={`w-full bg-gradient-to-t ${item.color} rounded-t-lg transition-all hover:opacity-80`}
                              style={{ height: `${item.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Upload Dataset</h3>
                <p className="text-gray-400">Upload CSV, Excel, JSON, or PDF files to start analyzing</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <label className="block">
              <div className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl p-12 text-center cursor-pointer transition-all">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">
                  {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-400">CSV, XLSX, JSON, PDF (Max 50MB)</p>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.json,.pdf"
                  onChange={handleFileSelect}
                  disabled={uploadLoading}
                />
              </div>
            </label>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploadLoading}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!uploadedFile || uploadLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none flex items-center justify-center space-x-2"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}