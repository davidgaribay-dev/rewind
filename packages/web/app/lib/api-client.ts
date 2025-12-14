const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8429';

interface ProjectWithStats {
  id: string;
  name: string;
  path: string;
  conversationCount: number;
  messageCount: number;
  lastActivity: string | null;
  createdAt: string;
}

interface ConversationWithMessages {
  id: string;
  conversationId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  messages?: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;
  project?: {
    id: string;
    name: string;
  };
}

async function handleResponse<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `${errorMessage}: ${response.statusText}`);
  }
  return response.json();
}

export async function getAllProjects(): Promise<ProjectWithStats[]> {
  const response = await fetch(`${API_URL}/api/projects`);
  return handleResponse<ProjectWithStats[]>(response, 'Failed to fetch projects');
}

export async function getProjectById(projectId: string): Promise<ProjectWithStats> {
  const response = await fetch(`${API_URL}/api/projects/${projectId}`);
  return handleResponse<ProjectWithStats>(response, 'Failed to fetch project');
}

export async function getConversationsByProjectId(
  projectId: string
): Promise<ConversationWithMessages[]> {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/conversations`);
  return handleResponse<ConversationWithMessages[]>(response, 'Failed to fetch conversations');
}

export async function getConversationById(
  conversationId: string
): Promise<ConversationWithMessages> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}`);
  return handleResponse<ConversationWithMessages>(response, 'Failed to fetch conversation');
}

export async function searchConversations(
  query: string,
  projectId?: string
): Promise<ConversationWithMessages[]> {
  const params = new URLSearchParams({ q: query });
  if (projectId) {
    params.append('projectId', projectId);
  }

  const response = await fetch(`${API_URL}/api/conversations/search?${params}`);
  return handleResponse<ConversationWithMessages[]>(response, 'Failed to search conversations');
}

export interface ETLStatus {
  isRunning: boolean;
  lastRun: string | null;
  lastError: string | null;
  lastSuccess: string | null;
}

export async function triggerETL(): Promise<{ message: string; status: ETLStatus }> {
  const response = await fetch(`${API_URL}/api/etl/run`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to trigger ETL');
  }
  return response.json();
}

export async function getETLStatus(): Promise<ETLStatus> {
  const response = await fetch(`${API_URL}/api/etl/status`);
  return handleResponse<ETLStatus>(response, 'Failed to fetch ETL status');
}

export const apiClient = {
  getAllProjects,
  getProjectById,
  getConversationsByProjectId,
  getConversationById,
  searchConversations,
  triggerETL,
  getETLStatus,
};
