import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, CheckCircle2, Clock, 
  MapPin, PlusCircle, ArrowRight, ThumbsUp, AlertCircle, LogIn 
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CivicIssue } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface CitizenTrackerViewProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onOpenReport: () => void;
  onOpenLogin?: () => void;
}

export const CitizenTrackerView: React.FC<CitizenTrackerViewProps> = ({
  onSelectIssue,
  onOpenReport,
  onOpenLogin,
}) => {
  const { user, isAuthenticated, showToast } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'VERIFY' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [loading, setLoading] = useState(true);

  const loadMyReports = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Retrieve issues specifically reported by the authenticated citizen
      const res = await api.getIssues({ reporterId: user.id, pageSize: 50 });
      setIssues(res.data);
    } catch (e: any) {
      showToast(e.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyReports();
  }, [user?.id]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Sign In to Access Your Civic Reports
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Sign in or create a citizen account to track real-time repair progress, review work photos, and confirm resolutions.
        </p>
        <div className="pt-2">
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Filter issues
  const pendingVerificationIssues = issues.filter(
    (i) => i.status === 'AWAITING_VERIFICATION' || (i.status === 'RESOLVED' && !i.verification?.verifiedByCitizen)
  );

  const filteredIssues = issues.filter((i) => {
    if (filter === 'VERIFY') {
      return i.status === 'AWAITING_VERIFICATION' || (i.status === 'RESOLVED' && !i.verification?.verifiedByCitizen);
    }
    if (filter === 'IN_PROGRESS') {
      return ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status);
    }
    if (filter === 'RESOLVED') {
      return ['RESOLVED', 'VERIFIED_RESOLVED', 'CLOSED'].includes(i.status);
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" />
            Citizen Tracker & My Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as <strong className="text-slate-800 dark:text-slate-200">{user.name}</strong> ({user.email}). Track and verify issues reported from your account.
          </p>
        </div>

        <button
          onClick={onOpenReport}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report an Issue</span>
        </button>
      </div>

      {/* Action Required Banner if verification needed */}
      {pendingVerificationIssues.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 border border-purple-200 dark:border-purple-800/80 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200">
                  Citizen Sign-off Requested ({pendingVerificationIssues.length} issue)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200 animate-pulse">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Field crews have marked work as completed on your ticket. Please inspect the site and confirm or reopen if unresolved.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {pendingVerificationIssues.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectIssue(p)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{p.publicId}: {p.title.slice(0, 25)}...</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        {[
          { id: 'ALL', label: `All My Reports (${issues.length})` },
          { id: 'VERIFY', label: `Requires Verification (${pendingVerificationIssues.length})` },
          { id: 'IN_PROGRESS', label: 'Under Review / Active' },
          { id: 'RESOLVED', label: 'Completed & Closed' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`px-3 py-2 rounded-xl transition-all ${
              filter === t.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 font-semibold animate-pulse">
          Loading your citizen reports...
        </div>
      ) : issues.length === 0 ? (
        /* Genuine empty state when user hasn't reported issues yet */
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Welcome to CivicFix, {user.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You haven't reported any civic issues yet. Notice a pothole, broken streetlight, or water leak in your neighborhood?
            </p>
          </div>
          <button
            onClick={onOpenReport}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-sky-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report an Issue</span>
          </button>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
            No reports in this category
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any issues matching this filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {issue.publicId}
                  </span>
                  <StatusBadge status={issue.status} size="sm" />
                </div>

                {issue.images.length > 0 && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={issue.images[0].url}
                      alt={issue.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {issue.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {issue.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    {issue.address}
                  </span>
                  <PriorityBadge priority={issue.priority} size="sm" />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-0.5">
                    View Progress <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
