'use client';

import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code,
  BarChart3,
  Table,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Download,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RightPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ isCollapsed, onToggle, isMobileOpen = false, onMobileClose }) => {
  const { activeChat } = useChat();
  const { accessToken } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [executionImages, setExecutionImages] = useState<string[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const lastCodeMessage = activeChat?.messages
    .slice()
    .reverse()
    .find((m) => m.code);

  const handleCopyCode = () => {
    if (lastCodeMessage?.code) {
      navigator.clipboard.writeText(lastCodeMessage.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExecuteCode = async () => {
    if (!lastCodeMessage?.promptId || !accessToken) return;

    setIsExecuting(true);
    setExecutionOutput(null);
    setExecutionImages([]);

    try {
      const response = await fetch(`${API_URL}/code-execution/execute/${lastCodeMessage.promptId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExecutionOutput(data.output);
        setExecutionImages(data.image_urls || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setExecutionOutput(`Error: ${errorData.error || 'Execution failed'}`);
      }
    } catch (error: any) {
      setExecutionOutput(`System Error: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Chart data will come from the actual data source
  // For now, we'll show empty state if no visualization data is available
  const chartData = activeChat?.dataSource.previewData || [];

  if (isCollapsed) {
    return (
      <div className="hidden md:flex w-14 bg-zinc-950/50 backdrop-blur-xl border-l border-white/5 flex-col items-center py-4 gap-4 z-20">
        <Button variant="ghost" size="icon-sm" onClick={onToggle} className="hover:bg-white/5">
          <ChevronLeft className="w-4 h-4 text-zinc-400" />
        </Button>
        <div className="flex-1 flex flex-col items-center gap-6 mt-4">
          <Button variant="ghost" size="icon-sm" onClick={onToggle} title="Code" className="text-zinc-500 hover:text-primary hover:bg-primary/10">
            <Code className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggle} title="Visualization" className="text-zinc-500 hover:text-primary hover:bg-primary/10">
            <BarChart3 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggle} title="Data" className="text-zinc-500 hover:text-primary hover:bg-primary/10">
            <Table className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <div className={cn(
        "bg-zinc-950/50 backdrop-blur-xl border-l border-white/5 flex flex-col animate-slide-in-right transition-all duration-300 relative z-40",
        "fixed inset-y-0 right-0 md:relative", // Mobile positioning
        "w-80 md:w-[450px]", // Width
        !isMobileOpen && "hidden md:flex" // Visibility
      )}>
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between h-16 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-300">Insights Pipeline</h3>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={isMobileOpen && onMobileClose ? onMobileClose : onToggle} className="hover:bg-white/5">
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </Button>
        </div>

        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <div className="text-zinc-600">
              <BarChart3 className="w-16 h-16 mx-auto mb-6 opacity-20" />
              <p className="text-sm font-medium">Pipeline Inactive</p>
              <p className="text-xs opacity-60">Visualizations appear after analysis</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="code" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-4 mt-6 grid grid-cols-3 bg-zinc-900/50 p-1 border border-white/5 rounded-xl">
              <TabsTrigger value="code" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all">
                <Code className="w-3.5 h-3.5" />
                Code
              </TabsTrigger>
              <TabsTrigger value="viz" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all">
                <BarChart3 className="w-3.5 h-3.5" />
                Chart
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all">
                <Table className="w-3.5 h-3.5" />
                Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="flex-1 p-6 overflow-hidden flex flex-col">
              {lastCodeMessage?.code ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-blue-500/50" />
                       <span className="text-xs text-zinc-400 font-mono">Python Kernel</span>
                    </div>
                    <div className="flex gap-2">
                       <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleCopyCode}
                        className="bg-zinc-900 border border-white/5 hover:bg-white/5"
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        onClick={handleExecuteCode}
                        disabled={isExecuting}
                        className={cn(
                          "bg-zinc-900 border border-white/5 hover:bg-primary/20 hover:text-primary transition-colors",
                          isExecuting && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 overflow-auto scrollbar-thin shadow-inner mb-4">
                    <pre className="text-sm font-mono text-zinc-300 leading-relaxed">
                      <code>{lastCodeMessage.code}</code>
                    </pre>
                  </div>

                  {/* Execution Results */}
                  {(executionOutput || executionImages.length > 0) && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {executionOutput && (
                        <div className="bg-zinc-900/80 rounded-xl border border-white/10 p-4">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Execution Logs</p>
                          <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-auto scrollbar-thin">
                            {executionOutput}
                          </pre>
                        </div>
                      )}
                      
                      {executionImages.map((url, idx) => (
                        <div key={idx} className="bg-white/5 rounded-xl border border-white/10 p-2 overflow-hidden shadow-glow shadow-primary/5">
                          <img src={url} alt={`Visualization ${idx + 1}`} className="w-full h-auto rounded-lg" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center py-20">
                  <div className="text-zinc-600">
                    <Code className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Logic Empty</p>
                    <p className="text-xs opacity-60">Generate code via chat command</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="viz" className="flex-1 p-6 overflow-hidden flex flex-col">
              {chartData.length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Real-time Visualization</h4>
                    <Button variant="ghost" size="icon-sm" className="hover:bg-white/5">
                      <Download className="w-4 h-4 text-zinc-500" />
                    </Button>
                  </div>
                  <div className="flex-1 min-h-[300px] bg-black/20 rounded-2xl p-4 border border-white/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.slice(0, 10)}>
                        <defs>
                          <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey={activeChat.dataSource.columns?.[0]?.name || 'name'}
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(9,9,11,0.9)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                          }}
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        />
                        {activeChat.dataSource.columns?.slice(0, 1).map((col, idx) => (
                          <Bar
                            key={col.name}
                            dataKey={col.name}
                            fill="url(#colorPrimary)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center py-20">
                  <div className="text-zinc-600">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Neural Link Empty</p>
                    <p className="text-xs opacity-60">Connect data to visualize patterns</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="flex-1 p-0 overflow-hidden flex flex-col">
              {activeChat.dataSource.previewData ? (
                <div className="h-full flex flex-col">
                  <div className="p-6 pb-2 flex items-center justify-between shrink-0">
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Direct Memory Access</h4>
                        <p className="text-[10px] text-zinc-500 font-medium">TOP 5 RECORDS FROM SOURCE</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="hover:bg-white/5">
                      <Download className="w-4 h-4 text-zinc-500" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto scrollbar-thin mx-4 mb-4 mt-2 rounded-2xl border border-white/5 bg-black/40">
                    <table className="w-full text-[11px] border-collapse">
                      <thead className="bg-zinc-900/80 backdrop-blur-md sticky top-0 text-zinc-500 z-10">
                        <tr>
                          {activeChat.dataSource.columns?.map((col) => (
                            <th
                              key={col.name}
                              className="px-4 py-3 text-left font-bold uppercase tracking-tighter border-b border-white/5"
                            >
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {activeChat.dataSource.previewData.map((row: any, i) => (
                          <tr
                            key={i}
                            className="hover:bg-primary/5 transition-colors text-zinc-400 group"
                          >
                            {activeChat.dataSource.columns?.map((col) => (
                              <td key={col.name} className="px-4 py-3 font-mono group-hover:text-zinc-200">
                                {String(row[col.name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center py-20">
                  <div className="text-zinc-600">
                    <Table className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Buffer Empty</p>
                    <p className="text-xs opacity-60">Initialize a data stream to preview</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
};

export default RightPanel;

