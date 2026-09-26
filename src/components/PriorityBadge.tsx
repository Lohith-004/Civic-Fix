import React from 'react';
import { IssuePriority } from '../types';

interface PriorityBadgeProps {
  priority: IssuePriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const cfg = {
    CRITICAL: {
      label: 'Critical',
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
      dot: 'bg-rose-500 animate-ping',
    },
    HIGH: {
      label: 'High',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
      dot: 'bg-amber-500',
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900',
      dot: 'bg-sky-500',
    },
    LOW: {
      label: 'Low',
      bg: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800',
      dot: 'bg-slate-400',
    },
  }[priority] || {
    label: priority,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-medium uppercase tracking-wider ${cfg.bg} ${pad}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};
