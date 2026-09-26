import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, MapPin, Calendar, Clock, AlertTriangle, ThumbsUp, 
  Send, Sparkles, ShieldCheck, CheckCircle2, ChevronRight, 
  User, Check, ArrowUpRight, Camera, RefreshCw, MessageSquare, Lock
} from 'lucide-react';
import { CivicIssue, IssueComment, IssueStatus, IssuePriority, User as UserType } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface IssueDetailModalProps {
  issueId: string;
  onClose: () => void;
  onIssueUpdated?: () => void;
  onBookAppointment?: (issueId: string, departmentName: string) => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issueId,
  onClose,
  onIssueUpdated,
  onBookAppointment,
}) => {
  const { user, role, showToast } = useAuth();
  const [issue, setIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'comments' | 'history' | 'copilot'>('details');

  // Verification State
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Officer / Supervisor action states
  const [officersList, setOfficersList] = useState<UserType[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Escalate state
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  // Work Photo Upload state
  const [workPhotoUrl, setWorkPhotoUrl] = useState('');
  const [workPhotoType, setWorkPhotoType] = useState<'BEFORE' | 'AFTER'>('AFTER');
  const [workPhotoCaption, setWorkPhotoCaption] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // AI Copilot state
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotData, setCopilotData] = useState<{
    investigationSteps: string[];
    safetyChecklist: string[];
    recommendedEquipment: string[];
    citizenResponseDraft: string;
  } | null>(null);

  const isGovStaff = Boolean(role && ['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'].includes(role));
  const isSupervisorOrAbove = Boolean(role && ['DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'].includes(role));

  const fetchIssueData = async () => {
    try {
      setLoading(true);
      const data = await api.getIssueById(issueId);
      setIssue(data);
      const c = await api.getComments(issueId);
      setComments(c);
    } catch (err: any) {
      showToast(err.message || 'Failed to load issue details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueData();
  }, [issueId]);

  useEffect(() => {
    if (isSupervisorOrAbove) {
      api.getUsers({ role: 'FIELD_OFFICER' }).then(setOfficersList).catch(() => {});
    }
  }, [role]);

  if (loading || !issue) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading civic report details...</p>
        </div>
      </div>
    );
  }

  // SLA calculations
  const now = new Date().getTime();
  const deadline = new Date(issue.slaDeadline).getTime();
  const isOverdue = now > deadline && !['RESOLVED', 'AWAITING_VERIFICATION', 'VERIFIED_RESOLVED', 'CLOSED'].includes(issue.status);
  const hoursLeft = Math.round(Math.abs(deadline - now) / 3600000);

  // Status transitions handlers
  const handleStatusChange = async (newStatus: IssueStatus, note: string) => {
    try {
      const updated = await api.updateStatus(issue.id, newStatus, note);
      setIssue(updated);
      showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      if (onIssueUpdated) onIssueUpdated();
      fetchIssueData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleVerify = async (verified: boolean) => {
    try {
      if (verified) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      const updated = await api.verifyIssue(issue.id, verified, verified ? 'Verified clean resolution' : rejectReason, rejectReason);
      setIssue(updated);
      setShowRejectForm(false);
      showToast(verified ? 'Thank you! Issue marked as verified & fixed.' : 'Issue reopened and escalated for re-inspection.', verified ? 'success' : 'info');
      if (onIssueUpdated) onIssueUpdated();
      fetchIssueData();
    } catch (err: any) {
      showToast(err.message || 'Verification update failed', 'error');
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await api.toggleUpvote(issue.id);
      setIssue(prev => prev ? {
        ...prev,
        upvotesCount: res.count,
        upvotedByUserIds: res.upvoted 
          ? [...prev.upvotedByUserIds, user?.id || ''] 
          : prev.upvotedByUserIds.filter(id => id !== user?.id)
      } : null);
      showToast(res.upvoted ? 'You supported this civic report' : 'Support removed');
      if (onIssueUpdated) onIssueUpdated();
    } catch (err: any) {
      showToast(err.message || 'Upvote failed', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const added = await api.addComment(issue.id, newComment.trim(), isInternalComment);
      setComments(prev => [...prev, added]);
      setNewComment('');
      showToast(isInternalComment ? 'Internal note added' : 'Public comment posted');
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    }
  };

  const handleAssignOfficer = async () => {
    if (!selectedOfficerId) return;
    try {
      const updated = await api.assignOfficer(issue.id, selectedOfficerId, assignmentNote);
      setIssue(updated);
      setIsAssigning(false);
      setAssignmentNote('');
      showToast('Field officer successfully assigned');
      if (onIssueUpdated) onIssueUpdated();
      fetchIssueData();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign officer', 'error');
    }
  };

  const handleEscalate = async () => {
    if (!escalateReason.trim()) return;
    try {
      const updated = await api.escalateIssue(issue.id, 'MANAGER', escalateReason);
      setIssue(updated);
      setIsEscalating(false);
      setEscalateReason('');
      showToast('Issue escalated to Department Leadership');
      if (onIssueUpdated) onIssueUpdated();
      fetchIssueData();
    } catch (err: any) {
      showToast(err.message || 'Failed to escalate issue', 'error');
    }
  };

  const handleUploadWorkPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workPhotoUrl.trim()) return;
    try {
      await api.uploadIssueImage(issue.id, workPhotoUrl.trim(), workPhotoType, workPhotoCaption);
      setWorkPhotoUrl('');
      setWorkPhotoCaption('');
      setIsUploadingPhoto(false);
      showToast(`${workPhotoType} photo evidence uploaded`);
      fetchIssueData();
      if (onIssueUpdated) onIssueUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    }
  };

  const handleLoadCopilot = async () => {
    try {
      setCopilotLoading(true);
      const data = await api.getOfficerAssistance(issue.id);
      setCopilotData(data);
    } catch (err: any) {
      showToast(err.message || 'AI Copilot generation failed', 'error');
    } finally {
      setCopilotLoading(false);
    }
  };

  const hasUpvoted = user && issue.upvotedByUserIds.includes(user.id);

  // Status Stepper Data
  const lifecycleSteps = [
    { status: 'SUBMITTED', label: 'Reported' },
    { status: 'UNDER_REVIEW', label: 'Review' },
    { status: 'ASSIGNED', label: 'Assigned' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'RESOLVED', label: 'Resolved' },
    { status: 'VERIFIED_RESOLVED', label: 'Verified & Closed' },
  ];

  const getStepStatus = (stepStatus: string) => {
    const order = ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'RESOLVED', 'VERIFIED_RESOLVED', 'CLOSED'];
    const currentIndex = order.indexOf(issue.status);
    const stepIndex = order.indexOf(stepStatus);
    if (issue.status === 'REOPENED') return 'reopened';
    if (currentIndex > stepIndex) return 'complete';
    if (currentIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {issue.publicId}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {issue.departmentName}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {issue.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                {issue.address}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {isOverdue ? (
                  <span className="text-rose-600 dark:text-rose-400">OVERDUE by {hoursLeft}h</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">SLA: {hoursLeft}h remaining</span>
                )}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Stepper Tracker */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {lifecycleSteps.map((s, idx) => {
              const state = getStepStatus(s.status);
              return (
                <div key={s.status} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        state === 'complete'
                          ? 'bg-emerald-600 text-white'
                          : state === 'current'
                          ? 'bg-sky-600 text-white ring-4 ring-sky-100 dark:ring-sky-950 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {state === 'complete' ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1 whitespace-nowrap">
                      {s.label}
                    </span>
                  </div>
                  {idx < lifecycleSteps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded ${
                        state === 'complete' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          {[
            { id: 'details', label: 'Overview & Details' },
            { id: 'photos', label: `Evidence & Photos (${issue.images.length})` },
            { id: 'comments', label: `Discussions (${comments.length})` },
            { id: 'history', label: `Audit Timeline (${issue.statusHistory.length})` },
            ...(isGovStaff ? [{ id: 'copilot', label: 'AI Copilot Assistant' }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 px-3 border-b-2 transition-all ${
                activeTab === t.id
                  ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* CITIZEN VERIFICATION BANNER */}
          {(issue.status === 'AWAITING_VERIFICATION' || issue.status === 'RESOLVED') && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/60 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Citizen Verification Required: Is this problem fixed?
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    The field officer has submitted resolution evidence. As a community member, please confirm if the issue has been completely fixed.
                  </p>
                  
                  {!showRejectForm ? (
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => handleVerify(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Yes, Completely Fixed
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all"
                      >
                        No, Still Exists / Reopen
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Please describe why this issue is not fixed yet..."
                        rows={2}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerify(false)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                        >
                          Submit Reopen Request
                        </button>
                        <button
                          onClick={() => setShowRejectForm(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description & AI Vision summary */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Citizen Report Description
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {issue.description}
                </p>
                {issue.landmark && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Landmark:</span> {issue.landmark}
                  </p>
                )}

                {/* AI Analysis Card */}
                {issue.aiAnalysis && (
                  <div className="mt-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-sky-900 dark:text-sky-300">
                          AI Vision & Routing Analysis
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-200/60 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                          {issue.aiAnalysis.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-sky-800/90 dark:text-sky-200/90 leading-relaxed">
                        {issue.aiAnalysis.reasoningSummary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Book Inspection / Consultation Action */}
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                      Need an In-Person Inspection or Consultation?
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Book an official appointment directly with {issue.departmentName} with immediate confirmation.
                    </span>
                  </div>
                  {onBookAppointment && (
                    <button
                      onClick={() => {
                        onClose();
                        onBookAppointment(issue.publicId || issue.id, issue.departmentName);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Appointment</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Assignment & Personnel info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Assigned Field Officer
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                        {issue.assignedOfficerName ? issue.assignedOfficerName.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {issue.assignedOfficerName || 'Unassigned'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {issue.departmentName}
                        </div>
                      </div>
                    </div>
                    {isSupervisorOrAbove && (
                      <button
                        onClick={() => setIsAssigning(!isAssigning)}
                        className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {issue.assignedOfficerId ? 'Reassign' : 'Assign'}
                      </button>
                    )}
                  </div>

                  {/* Assign Officer Drawer */}
                  {isAssigning && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <select
                        value={selectedOfficerId}
                        onChange={(e) => setSelectedOfficerId(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">Select Field Officer...</option>
                        {officersList.map((off) => (
                          <option key={off.id} value={off.id}>
                            {off.name} ({off.badgeNumber || 'Officer'})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Optional assignment note / instructions"
                        value={assignmentNote}
                        onChange={(e) => setAssignmentNote(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setIsAssigning(false)}
                          className="px-2.5 py-1 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAssignOfficer}
                          disabled={!selectedOfficerId}
                          className="px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          Confirm Assignment
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Community Endorsements
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-sky-600" />
                        {issue.upvotesCount} Citizens Affected
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {issue.linkedIssuesCount} nearby linked reports
                      </div>
                    </div>
                    <button
                      onClick={handleUpvote}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        hasUpvoted
                          ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {hasUpvoted ? 'Supported' : 'Support Issue'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Controls for Staff */}
              {isGovStaff && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Officer Field Operations
                    </span>
                    <button
                      onClick={() => setIsUploadingPhoto(!isUploadingPhoto)}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Upload Work Photo
                    </button>
                  </div>

                  {/* Photo Upload Form */}
                  {isUploadingPhoto && (
                    <form onSubmit={handleUploadWorkPhoto} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Attach Work Site Photo Evidence
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={workPhotoType}
                          onChange={(e) => setWorkPhotoType(e.target.value as any)}
                          className="p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value="BEFORE">Before Work Photo</option>
                          <option value="AFTER">After / Resolution Photo</option>
                        </select>
                        <input
                          type="url"
                          placeholder="Photo URL (https://...)"
                          value={workPhotoUrl}
                          onChange={(e) => setWorkPhotoUrl(e.target.value)}
                          required
                          className="p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Caption / Work description (e.g. Asphalting completed)"
                        value={workPhotoCaption}
                        onChange={(e) => setWorkPhotoCaption(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsUploadingPhoto(false)}
                          className="px-3 py-1.5 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold"
                        >
                          Save Photo
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Quick Status Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {issue.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange('IN_PROGRESS', 'Field officer on site and started work operations.')}
                        className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        Start Work
                      </button>
                    )}
                    {issue.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange('ON_HOLD', 'Work paused due to material shipment or weather.')}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        Pause / On Hold
                      </button>
                    )}
                    {issue.status !== 'RESOLVED' && issue.status !== 'AWAITING_VERIFICATION' && issue.status !== 'VERIFIED_RESOLVED' && (
                      <button
                        onClick={() => handleStatusChange('AWAITING_VERIFICATION', 'Officer completed repair. Awaiting citizen confirmation.')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark as Resolved
                      </button>
                    )}
                    <button
                      onClick={() => setIsEscalating(!isEscalating)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Escalate
                    </button>
                  </div>

                  {/* Escalation Box */}
                  {isEscalating && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2 mt-2">
                      <input
                        type="text"
                        placeholder="Reason for escalation (e.g. Major structural failure, blocked transit line)"
                        value={escalateReason}
                        onChange={(e) => setEscalateReason(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsEscalating(false)}
                          className="px-3 py-1 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleEscalate}
                          disabled={!escalateReason.trim()}
                          className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                        >
                          Submit Escalation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {issue.images.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No photographic evidence attached yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {issue.images.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.caption || 'Civic evidence'}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <span
                          className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            img.type === 'AFTER'
                              ? 'bg-emerald-600 text-white'
                              : img.type === 'BEFORE'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-900/80 text-white'
                          }`}
                        >
                          {img.type}
                        </span>
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {img.caption || 'Attached Evidence'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Uploaded by {img.uploaderName} ({img.uploaderRole.replace(/_/g, ' ')}) on{' '}
                          {new Date(img.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No comments yet. Start the conversation.
                  </div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-2xl border text-xs ${
                        c.isInternal
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {c.userName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium uppercase">
                            {c.userRole.replace(/_/g, ' ')}
                          </span>
                          {c.isInternal && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                              <Lock className="w-3 h-3" /> Internal Government Note
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {isGovStaff && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      Mark as Internal Government Note (hidden from citizens)
                    </label>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isInternalComment ? 'Add internal crew note...' : 'Write a public comment or question...'}
                    className="flex-1 p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: AUDIT TIMELINE */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {issue.statusHistory.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-sky-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Status changed to {item.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {item.note}
                      </p>
                      <p className="text-[10px] text-slate-400 pt-1">
                        By {item.changedByName} ({item.changedByRole.replace(/_/g, ' ')})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AI COPILOT */}
          {activeTab === 'copilot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    Field Officer AI Assistant
                  </h4>
                  <p className="text-xs text-slate-500">
                    Generates standardized investigation procedures, site safety checklists, and citizen communication drafts.
                  </p>
                </div>
                <button
                  onClick={handleLoadCopilot}
                  disabled={copilotLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${copilotLoading ? 'animate-spin' : ''}`} />
                  {copilotData ? 'Regenerate' : 'Generate Copilot Brief'}
                </button>
              </div>

              {copilotLoading && (
                <div className="p-12 text-center text-xs text-slate-500 font-semibold animate-pulse">
                  Generating field protocols and safety equipment checklists...
                </div>
              )}

              {copilotData && !copilotLoading && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 space-y-2">
                    <div className="text-xs font-bold text-sky-900 dark:text-sky-300">
                      Recommended Investigation & Repair Protocol
                    </div>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                      {copilotData.investigationSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Site Safety Checklist
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {copilotData.safetyChecklist.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Recommended Equipment
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {copilotData.recommendedEquipment.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Draft Citizen Progress Communication
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      "{copilotData.citizenResponseDraft}"
                    </p>
                    <button
                      onClick={() => {
                        setNewComment(copilotData.citizenResponseDraft);
                        setActiveTab('comments');
                      }}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Use as Public Comment →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Report ID: {issue.id} • SLA Target: {issue.priority}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
