export interface DatabaseTable {
  name: string;
  rowCount: number;
  columns: Array<{ name: string; type: string }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp?: string;
  promptId?: string;
}

export interface DataSource {
  type: 'file' | 'database';
  name: string;
  fileName?: string;
  file?: File;
  fileType?: 'csv' | 'excel';
  dbUrl?: string;
  tableName?: string;
  columns?: Array<{ name: string; type: string }>;
  previewData?: any[];
}

export interface Chat {
  id: string;
  title: string;
  updatedAt: Date;
  dataSource: DataSource;
  messages: ChatMessage[];
}



