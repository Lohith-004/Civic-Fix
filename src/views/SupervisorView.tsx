import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, AlertTriangle, Clock, 
  CheckCircle2, ArrowRight, UserCheck, RefreshCw, 
  ShieldAlert, Filter, Search 
} from 'lucide-react';
import { CivicIssue, User as UserType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface SupervisorViewProps {
  onSelectIssue: (issue: CivicIssue) => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({ onSelectIssue }) => {
  const { user, showToast } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [officers, setOfficers] = useState<UserType[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Quick assignment modal
  const [assigningIssue, setAssigningIssue] = useState<CivicIssue | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getIssues({ pageSize: 50 });
      setIssues(res.data);
      const offs = await api.getUsers({ role: 'FIELD_OFFICER' });
      setOfficers(offs);
      const metrics = await api.getSLAMetrics();
      setSlaMetrics(metrics);
    } catch (e: any) {
      showToast(e.message || 'Failed to load supervisor data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSLACheck = async () => {
    try {
      const res = await api.triggerSLACheck();
      showToast(`SLA cycle executed: ${res.overdueCount} overdue, ${res.escalatedCount} auto-escalated.`);
      loadData();
    } catch (e: any) {
      showToast(e.message || 'SLA check failed', 'error');
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assigningIssue || !selectedOfficerId) return;
    try {
      await api.assignOfficer(assigningIssue.id, selectedOfficerId, assignmentNote);
      showToast(`Officer assigned to ${assigningIssue.publicId}`, 'success');
      setAssigningIssue(null);
      setSelectedOfficerId('');
      setAssignmentNote('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign officer', 'error');
    }
  };

  const filteredIssues = issues.filter((i) => {
    if (filterPriority !== 'ALL' && i.priority !== filterPriority) return false;
    if (filterStatus !== 'ALL' && i.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.publicId.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate workloads
  const officerWorkload = officers.map((o) => {
    const activeCases = issues.filter(
      (i) => i.assignedOfficerId === o.id && !['RESOLVED', 'VERIFIED_RESOLVED', 'CLOSED'].includes(i.status)
    ).length;
    return {
      ...o,
      activeCases,
      loadStatus: activeCases >= 4 ? 'HIGH' : activeCases >= 2 ? 'MEDIUM' : 'OPTIMAL',
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Supervisor Dispatch & Operations Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time triage queue, officer workloads, SLA warnings, and municipal escalations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSLACheck}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Run SLA Audit</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SLA Alert Strip */}
      {slaMetrics && slaMetrics.overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                SLA Alert: {slaMetrics.overdueCount} issues have exceeded target resolution deadlines!
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400">
                Automatic escalations have been triggered to department leadership.
              </div>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('OVERDUE')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0"
          >
            Filter Overdue
          </button>
        </div>
      )}

      {/* Main Grid: Workload Monitor + Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Officer Workload Monitor */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                Field Officer Workloads
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {officers.length} On Duty
              </span>
            </div>

            <div className="space-y-3">
              {officerWorkload.map((off) => (
                <div
                  key={off.id}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                      {off.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {off.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {off.badgeNumber || 'Officer'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        off.loadStatus === 'HIGH'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                          : off.loadStatus === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}
                    >
                      {off.activeCases} active {off.activeCases === 1 ? 'case' : 'cases'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          {slaMetrics && (
            <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Department Compliance Rate
              </div>
              <div className="text-3xl font-black text-indigo-400">
                {slaMetrics.complianceRate}%
              </div>
              <p className="text-xs text-slate-400">
                Average resolution turnaround is currently <strong className="text-white">{slaMetrics.avgResolutionHours} hours</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Department Issue Queue */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket queue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="p-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted (Unassigned)</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
              <option value="VERIFIED_RESOLVED">Verified & Closed</option>
            </select>
          </div>

          {/* Queue List */}
          <div className="space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No issues have been reported yet
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Issues will appear here when citizens submit reports or when assigned to your department.
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:shadow-md transition-all cursor-pointer space-y-2.5"
                >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {issue.publicId}
                    </span>
                    <PriorityBadge priority={issue.priority} size="sm" />
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-400">
                    SLA Deadline: {new Date(issue.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {issue.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {issue.address}
                    </p>
                  </div>

                  {/* Assign Officer Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssigningIssue(issue);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{issue.assignedOfficerName ? 'Reassign' : 'Assign'}</span>
                  </button>
                </div>

                {issue.assignedOfficerName && (
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>Officer: <strong className="text-slate-700 dark:text-slate-300">{issue.assignedOfficerName}</strong></span>
                    <span>{issue.statusHistory.length} timeline events</span>
                  </div>
                )}
              </div>
            )))}
          </div>
        </div>
      </div>

      {/* Assignment Modal Drawer */}
      {assigningIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assign Field Officer to {assigningIssue.publicId}
            </h3>
            <p className="text-xs text-slate-500">
              "{assigningIssue.title}"
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Available Officer
              </label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Choose an officer...</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.badgeNumber || 'RPW'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Instructions / Work Notes
              </label>
              <textarea
                value={assignmentNote}
                onChange={(e) => setAssignmentNote(e.target.value)}
                placeholder="Specific safety gear or equipment required..."
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAssigningIssue(null)}
                className="px-4 py-2 text-xs text-slate-400 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!selectedOfficerId}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs disabled:opacity-50"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
