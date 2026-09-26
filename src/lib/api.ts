import { 
  User, Department, Category, CivicIssue, IssueComment, 
  Notification, AuditLog, SLAPolicy, ServiceArea, IssueStatus, IssuePriority, AIAnalysisResult, Appointment 
} from '../types';

let currentAuthToken: string = localStorage.getItem('civicfix_token') || '';
let currentUserId: string = localStorage.getItem('civicfix_user_id') || '';

export function setAuthSession(token: string, userId: string) {
  currentAuthToken = token;
  currentUserId = userId;
  localStorage.setItem('civicfix_token', token);
  localStorage.setItem('civicfix_user_id', userId);
}

export function clearAuthSession() {
  currentAuthToken = '';
  currentUserId = '';
  localStorage.removeItem('civicfix_token');
  localStorage.removeItem('civicfix_user_id');
}

export function setCurrentAuthUserId(id: string) {
  currentUserId = id;
  localStorage.setItem('civicfix_user_id', id);
}

export function getCurrentAuthUserId(): string {
  return currentUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (currentAuthToken) {
    headers.set('Authorization', `Bearer ${currentAuthToken}`);
  }
  if (currentUserId) {
    headers.set('x-user-id', currentUserId);
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password?: string) => 
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { name: string; email: string; password?: string; phone?: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>('/auth/me'),

  getDemoAccounts: () => request<Array<{ role: string; name: string; email: string; label: string }>>('/auth/demo-accounts'),

  // Development Seed & Clean State controls
  seedDevData: () => request<{ message: string; issuesCount: number }>('/dev/seed', { method: 'POST' }),
  resetDevData: () => request<{ message: string }>('/dev/reset', { method: 'POST' }),

  // Issues
  getIssues: (params: {
    status?: string;
    priority?: string;
    category?: string;
    departmentId?: string;
    assignedOfficerId?: string;
    reporterId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.set(k, String(v));
      }
    });
    return request<{ data: CivicIssue[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/issues?${query.toString()}`
    );
  },

  getIssueById: (id: string) => request<CivicIssue>(`/issues/${id}`),

  createIssue: (data: {
    title: string;
    description: string;
    category: string;
    priority?: IssuePriority;
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
    departmentId?: string;
    images?: Array<{ url: string; type: any; caption?: string }>;
    aiAnalysis?: AIAnalysisResult;
  }) =>
    request<CivicIssue>('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: IssueStatus, note?: string) =>
    request<CivicIssue>(`/issues/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    }),

  assignOfficer: (id: string, officerId: string, notes?: string) =>
    request<CivicIssue>(`/issues/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ officerId, notes }),
    }),

  escalateIssue: (id: string, level: string, reason: string) =>
    request<CivicIssue>(`/issues/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ level, reason }),
    }),

  toggleUpvote: (id: string) =>
    request<{ upvoted: boolean; count: number }>(`/issues/${id}/upvote`, {
      method: 'POST',
    }),

  verifyIssue: (id: string, verified: boolean, notes?: string, reopenedReason?: string) =>
    request<CivicIssue>(`/issues/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verified, notes, reopenedReason }),
    }),

  getComments: (issueId: string) => request<IssueComment[]>(`/issues/${issueId}/comments`),

  addComment: (issueId: string, content: string, isInternal: boolean = false) =>
    request<IssueComment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal }),
    }),

  uploadIssueImage: (issueId: string, url: string, type: string, caption?: string) =>
    request<any>(`/issues/${issueId}/upload-image`, {
      method: 'POST',
      body: JSON.stringify({ url, type, caption }),
    }),

  // Departments & Categories
  getDepartments: () => request<Department[]>('/departments'),
  createDepartment: (dept: Partial<Department>) => request<Department>('/departments', {
    method: 'POST',
    body: JSON.stringify(dept),
  }),
  getCategories: () => request<Category[]>('/categories'),
  getUsers: (params: { role?: string; departmentId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.departmentId) query.set('departmentId', params.departmentId);
    return request<User[]>(`/users?${query.toString()}`);
  },
  createUser: (user: Partial<User>) => request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
  updateUser: (id: string, updates: Partial<User>) => request<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  // SLA & Analytics
  getSLAPolicies: () => request<SLAPolicy[]>('/sla/policies'),
  updateSLAPolicy: (id: string, updates: Partial<SLAPolicy>) => request<SLAPolicy>(`/sla/policies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  getSLAMetrics: () => request<any>('/sla/metrics'),
  triggerSLACheck: () => request<any>('/sla/check', { method: 'POST' }),
  getAnalyticsDashboard: () => request<any>('/analytics/dashboard'),
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),

  // Notifications
  getNotifications: () => request<Notification[]>('/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ count: number }>('/notifications/mark-all-read', { method: 'POST' }),

  // AI Assistants
  analyzeImage: (imageBase64OrUrl: string, userNotes?: string) =>
    request<AIAnalysisResult>('/ai/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64OrUrl, userNotes }),
    }),

  assistDescription: (prompt: string) =>
    request<{ title: string; description: string; category: string; suggestedPriority: IssuePriority }>(
      '/ai/assist-description',
      {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }
    ),

  checkDuplicates: (latitude: number, longitude: number, category: string) =>
    request<{
      isPotentialDuplicate: boolean;
      duplicateCandidate?: CivicIssue;
      distanceMeters?: number;
      matchScore?: number;
    }>('/ai/duplicate-check', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, category }),
    }),

  getOfficerAssistance: (issueId: string) =>
    request<{
      investigationSteps: string[];
      safetyChecklist: string[];
      recommendedEquipment: string[];
      citizenResponseDraft: string;
    }>('/ai/officer-assist', {
      method: 'POST',
      body: JSON.stringify({ issueId }),
    }),

  // Appointments & Supabase
  bookAppointment: (data: Partial<Appointment>) =>
    request<{
      success: boolean;
      appointment: Appointment;
      syncedToSupabase: boolean;
      supabaseDetails: any;
      message: string;
    }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAppointments: () => request<Appointment[]>('/appointments'),

  getSupabaseStatus: () =>
    request<{
      connected: boolean;
      tableExists: boolean;
      projectId: string;
      url: string;
      sqlSetup: string;
      error?: string;
      errorMessage?: string;
    }>('/supabase/status'),

  getHealth: () => request<any>('/health'),
};
