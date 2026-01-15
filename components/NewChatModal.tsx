'use client';

import React, { useState, useCallback } from 'react';
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
        try {
          const dataResponse = await fetch(`${API_URL}/db-connect/fetch-table-recoreds/${chatId}/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tables: [selectedTable] }),
          });

          if (dataResponse.ok) {
            const data = await dataResponse.json();
            const tableData = data.data[selectedTable] || [];

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

        // Update chat name to the selected table
        const updateNameResponse = await fetch(`${API_URL}/chats/chat-update-name/${chatId}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: selectedTable,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'choose' && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setStep(step === 'tables' ? 'database' : 'choose')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {step === 'choose' && 'New Analysis'}
            {step === 'upload' && 'Upload Dataset'}
            {step === 'database' && 'Connect Database'}
            {step === 'tables' && 'Select Table'}
          </DialogTitle>
        </DialogHeader>

        {step === 'choose' && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => setStep('upload')}
              className="group flex flex-col items-center gap-4 p-6 rounded-xl border border-border bg-secondary/30 hover:bg-secondary hover:border-primary/50 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <FileSpreadsheet className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Upload File</p>
                <p className="text-xs text-muted-foreground">CSV or Excel files</p>
              </div>
            </button>

            <button
              onClick={() => setStep('database')}
              className="group flex flex-col items-center gap-4 p-6 rounded-xl border border-border bg-secondary/30 hover:bg-secondary hover:border-primary/50 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                <Database className="w-7 h-7 text-accent" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Connect Database</p>
                <p className="text-xs text-muted-foreground">PostgreSQL, MySQL, etc.</p>
              </div>
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="py-4 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                file && 'border-primary bg-primary/5'
              )}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium mb-1">Drop your file here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" type="button">
                      Browse Files
                    </Button>
                  </label>
                </>
              )}
            </div>

            <Button
              className="w-full"
              disabled={!file || isUploading}
              onClick={handleStartAnalysis}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Start Analysis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'database' && (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="db-url">Database URL</Label>
              <Input
                id="db-url"
                placeholder="postgresql://user:pass@host:5432/dbname"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your database connection string
              </p>
            </div>

            <Button
              className="w-full"
              disabled={!dbUrl.trim() || isConnecting}
              onClick={handleConnectDB}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'tables' && (
          <div className="py-4 space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table.name)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                    selectedTable === table.name
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <Table className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{table.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {table.rowCount.toLocaleString()} rows •{' '}
                      {table.columns.length} columns
                    </p>
                  </div>
                  {selectedTable === table.name && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              disabled={!selectedTable || isUploading}
              onClick={handleStartAnalysis}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Start Analysis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;

