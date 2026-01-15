'use client';

import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
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
  const [copied, setCopied] = useState(false);

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

  // Chart data will come from the actual data source
  // For now, we'll show empty state if no visualization data is available
  const chartData = activeChat?.dataSource.previewData || [];

  if (isCollapsed) {
    return (
      <div className="hidden md:flex w-12 bg-card border-l border-border flex-col items-center py-4">
        <Button variant="ghost" size="icon-sm" onClick={onToggle}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 flex flex-col items-center gap-4 mt-4">
          <Button variant="ghost" size="icon-sm" onClick={onToggle} title="Code">
            <Code className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggle} title="Visualization">
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggle} title="Data">
            <Table className="w-4 h-4" />
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
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <div className={cn(
        "bg-card border-l border-border flex flex-col animate-slide-in-right transition-all duration-300",
        "fixed inset-y-0 right-0 z-50 md:relative md:z-0", // Mobile positioning
        "w-80 md:w-96", // Width
        !isMobileOpen && "hidden md:flex" // Visibility
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Output Panel</h3>
          <Button variant="ghost" size="icon-sm" onClick={isMobileOpen && onMobileClose ? onMobileClose : onToggle}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div className="text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start an analysis to see outputs here</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="code" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 grid grid-cols-3">
              <TabsTrigger value="code" className="gap-2">
                <Code className="w-3 h-3" />
                Code
              </TabsTrigger>
              <TabsTrigger value="viz" className="gap-2">
                <BarChart3 className="w-3 h-3" />
                Chart
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Table className="w-3 h-3" />
                Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="flex-1 p-4 overflow-hidden">
              {lastCodeMessage?.code ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      Python
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleCopyCode}
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon-sm" disabled>
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 bg-background rounded-lg p-4 overflow-auto scrollbar-thin">
                    <pre className="text-sm font-mono text-foreground">
                      <code>{lastCodeMessage.code}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="text-muted-foreground">
                    <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No code generated yet</p>
                    <p className="text-xs">Ask a question to generate code</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="viz" className="flex-1 p-4 overflow-hidden">
              {chartData.length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Data Visualization</span>
                    <Button variant="ghost" size="icon-sm" disabled>
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.slice(0, 10)}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey={activeChat.dataSource.columns?.[0]?.name || 'name'}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                        {activeChat.dataSource.columns?.slice(0, 3).map((col, idx) => (
                          <Bar
                            key={col.name}
                            dataKey={col.name}
                            fill={`hsl(var(--primary))`}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No visualization yet</p>
                    <p className="text-xs">Ask for a chart or graph</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="flex-1 p-4 overflow-hidden">
              {activeChat.dataSource.previewData ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Preview (Top 5 rows)
                    </span>
                    <Button variant="ghost" size="icon-sm" disabled>
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto scrollbar-thin rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary sticky top-0">
                        <tr>
                          {activeChat.dataSource.columns?.map((col) => (
                            <th
                              key={col.name}
                              className="px-3 py-2 text-left font-medium text-muted-foreground"
                            >
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeChat.dataSource.previewData.map((row: any, i) => (
                          <tr
                            key={i}
                            className="border-t border-border hover:bg-secondary/50 transition-colors"
                          >
                            {activeChat.dataSource.columns?.map((col) => (
                              <td key={col.name} className="px-3 py-2 font-mono">
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
                <div className="h-full flex items-center justify-center text-center">
                  <div className="text-muted-foreground">
                    <Table className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No data loaded</p>
                    <p className="text-xs">Upload a file to preview data</p>
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

