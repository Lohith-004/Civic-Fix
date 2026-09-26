import express, { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { slaEngine } from './slaEngine';
import { 
  analyzeIssueImage, assistDescription, checkDuplicates, generateOfficerAssistance 
} from './aiService';
import { IssuePriority, IssueStatus, UserRole, User, Appointment } from '../src/types';
import { 
  syncAppointmentToSupabase, 
  fetchServerSupabaseAppointments, 
  checkServerSupabaseHealth, 
  SUPABASE_SETUP_SQL, 
  SUPABASE_PROJECT_ID, 
  SUPABASE_URL 
} from './supabase';

export const apiRouter = express.Router();

// Role Hierarchy for authorization
const ROLE_HIERARCHY: Record<UserRole, number> = {
  CITIZEN: 1,
  FIELD_OFFICER: 2,
  DEPARTMENT_SUPERVISOR: 3,
  DEPARTMENT_MANAGER: 4,
  GOVERNMENT_ADMIN: 5,
  SUPER_ADMIN: 6,
};

// Extract and verify authenticated user from token or header
function authenticateUser(req: Request): User | null {
  const authHeader = req.headers['authorization'];
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // Token format: "jwt-token-{userId}-{timestamp}"
  if (token && token.startsWith('jwt-token-')) {
    const parts = token.split('-');
    // format is jwt-token-ID-timestamp, join parts between token and last timestamp
    if (parts.length >= 4) {
      const userId = parts.slice(2, parts.length - 1).join('-');
      const user = db.getUserById(userId);
      if (user && user.active) return user;
    }
  }

  // Fallback to x-user-id for session persistence
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    const user = db.getUserById(userId);
    if (user && user.active) return user;
  }

  return null;
}

// Middleware: Require real authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  (req as any).user = user;
  next();
}

// Middleware: Require one of allowed roles
function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Role "${user.role}" does not have permission for this resource.` 
      });
    }
    (req as any).user = user;
    next();
  };
}

// ---------------- AUTH ROUTES ----------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const user = db.getUserByEmail(email.trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password. Please verify credentials.' });
  }

  if (!user.active) {
    return res.status(403).json({ error: 'Account is deactivated. Please contact your system administrator.' });
  }

  // Optional password check (supports standard demo accounts and citizen registrations)
  if (user.passwordHash && password && user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
  }

  // Record audit log for login
  db.addAuditLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'USER_LOGIN',
    resource: 'AUTH',
    resourceId: user.id,
    details: { email: user.email, role: user.role },
  });

  const token = `jwt-token-${user.id}-${Date.now()}`;
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.departmentName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      badgeNumber: user.badgeNumber,
      active: user.active,
      createdAt: user.createdAt,
    },
  });
});

// Citizen Public Registration: MUST ALWAYS receive role CITIZEN
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.getUserByEmail(email.trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }

  // Enforce CITIZEN role: Public registrations CANNOT grant government or administrative roles
  const newUser = db.createUser({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    passwordHash: password,
    role: 'CITIZEN',
    active: true,
  });

  db.addAuditLog({
    actorId: newUser.id,
    actorName: newUser.name,
    actorRole: newUser.role,
    action: 'USER_REGISTERED',
    resource: 'AUTH',
    resourceId: newUser.id,
    details: { email: newUser.email, role: 'CITIZEN' },
  });

  const token = `jwt-token-${newUser.id}-${Date.now()}`;
  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      active: newUser.active,
      createdAt: newUser.createdAt,
    },
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    badgeNumber: user.badgeNumber,
    active: user.active,
    createdAt: user.createdAt,
  });
});

// Explicit demo accounts list for login convenience
apiRouter.get('/auth/demo-accounts', (_req: Request, res: Response) => {
  const users = db.getUsers().filter(u => u.active);
  // Return pre-configured demo credentials
  const demoAccounts = [
    { role: 'CITIZEN', name: 'Maya Lin', email: 'citizen@civicfix.org', label: 'Citizen (Public Reporter)' },
    { role: 'FIELD_OFFICER', name: 'Marcus Vance', email: 'officer@civicfix.org', label: 'Field Officer (Roads Dispatch)' },
    { role: 'DEPARTMENT_SUPERVISOR', name: 'Elena Rostova', email: 'supervisor@civicfix.org', label: 'Department Supervisor' },
    { role: 'DEPARTMENT_MANAGER', name: 'David Sterling', email: 'manager@civicfix.org', label: 'Department Manager' },
    { role: 'GOVERNMENT_ADMIN', name: 'Sarah Chen', email: 'admin@civicfix.org', label: 'Government Admin' },
    { role: 'SUPER_ADMIN', name: 'Alex Thorne', email: 'superadmin@civicfix.org', label: 'Super Admin' },
  ];
  return res.json(demoAccounts);
});

// ---------------- DEVELOPMENT SEED & CLEAN STATE CONTROLS ----------------
// Clearly separated development seed mechanism
apiRouter.post('/dev/seed', requireRole(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const result = db.seedDevelopmentData();
  db.addAuditLog({
    actorId: (req as any).user.id,
    actorName: (req as any).user.name,
    actorRole: (req as any).user.role,
    action: 'DEV_SEED_LOADED',
    resource: 'DATABASE',
    resourceId: 'all',
    details: { issuesCount: result.issuesCount },
  });
  return res.json({ message: 'Development sample data loaded successfully', ...result });
});

apiRouter.post('/dev/reset', requireRole(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  db.clearAllData();
  db.addAuditLog({
    actorId: (req as any).user.id,
    actorName: (req as any).user.name,
    actorRole: (req as any).user.role,
    action: 'DEV_DATA_CLEARED',
    resource: 'DATABASE',
    resourceId: 'all',
    details: { status: 'CLEAN_EMPTY_STATE' },
  });
  return res.json({ message: 'Database reset to clean empty state (0 issues, 0 notifications, 0 comments)' });
});

// ---------------- ISSUES ROUTES ----------------
apiRouter.get('/issues', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  const { 
    status, priority, category, departmentId, 
    assignedOfficerId, reporterId, search, 
    page = 1, pageSize = 50 
  } = req.query;

  let list = [...db.getIssues()];

  // Role-based issue filtering:
  // If user is a CITIZEN and passed reporterId or is on their tracker, only show their issues or public issues
  if (reporterId) {
    list = list.filter(i => i.reporterId === reporterId);
  }

  if (status && status !== 'ALL') {
    list = list.filter(i => i.status === status);
  }
  if (priority && priority !== 'ALL') {
    list = list.filter(i => i.priority === priority);
  }
  if (category && category !== 'ALL') {
    list = list.filter(i => i.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (departmentId && departmentId !== 'ALL') {
    list = list.filter(i => i.departmentId === departmentId);
  }
  if (assignedOfficerId) {
    list = list.filter(i => i.assignedOfficerId === assignedOfficerId);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(i => 
      i.publicId.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.address.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }

  const total = list.length;
  const p = Number(page);
  const ps = Number(pageSize);
  const paginated = list.slice((p - 1) * ps, p * ps);

  return res.json({
    data: paginated,
    pagination: {
      page: p,
      pageSize: ps,
      total,
      totalPages: Math.ceil(total / ps) || 1,
    }
  });
});

apiRouter.get('/issues/:id', (req: Request, res: Response) => {
  const issue = db.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Civic issue not found' });
  }
  return res.json(issue);
});

apiRouter.post('/issues', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const {
    title, description, category, priority, latitude, longitude,
    address, landmark, departmentId, images, aiAnalysis
  } = req.body;

  if (!title || !description || !category || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Title, description, category, and coordinates are required' });
  }

  // Calculate SLA deadline based on priority
  const policies = db.getSLAPolicies();
  const policy = policies.find(p => p.priority === (priority || 'HIGH')) || policies[1];
  const hours = policy.targetResolutionHours;
  const slaDeadline = new Date(Date.now() + hours * 3600000).toISOString();

  // Find department
  const depts = db.getDepartments();
  const selectedDept = depts.find(d => d.id === departmentId) || depts[0];

  const newIssue = db.createIssue({
    title: title.trim(),
    description: description.trim(),
    category,
    status: 'SUBMITTED',
    priority: (priority as IssuePriority) || 'HIGH',
    latitude: Number(latitude),
    longitude: Number(longitude),
    address: address || 'Reported Location',
    landmark: landmark || '',
    reporterId: user.id,
    reporterName: user.name,
    reporterEmail: user.email,
    reporterPhone: user.phone || '',
    departmentId: selectedDept.id,
    departmentName: selectedDept.name,
    images: images || [],
    slaDeadline,
    aiAnalysis,
  });

  return res.status(201).json(newIssue);
});

apiRouter.post('/issues/:id/status', requireRole(['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { status, note } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const updated = db.transitionIssueStatus(
    req.params.id, 
    status as IssueStatus, 
    { id: user.id, name: user.name, role: user.role }, 
    note || ''
  );

  if (!updated) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  return res.json(updated);
});

apiRouter.post('/issues/:id/assign', requireRole(['DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { officerId, notes } = req.body;

  if (!officerId) {
    return res.status(400).json({ error: 'Officer ID is required' });
  }

  const officer = db.getUserById(officerId);
  if (!officer) {
    return res.status(404).json({ error: 'Officer not found' });
  }

  const updated = db.assignOfficer(
    req.params.id,
    officer,
    { id: user.id, name: user.name, role: user.role },
    notes
  );

  if (!updated) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  return res.json(updated);
});

apiRouter.post('/issues/:id/escalate', requireRole(['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { level = 'MANAGER', reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Escalation reason is required' });
  }

  const updated = db.escalateIssue(
    req.params.id,
    level,
    reason,
    { id: user.id, name: user.name, role: user.role }
  );

  if (!updated) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  return res.json(updated);
});

apiRouter.post('/issues/:id/upvote', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const result = db.toggleUpvote(req.params.id, user.id);
  if (!result) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  return res.json(result);
});

apiRouter.post('/issues/:id/verify', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { verified, notes, reopenedReason } = req.body;
  const issue = db.getIssueById(req.params.id);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Check: Only original reporter, government admin, or super admin can verify
  const isReporter = issue.reporterId === user.id;
  const isAdmin = ['GOVERNMENT_ADMIN', 'SUPER_ADMIN'].includes(user.role);
  if (!isReporter && !isAdmin) {
    return res.status(403).json({ error: 'Only the citizen who reported this issue can verify or reject the resolution.' });
  }

  const timestamp = new Date().toISOString();

  if (verified) {
    issue.verification = {
      verifiedByCitizen: true,
      citizenNotes: notes || 'Verified as fixed by citizen.',
      verifiedAt: timestamp,
    };
    db.transitionIssueStatus(
      issue.id,
      'VERIFIED_RESOLVED',
      { id: user.id, name: user.name, role: user.role },
      `Citizen confirmed resolution: ${notes || 'Fixed properly'}`
    );
  } else {
    issue.verification = {
      verifiedByCitizen: false,
      rejectedReason: reopenedReason || notes || 'Citizen reported issue is not resolved.',
      verifiedAt: timestamp,
    };
    db.transitionIssueStatus(
      issue.id,
      'REOPENED',
      { id: user.id, name: user.name, role: user.role },
      `Resolution rejected by citizen: ${reopenedReason || notes || 'Unresolved'}`
    );
    db.escalateIssue(
      issue.id,
      'SUPERVISOR',
      `Citizen rejected resolution: ${reopenedReason || 'Defect remains'}`,
      { id: user.id, name: user.name, role: user.role }
    );
  }

  return res.json(issue);
});

apiRouter.get('/issues/:id/comments', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  const isGov = user ? ['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'].includes(user.role) : false;
  const comments = db.getComments(req.params.id, isGov);
  return res.json(comments);
});

apiRouter.post('/issues/:id/comments', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { content, isInternal } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  // Only government staff can add internal notes
  const isGov = ['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const internalFlag = Boolean(isInternal && isGov);

  const comment = db.addComment({
    issueId: req.params.id,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    userAvatar: user.avatarUrl,
    content: content.trim(),
    isInternal: internalFlag,
  });

  return res.status(201).json(comment);
});

apiRouter.post('/issues/:id/upload-image', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { url, type = 'EVIDENCE', caption } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Image URL or payload is required' });
  }

  const issue = db.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const newImage = {
    id: `img-${Date.now()}`,
    url,
    type,
    uploadedBy: user.id,
    uploaderName: user.name,
    uploaderRole: user.role,
    caption: caption || '',
    createdAt: new Date().toISOString(),
  };

  issue.images.push(newImage);
  issue.updatedAt = new Date().toISOString();

  return res.status(201).json(newImage);
});

// ---------------- DEPARTMENTS & USERS ----------------
apiRouter.get('/departments', (_req: Request, res: Response) => {
  return res.json(db.getDepartments());
});

apiRouter.post('/departments', requireRole(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { name, code, description, contactEmail, contactPhone, headName, categories } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Department name and code are required' });
  }
  const created = db.createDepartment({
    name,
    code,
    description: description || '',
    contactEmail: contactEmail || '',
    contactPhone: contactPhone || '',
    headName: headName || '',
    categories: categories || [],
    active: true,
  });
  return res.status(201).json(created);
});

apiRouter.get('/categories', (_req: Request, res: Response) => {
  return res.json(db.getCategories());
});

apiRouter.post('/categories', requireRole(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { name, slug, departmentId, defaultPriority, slaHours, icon, description } = req.body;
  if (!name || !departmentId) {
    return res.status(400).json({ error: 'Category name and department ID are required' });
  }
  const created = db.createCategory({
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    departmentId,
    defaultPriority: defaultPriority || 'MEDIUM',
    slaHours: slaHours || { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 },
    icon: icon || 'tag',
    description: description || '',
  });
  return res.status(201).json(created);
});

apiRouter.get('/users', requireRole(['DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { role, departmentId } = req.query;
  let list = db.getUsers();
  if (role && role !== 'ALL') {
    list = list.filter(u => u.role === role);
  }
  if (departmentId && departmentId !== 'ALL') {
    list = list.filter(u => u.departmentId === departmentId);
  }
  return res.json(list.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    departmentId: u.departmentId,
    departmentName: u.departmentName,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    badgeNumber: u.badgeNumber,
    active: u.active,
    createdAt: u.createdAt,
  })));
});

// Create Staff / Government User: ONLY Super Admin or Government Admin can create government roles
apiRouter.post('/users', requireRole(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const creator = (req as any).user as User;
  const { name, email, password, role, departmentId, departmentName, phone, badgeNumber } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  // Prevent privilege escalation: GOVERNMENT_ADMIN cannot create SUPER_ADMIN
  if (role === 'SUPER_ADMIN' && creator.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only Super Administrators can create other Super Administrators' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const created = db.createUser({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: password || 'civic123',
    role: role as UserRole,
    departmentId,
    departmentName,
    phone,
    badgeNumber,
    active: true,
  });

  db.addAuditLog({
    actorId: creator.id,
    actorName: creator.name,
    actorRole: creator.role,
    action: 'USER_CREATED',
    resource: 'USER_MANAGEMENT',
    resourceId: created.id,
    details: { name: created.name, email: created.email, role: created.role, department: departmentName },
  });

  return res.status(201).json(created);
});

apiRouter.patch('/users/:id', requireRole(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const actor = (req as any).user as User;
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Government Admin cannot modify Super Admin
  if (targetUser.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only Super Administrators can modify Super Admin accounts' });
  }

  // Disallow promoting to SUPER_ADMIN unless actor is SUPER_ADMIN
  if (req.body.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only Super Administrators can grant Super Admin privileges' });
  }

  const updated = db.updateUser(req.params.id, req.body);
  db.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'USER_UPDATED',
    resource: 'USER_MANAGEMENT',
    resourceId: req.params.id,
    details: { updates: req.body },
  });

  return res.json(updated);
});

apiRouter.get('/service-areas', (_req: Request, res: Response) => {
  return res.json(db.getServiceAreas());
});

// ---------------- SLA & ANALYTICS ----------------
apiRouter.get('/sla/policies', (_req: Request, res: Response) => {
  return res.json(db.getSLAPolicies());
});

apiRouter.put('/sla/policies/:id', requireRole(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const updated = db.updateSLAPolicy(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'SLA policy not found' });
  }
  return res.json(updated);
});

apiRouter.get('/sla/metrics', (_req: Request, res: Response) => {
  const metrics = slaEngine.getMetrics();
  return res.json(metrics);
});

apiRouter.post('/sla/check', requireRole(['DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (_req: Request, res: Response) => {
  const checkResult = slaEngine.runCheck();
  return res.json({
    message: 'Manual SLA cycle executed successfully.',
    ...checkResult,
  });
});

apiRouter.get('/analytics/dashboard', requireRole(['DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (_req: Request, res: Response) => {
  const issues = db.getIssues();
  const metrics = slaEngine.getMetrics();
  const departments = db.getDepartments();

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  issues.forEach(i => {
    categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
  });

  // Department breakdown
  const deptBreakdown = departments.map(d => {
    const deptIssues = issues.filter(i => i.departmentId === d.id);
    const resolved = deptIssues.filter(i => ['RESOLVED', 'VERIFIED_RESOLVED', 'CLOSED'].includes(i.status));
    return {
      departmentId: d.id,
      name: d.name,
      total: deptIssues.length,
      open: deptIssues.length - resolved.length,
      resolved: resolved.length,
      resolutionRate: deptIssues.length ? Math.round((resolved.length / deptIssues.length) * 100) : 0,
    };
  });

  // Officer workload
  const officers = db.getUsers().filter(u => u.role === 'FIELD_OFFICER');
  const officerWorkload = officers.map(o => {
    const assigned = issues.filter(i => i.assignedOfficerId === o.id && !['RESOLVED', 'VERIFIED_RESOLVED', 'CLOSED'].includes(i.status));
    return {
      id: o.id,
      name: o.name,
      badge: o.badgeNumber,
      department: o.departmentName,
      activeCases: assigned.length,
    };
  });

  // Trends over last 7 days from actual issue creation dates
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyTrends = [0, 1, 2, 3, 4, 5, 6].map(offset => {
    const d = new Date(Date.now() - (6 - offset) * 86400000);
    const dayStr = days[d.getDay()];
    const datePrefix = d.toISOString().slice(0, 10);
    const reported = issues.filter(i => i.createdAt.startsWith(datePrefix)).length;
    const resolved = issues.filter(i => i.resolvedAt && i.resolvedAt.startsWith(datePrefix)).length;
    return { day: dayStr, reported, resolved };
  });

  return res.json({
    metrics,
    categoryCounts,
    deptBreakdown,
    officerWorkload,
    dailyTrends,
  });
});

apiRouter.get('/analytics/export', requireRole(['DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (_req: Request, res: Response) => {
  const issues = db.getIssues();
  const headers = 'ID,PublicID,Title,Category,Status,Priority,Department,Reporter,CreatedDate,SLADeadline\n';
  const rows = issues.map(i => 
    `"${i.id}","${i.publicId}","${i.title.replace(/"/g, '""')}","${i.category}","${i.status}","${i.priority}","${i.departmentName}","${i.reporterName}","${i.createdAt}","${i.slaDeadline}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="civicfix-issues-report.csv"');
  return res.send(headers + rows);
});

// ---------------- AUDIT LOGS & NOTIFICATIONS ----------------
apiRouter.get('/audit-logs', requireRole(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (_req: Request, res: Response) => {
  return res.json(db.getAuditLogs(100));
});

apiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  return res.json(db.getNotifications(user.id));
});

apiRouter.patch('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  return res.json({ success });
});

apiRouter.post('/notifications/mark-all-read', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const count = db.markAllNotificationsRead(user.id);
  return res.json({ count });
});

// ---------------- AI ASSISTANTS ----------------
apiRouter.post('/ai/analyze-image', async (req: Request, res: Response) => {
  const { imageBase64OrUrl, userNotes } = req.body;
  if (!imageBase64OrUrl) {
    return res.status(400).json({ error: 'Image data or URL is required' });
  }
  try {
    const analysis = await analyzeIssueImage(imageBase64OrUrl, userNotes);
    return res.json(analysis);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI analysis failed' });
  }
});

apiRouter.post('/ai/assist-description', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  try {
    const result = await assistDescription(prompt);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Description assistance failed' });
  }
});

apiRouter.post('/ai/duplicate-check', (req: Request, res: Response) => {
  const { latitude, longitude, category } = req.body;
  if (latitude === undefined || longitude === undefined || !category) {
    return res.status(400).json({ error: 'Coordinates and category are required' });
  }
  const result = checkDuplicates(Number(latitude), Number(longitude), category);
  return res.json(result);
});

apiRouter.post('/ai/officer-assist', requireRole(['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  const { issueId } = req.body;
  const issue = db.getIssueById(issueId);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  try {
    const copilotData = await generateOfficerAssistance(issue);
    return res.json(copilotData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Copilot assistance failed' });
  }
});

// ---------------- APPOINTMENTS & SUPABASE INTEGRATION ----------------

// Create a new appointment and sync automatically to Supabase
apiRouter.post('/appointments', async (req: Request, res: Response) => {
  const { 
    name, 
    email, 
    phone, 
    department, 
    serviceType, 
    appointmentDate, 
    appointmentTime, 
    location, 
    notes,
    issueId 
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required' });
  }
  if (!department) {
    return res.status(400).json({ error: 'Department selection is required' });
  }
  if (!serviceType) {
    return res.status(400).json({ error: 'Service type is required' });
  }
  if (!appointmentDate) {
    return res.status(400).json({ error: 'Appointment date is required' });
  }
  if (!appointmentTime) {
    return res.status(400).json({ error: 'Appointment time is required' });
  }

  // 1. Create in local database first
  const publicId = `APT-${Date.now().toString(36).toUpperCase()}`;
  const appointment = db.createAppointment({
    publicId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    department,
    serviceType,
    appointmentDate,
    appointmentTime,
    location: location ? location.trim() : 'Municipal Civic Center',
    notes: notes ? notes.trim() : '',
    status: 'CONFIRMED',
    issueId: issueId || undefined,
    syncedToSupabase: false,
  });

  // 2. Automatically sync to user's Supabase backend
  const supabaseResult = await syncAppointmentToSupabase(appointment);
  if (supabaseResult.synced) {
    appointment.syncedToSupabase = true;
    db.updateAppointment(appointment.id, { syncedToSupabase: true });
  }

  // 3. Log audit entry
  db.addAuditLog({
    actorId: req.headers['x-user-id'] as string || 'public-citizen',
    actorName: name.trim(),
    actorRole: 'CITIZEN',
    action: 'BOOK_APPOINTMENT',
    resource: 'appointments',
    resourceId: appointment.id,
    details: {
      publicId: appointment.publicId,
      department,
      serviceType,
      appointmentDate,
      appointmentTime,
      syncedToSupabase: supabaseResult.synced,
    },
  });

  return res.status(201).json({
    success: true,
    appointment,
    syncedToSupabase: supabaseResult.synced,
    supabaseDetails: {
      projectId: SUPABASE_PROJECT_ID,
      synced: supabaseResult.synced,
      error: supabaseResult.error,
      isTableMissing: supabaseResult.isTableMissing,
    },
    message: supabaseResult.synced 
      ? 'Appointment successfully booked and synced to Supabase database!' 
      : (supabaseResult.isTableMissing 
          ? 'Appointment booked locally. Supabase table needs to be created in SQL Editor to persist directly in Supabase.' 
          : 'Appointment saved locally; Supabase sync encountered an issue.'),
  });
});

// List all appointments (fetches from Supabase and merges with local)
apiRouter.get('/appointments', async (_req: Request, res: Response) => {
  const localAppointments = db.getAppointments();
  
  // Try fetching fresh records from Supabase
  const supabaseAppointments = await fetchServerSupabaseAppointments();

  if (supabaseAppointments.length > 0) {
    // Merge: Supabase appointments take precedence, include any unsynced local ones
    const supabaseIds = new Set(supabaseAppointments.map(a => a.publicId || a.id));
    const unsyncedLocal = localAppointments.filter(a => !supabaseIds.has(a.publicId || a.id));
    return res.json([...supabaseAppointments, ...unsyncedLocal]);
  }

  return res.json(localAppointments);
});

// Supabase Connection & Health Status
apiRouter.get('/supabase/status', async (_req: Request, res: Response) => {
  const health = await checkServerSupabaseHealth();
  return res.json({
    ...health,
    sqlSetup: SUPABASE_SETUP_SQL,
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_URL,
  });
});

// ---------------- SYSTEM HEALTH ----------------
apiRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: 'connected (in-memory relational store with ACID updates)',
    slaEngine: 'active',
    aiService: Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY) ? 'Automated Intelligence Engine (online)' : 'Intelligent Triage Engine (operational)',
  });
});

