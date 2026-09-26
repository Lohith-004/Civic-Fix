export type UserRole =
  | 'CITIZEN'
  | 'FIELD_OFFICER'
  | 'DEPARTMENT_SUPERVISOR'
  | 'DEPARTMENT_MANAGER'
  | 'GOVERNMENT_ADMIN'
  | 'SUPER_ADMIN';

export type IssueStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'AWAITING_VERIFICATION'
  | 'VERIFIED_RESOLVED'
  | 'REOPENED'
  | 'REJECTED'
  | 'CLOSED';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  departmentId?: string;
  departmentName?: string;
  phone?: string;
  avatarUrl?: string;
  badgeNumber?: string;
  active: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  headName: string;
  categories: string[];
  activeOfficerCount: number;
  openIssuesCount: number;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  departmentId: string;
  defaultPriority: IssuePriority;
  slaHours: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  icon: string;
  description: string;
}

export interface IssueImage {
  id: string;
  url: string;
  type: 'EVIDENCE' | 'BEFORE' | 'AFTER' | 'INVESTIGATION';
  uploadedBy: string;
  uploaderName: string;
  uploaderRole: UserRole;
  caption?: string;
  createdAt: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  status: IssueStatus;
  changedById: string;
  changedByName: string;
  changedByRole: UserRole;
  note: string;
  timestamp: string;
}

export interface IssueAssignment {
  id: string;
  officerId: string;
  officerName: string;
  assignedById: string;
  assignedByName: string;
  notes?: string;
  timestamp: string;
  active: boolean;
}

export interface IssueEscalation {
  id: string;
  level: 'SUPERVISOR' | 'MANAGER' | 'ADMIN';
  reason: string;
  escalatedById: string;
  escalatedByName: string;
  status: 'OPEN' | 'RESOLVED';
  timestamp: string;
}

export interface AIAnalysisResult {
  category: string;
  confidence: number;
  suggestedSeverity: IssuePriority;
  reasoningSummary: string;
  suggestedDepartment: string;
  duplicateScore?: number;
  duplicateCandidateId?: string;
}

export interface CivicIssue {
  id: string;
  publicId: string; // e.g. CF-2026-004812
  title: string;
  description: string;
  category: string;
  status: IssueStatus;
  priority: IssuePriority;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  
  // Relations
  reporterId: string;
  reporterName: string;
  reporterEmail?: string;
  reporterPhone?: string;
  
  departmentId: string;
  departmentName: string;
  
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  
  // Media & Engagement
  images: IssueImage[];
  upvotesCount: number;
  upvotedByUserIds: string[];
  linkedIssuesCount: number;
  
  // Timestamps & SLA
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  resolvedAt?: string;
  closedAt?: string;
  
  // Verification
  verification?: {
    verifiedByCitizen: boolean;
    citizenNotes?: string;
    verifiedAt?: string;
    rejectedReason?: string;
  };
  
  // AI Metadata
  aiAnalysis?: AIAnalysisResult;
  
  // Sub-collections
  statusHistory: StatusHistoryEntry[];
  assignments: IssueAssignment[];
  escalations: IssueEscalation[];
  commentsCount: number;
  internalNotesCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'STATUS_CHANGE' | 'ASSIGNMENT' | 'ESCALATION' | 'SLA_BREACH' | 'VERIFICATION' | 'SYSTEM';
  issueId?: string;
  issuePublicId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
}

export interface SLAPolicy {
  id: string;
  priority: IssuePriority;
  targetResponseHours: number;
  targetResolutionHours: number;
  escalationWarningThresholdPercent: number; // e.g. 75% elapsed
  autoEscalateOnBreach: boolean;
  description: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  zoneCode: string;
  coordinates: [number, number][]; // Polygon points
  primaryDepartmentId: string;
  officersOnDutyCount: number;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  publicId?: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  location?: string;
  notes?: string;
  status: AppointmentStatus;
  issueId?: string;
  createdAt: string;
  syncedToSupabase?: boolean;
}
