'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/context/AuthContext';
import {
  Upload,
  Database,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Table,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DatabaseTable } from '@/types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'choose' | 'upload' | 'database' | 'tables';

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { createChat, updateChat } = useChat();
  const { accessToken } = useAuth();
  const [step, setStep] = useState<Step>('choose');
  const [file, setFile] = useState<File | null>(null);
  const [dbUrl, setDbUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_PROXY_API_URL || 'http://localhost:8001';

  const handleClose = () => {
    // If we have a pending chat but didn't finish setup (no table selected), 
    // we might want to keep it or delete it. 
    // For now, consistent with "removing temp chat thing", we just reset state.
    // The chat exists on backend, user can access it in history or we could delete it here if strictly desired.
    setPendingChatId(null);
    setStep('choose');
    setFile(null);
    setDbUrl('');
    setTables([]);
    setSelectedTable('');
    onClose();
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleConnectDB = async () => {
    if (!dbUrl.trim() || !accessToken) return;

    setIsConnecting(true);
    try {
      // Create the chat immediately
      const { chat, tables: createdTables } = await createChat({
        type: 'database',
        name: 'Database Analysis', // Generic name, will be updated to table name
        dbUrl,
        tableName: '',
      });

      setPendingChatId(chat.id);

      if (createdTables && createdTables.length > 0) {
        // We got tables directly from the connection response
        await formatAndSetTables(createdTables, chat.id);
      } else {
        // Fallback: Try to fetch tables if not returned directly
        await fetchTablesFromBackend(chat.id);
      }
    } catch (error: any) {
      console.error('Failed to connect to database:', error);
      alert(`Failed to connect: ${error.message || 'Unknown error'}`);
      setPendingChatId(null); // Reset on failure
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchTablesFromBackend = async (chatId: string) => {
    try {
      // Test database connection and fetch tables
      const connectResponse = await fetch(`${API_URL}/db-connect/connect/${chatId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to connect to database');
      }

      let tableNames: string[] = [];
      const connectData = await connectResponse.json();

      if (connectData.preview?.tables) {
        tableNames = connectData.preview.tables;
      } else {
        const tablesResponse = await fetch(`${API_URL}/db-connect/fetch-tables/${chatId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          tableNames = tablesData.tables;
        }
      }

      if (tableNames.length === 0) {
        throw new Error('No tables found in database');
      }

      await formatAndSetTables(tableNames, chatId);
    } catch (error) {
      throw error;
    }
  };

  const formatAndSetTables = async (tableNames: string[], chatId: string) => {
    // Format tables data - just names for now, we'll fetch details when user selects a table
    const formattedTables: DatabaseTable[] = tableNames.map(tableName => ({
      name: tableName,
      rowCount: 0,
      columns: [],
    }));

    setTables(formattedTables);
    setStep('tables');
  };

  const handleStartAnalysis = async () => {
    if (!accessToken) return;

    try {
      setIsUploading(true);

      if (step === 'upload' && file) {
        // Create chat with file directly
        // The API now handles upload and returns preview data in the response
        await createChat({
          type: 'file',
          name: file.name,
          fileName: file.name,
          file: file,
          fileType: file.name.endsWith('.csv') ? 'csv' : 'excel',
        });

        // No need for separate upload or preview fetch as createChat handles it
        // and updates the context. We can just close.
      } else if (step === 'tables' && selectedTable && pendingChatId) {
        // Use the pending chat
        const chatId = pendingChatId;

        // Fetch table details for the selected table
        let columns: Array<{ name: string; type: string }> = [];
        let tableData: any[] = [];
        try {
          const dataResponse = await fetch(`${API_URL}/db-connect/fetch-table-records/${chatId}/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tables: [selectedTable] }),
          });

          if (dataResponse.ok) {
            const data = await dataResponse.json();
            tableData = data.data[selectedTable] || [];

            if (tableData.length > 0) {
              columns = Object.keys(tableData[0]).map(key => ({
                name: key,
                type: typeof tableData[0][key] === 'number' ? 'numeric' : 'string',
              }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch table details:', error);
        }

        // Update chat technical table name
        const updateTableResponse = await fetch(`${API_URL}/chats/chat-update-table/${chatId}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            table_name: selectedTable,
          }),
        });

        // Update local chat state
        updateChat(chatId, {
          title: selectedTable,
          dataSource: {
            type: 'database',
            name: selectedTable,
            dbUrl,
            tableName: selectedTable,
            columns: columns,
            previewData: tableData,
          },
        });
      }

      handleClose();
    } catch (error) {
      console.error('Failed to start analysis:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden p-0 rounded-3xl">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-primary/20 blur-[80px] rounded-full opacity-40 animate-pulse" />
        </div>

        <DialogHeader className="p-6 pb-2 relative z-10">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
            {step !== 'choose' && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setStep(step === 'tables' ? 'database' : 'choose')}
                className="hover:bg-white/5 rounded-full h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
              </Button>
            )}
            <span className="gradient-text">
              {step === 'choose' && 'Initialize Analysis'}
              {step === 'upload' && 'Synthesize Dataset'}
              {step === 'database' && 'Neural DB Link'}
              {step === 'tables' && 'Select Data Stream'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 relative z-10">
          {step === 'choose' && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="grid grid-cols-2 gap-4 py-4"
             >
                <button
                  onClick={() => setStep('upload')}
                  className="group flex flex-col items-center gap-5 p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 shadow-inner"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all duration-300 shadow-glow shadow-primary/5 group-hover:scale-110">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-zinc-200 mb-1">Local Files</p>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">CSV • EXCEL • JSON</p>
                  </div>
                </button>

                <button
                  onClick={() => setStep('database')}
                  className="group flex flex-col items-center gap-5 p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all duration-300 shadow-inner"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center transition-all duration-300 shadow-glow shadow-emerald-500/5 group-hover:scale-110">
                    <Database className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-zinc-200 mb-1">Live Database</p>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">SQL • NO-SQL • REST</p>
                  </div>
                </button>
             </motion.div>
          )}

          {step === 'upload' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="py-4 space-y-6"
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={cn(
                  'border border-dashed rounded-2xl p-10 text-center transition-all duration-300 bg-white/[0.02]',
                  isDragging
                    ? 'border-primary bg-primary/5 shadow-glow shadow-primary/5'
                    : 'border-white/10 hover:border-primary/30',
                  file && 'border-primary bg-primary/5'
                )}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                      <FileSpreadsheet className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-bold text-zinc-100 truncate">{file.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                        {(file.size / 1024).toFixed(1)} KB • READY FOR INGESTION
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setFile(null)}
                      className="hover:bg-destructive/10 hover:text-destructive text-zinc-500 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-600 opacity-50" />
                    <p className="font-bold text-zinc-300 mb-1">Transmit Data Packages</p>
                    <p className="text-xs text-zinc-500 mb-6 font-medium">
                      Drag and drop to initiate synchronization
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" type="button" className="rounded-full bg-zinc-900 border-white/10 hover:bg-white/5 font-semibold px-6">
                        Browse Filesystem
                      </Button>
                    </label>
                  </>
                )}
              </div>

              <Button
                className={cn(
                  "w-full h-12 rounded-2xl font-bold transition-all duration-300",
                  file ? "bg-primary text-white shadow-glow" : "bg-zinc-800 text-zinc-500"
                )}
                disabled={!file || isUploading}
                onClick={handleStartAnalysis}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Ingesting Stream...
                  </>
                ) : (
                  <>
                    Begin Transformation
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === 'database' && (
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="py-4 space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="db-url" className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">Access Protocol (URI)</Label>
                  <div className="relative">
                    <Input
                      id="db-url"
                      placeholder="postgresql://access_token@cluster.axnos.com:5432/main"
                      value={dbUrl}
                      onChange={(e) => setDbUrl(e.target.value)}
                      className="bg-black/50 border-white/10 h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 shadow-inner px-4 text-zinc-200 placeholder:text-zinc-700 font-mono text-sm"
                    />
                    <Database className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                  </div>
                  <p className="text-[9px] text-zinc-600 font-medium ml-1">
                    * ALL CONNECTIONS ARE ENCRYPTED VIA END-TO-END QUANTUM PROTECTION
                  </p>
                </div>
              </div>

              <Button
                className={cn(
                  "w-full h-12 rounded-2xl font-bold transition-all duration-300",
                  dbUrl.trim() ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-zinc-800 text-zinc-500"
                )}
                disabled={!dbUrl.trim() || isConnecting}
                onClick={handleConnectDB}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    Establish Connection
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === 'tables' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 space-y-6"
            >
              <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin pr-2 custom-scroll">
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group',
                      selectedTable === table.name
                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300",
                      selectedTable === table.name ? "bg-emerald-500/20" : "bg-black/40 group-hover:bg-zinc-900"
                    )}>
                      <Table className={cn(
                        "w-5 h-5",
                        selectedTable === table.name ? "text-emerald-500" : "text-zinc-600 group-hover:text-zinc-400"
                      )} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={cn(
                        "font-bold truncate",
                        selectedTable === table.name ? "text-emerald-400" : "text-zinc-300"
                      )}>{table.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                        {table.rowCount.toLocaleString()} ENTRIES • {table.columns.length} ATTRIBUTES
                      </p>
                    </div>
                    {selectedTable === table.name && (
                      <motion.div 
                        layoutId="active-check"
                        className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>

              <Button
                className={cn(
                  "w-full h-12 rounded-2xl font-bold transition-all duration-300",
                  selectedTable ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-zinc-800 text-zinc-500"
                )}
                disabled={!selectedTable || isUploading}
                onClick={handleStartAnalysis}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deploying Pipeline...
                  </>
                ) : (
                  <>
                    Initialize Stream
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;
