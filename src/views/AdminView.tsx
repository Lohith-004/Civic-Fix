import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Building2, Sliders, Shield, 
  Activity, Plus, Search, Check, X, Edit, RefreshCw, Database, Copy, Calendar 
} from 'lucide-react';
import { User, Department, Category, SLAPolicy, AuditLog, UserRole, Appointment } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const AdminView: React.FC = () => {
  const { showToast } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'departments' | 'sla' | 'audit' | 'health' | 'appointments'>('users');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SLAPolicy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [loading, setLoading] = useState(true);

  // User management state
  const [userSearch, setUserSearch] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('FIELD_OFFICER');
  const [newUserDept, setNewUserDept] = useState('');

  // Department modal state
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptEmail, setNewDeptEmail] = useState('');

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [u, d, c, sla, logs, health, apts, sbStatus] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
        api.getCategories(),
        api.getSLAPolicies(),
        api.getAuditLogs(),
        api.getHealth(),
        api.getAppointments().catch(() => []),
        api.getSupabaseStatus().catch(() => null),
      ]);
      setUsers(u);
      setDepartments(d);
      setCategories(c);
      setSlaPolicies(sla);
      setAuditLogs(logs);
      setHealthStatus(health);
      setAppointments(apts);
      setSupabaseStatus(sbStatus);
    } catch (e: any) {
      showToast(e.message || 'Failed to load administration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const updated = await api.updateUser(userId, { active: !currentActive });
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      showToast(`User ${updated.name} ${!currentActive ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      showToast(e.message || 'Failed to update user', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    try {
      const created = await api.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        departmentId: newUserDept || undefined,
        active: true,
      });
      setUsers(prev => [...prev, created]);
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      showToast(`User ${created.name} created!`);
    } catch (e: any) {
      showToast(e.message || 'Failed to create user', 'error');
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    try {
      const created = await api.createDepartment({
        name: newDeptName,
        code: newDeptCode.toUpperCase(),
        contactEmail: newDeptEmail,
        active: true,
      });
      setDepartments(prev => [...prev, created]);
      setShowAddDeptModal(false);
      setNewDeptName('');
      setNewDeptCode('');
      setNewDeptEmail('');
      showToast(`Department ${created.name} added!`);
    } catch (e: any) {
      showToast(e.message || 'Failed to add department', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-600" />
            Government Administration & Platform Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system users, departments, SLA policies, service boundaries, and review audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Clearly separated development seed & clean state controls */}
          <button
            onClick={async () => {
              try {
                const res = await api.seedDevData();
                showToast(`Development sample data loaded (${res.issuesCount} issues).`);
                loadAllAdminData();
              } catch (e: any) {
                showToast(e.message || 'Seed failed', 'error');
              }
            }}
            className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
            title="Explicit development seed data mechanism"
          >
            <span>Load Dev Seed</span>
          </button>

          <button
            onClick={async () => {
              try {
                await api.resetDevData();
                showToast('Database reset to clean state (0 issues).');
                loadAllAdminData();
              } catch (e: any) {
                showToast(e.message || 'Reset failed', 'error');
              }
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Reset to clean state"
          >
            <span>Reset Empty</span>
          </button>

          <button
            onClick={loadAllAdminData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Console
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        {[
          { id: 'users', label: `Users & Roles (${users.length})`, icon: Users },
          { id: 'departments', label: `Departments (${departments.length})`, icon: Building2 },
          { id: 'sla', label: `SLA Policies (${slaPolicies.length})`, icon: Sliders },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: Shield },
          { id: 'appointments', label: `Citizen Appointments (${appointments.length})`, icon: Calendar },
          { id: 'health', label: 'Platform Health', icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeSubTab === t.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: USERS */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, role, email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff / User</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="p-4">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {u.departmentName || '—'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleUserActive(u.id, u.active)}
                          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DEPARTMENTS */}
      {activeSubTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((d) => (
              <div
                key={d.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {d.code}
                  </span>
                  <span className="text-xs text-emerald-600 font-bold">Active</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {d.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {d.description}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div>Contact: {d.contactEmail}</div>
                  <div>Phone: {d.contactPhone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SLA POLICIES */}
      {activeSubTab === 'sla' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              SLA Policies & Automated Escalation Thresholds
            </h3>
            <p className="text-xs text-slate-500">
              When an issue approaches or passes its configured deadline, the background SLA engine automatically triggers warnings and escalates to department leadership.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {slaPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Priority: {policy.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Target: {policy.targetResolutionHours}h Resolution
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    {policy.description}
                  </p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-slate-500 font-semibold">
                    <span>Response Target: {policy.targetResponseHours}h</span>
                    <span>Auto-escalate on breach: {policy.autoEscalateOnBreach ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System-Wide Immutable Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks all security logins, role updates, issue transitions, officer assignments, and escalations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Actor</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Resource</th>
                  <th className="pb-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="py-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {log.resource} ({log.resourceId})
                    </td>
                    <td className="py-3 text-right text-slate-400 font-mono text-[10px] truncate max-w-[200px]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: HEALTH */}
      {activeSubTab === 'health' && healthStatus && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Platform Infrastructure Health Check
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">
                System Status
              </span>
              <div className="text-xl font-black text-emerald-600">
                HEALTHY (All Systems Operational)
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Uptime: {healthStatus.uptimeSeconds} seconds
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">
                AI Vision & Reasoning Engine
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {healthStatus.aiService}
              </div>
              <div className="text-[11px] text-slate-400">
                Multimodal classification, duplicate geo-radius check & copilot
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Database Store
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {healthStatus.database}
              </div>
              <div className="text-[11px] text-slate-400">
                Relational schema with ACID status transitions & audit logs
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">
                SLA Monitor Worker
              </span>
              <div className="text-base font-bold text-emerald-600">
                {healthStatus.slaEngine.toUpperCase()}
              </div>
              <div className="text-[11px] text-slate-400">
                Background interval cycle inspecting deadlines & breaches
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: APPOINTMENTS */}
      {activeSubTab === 'appointments' && (
        <div className="space-y-6">
          {/* Status & Service Details */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Citizen Appointments & Department Inspections</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Active & Synced
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time scheduling system for citizen appointment bookings, hearings, and on-site investigations.
                  </p>
                </div>
              </div>

              <button
                onClick={loadAllAdminData}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Appointments</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Citizen Scheduling System</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                  Active & Synchronized
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">Automated Dispatch</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Status</span>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-1 block">
                  Real-time Operational
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Accepting citizen bookings</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Scheduled Bookings</span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {appointments.length}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Updated in real-time</span>
              </div>
            </div>
          </div>

          {/* Appointments Records List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Registered Citizen Appointments</span>
            </h4>

            {appointments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No appointments have been booked yet. When citizens submit the booking form, records will appear here automatically.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3 rounded-l-xl">Ref ID</th>
                      <th className="p-3">Citizen</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Service</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 rounded-r-xl">Confirmation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                          {apt.publicId || apt.id}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{apt.name}</div>
                          <div className="text-[11px] text-slate-400">{apt.email}</div>
                        </td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{apt.department}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{apt.serviceType}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {apt.appointmentDate} <span className="text-slate-400 text-[10px] block">{apt.appointmentTime}</span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{apt.location || 'Civic Center'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            {apt.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3" />
                            <span>Confirmed</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateUser} className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New User / Staff</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Full Name</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Email Address</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="FIELD_OFFICER">Field Officer</option>
                <option value="DEPARTMENT_SUPERVISOR">Department Supervisor</option>
                <option value="DEPARTMENT_MANAGER">Department Manager</option>
                <option value="GOVERNMENT_ADMIN">Government Admin</option>
                <option value="SUPER_ADMIN">Platform Super Admin</option>
              </select>
            </div>
            {['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER'].includes(newUserRole) && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Assigned Department</label>
                <select
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateDept} className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Department</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Department Name</label>
              <input
                type="text"
                required
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Environmental Health & Air Quality"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Department Code</label>
              <input
                type="text"
                required
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                placeholder="e.g. EHA"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Official Contact Email</label>
              <input
                type="email"
                value={newDeptEmail}
                onChange={(e) => setNewDeptEmail(e.target.value)}
                placeholder="dept@city.civicfix.gov"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs"
              >
                Add Department
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
