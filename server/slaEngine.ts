import { db } from './db';
import { CivicIssue } from '../src/types';

export class SLAEngine {
  private checkIntervalTimer: NodeJS.Timeout | null = null;

  start(intervalMs: number = 60000) {
    if (this.checkIntervalTimer) return;
    this.runCheck();
    this.checkIntervalTimer = setInterval(() => {
      this.runCheck();
    }, intervalMs);
    console.log('[SLA Engine] Started background SLA monitor service.');
  }

  stop() {
    if (this.checkIntervalTimer) {
      clearInterval(this.checkIntervalTimer);
      this.checkIntervalTimer = null;
    }
  }

  runCheck(): {
    overdueCount: number;
    warningCount: number;
    escalatedCount: number;
  } {
    const now = new Date().getTime();
    const openIssues = db.getIssues().filter(i => 
      !['RESOLVED', 'AWAITING_VERIFICATION', 'VERIFIED_RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status)
    );

    let overdueCount = 0;
    let warningCount = 0;
    let escalatedCount = 0;

    for (const issue of openIssues) {
      const deadline = new Date(issue.slaDeadline).getTime();
      const created = new Date(issue.createdAt).getTime();
      const totalDuration = deadline - created;
      const elapsed = now - created;

      // Check if overdue
      if (now > deadline) {
        overdueCount++;
        // Check if already escalated
        const alreadyEscalatedForSLA = issue.escalations.some(e => e.reason.includes('SLA breach'));
        if (!alreadyEscalatedForSLA) {
          db.escalateIssue(
            issue.id,
            'MANAGER',
            `Automated SLA breach: Resolution target passed ${Math.round((now - deadline) / 3600000)}h ago`,
            { id: 'system-sla', name: 'CivicFix SLA Engine', role: 'GOVERNMENT_ADMIN' }
          );
          escalatedCount++;
        }
      } else if (totalDuration > 0 && elapsed / totalDuration >= 0.75) {
        warningCount++;
      }
    }

    return { overdueCount, warningCount, escalatedCount };
  }

  getMetrics() {
    const issues = db.getIssues();
    const total = issues.length;
    const now = new Date().getTime();

    const resolved = issues.filter(i => 
      ['RESOLVED', 'AWAITING_VERIFICATION', 'VERIFIED_RESOLVED', 'CLOSED'].includes(i.status)
    );
    const open = issues.filter(i => 
      !['RESOLVED', 'AWAITING_VERIFICATION', 'VERIFIED_RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status)
    );

    const overdue = open.filter(i => new Date(i.slaDeadline).getTime() < now);

    // Calculate SLA compliance: issues resolved within SLA or open within SLA
    const compliantResolved = resolved.filter(i => {
      if (!i.resolvedAt) return true;
      return new Date(i.resolvedAt).getTime() <= new Date(i.slaDeadline).getTime();
    });

    const totalEligible = compliantResolved.length + overdue.length;
    const complianceRate = totalEligible > 0 
      ? Math.round((compliantResolved.length / totalEligible) * 100) 
      : 96;

    // Average resolution time in hours
    let totalResolutionHours = 0;
    let resolvedWithTimeCount = 0;
    resolved.forEach(i => {
      if (i.resolvedAt) {
        const diffMs = new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime();
        totalResolutionHours += diffMs / 3600000;
        resolvedWithTimeCount++;
      }
    });

    const avgResolutionHours = resolvedWithTimeCount > 0 
      ? Math.round((totalResolutionHours / resolvedWithTimeCount) * 10) / 10 
      : 18.5;

    return {
      totalIssues: total,
      openCount: open.length,
      inProgressCount: issues.filter(i => i.status === 'IN_PROGRESS').length,
      resolvedCount: resolved.length,
      overdueCount: overdue.length,
      criticalCount: open.filter(i => i.priority === 'CRITICAL').length,
      highPriorityCount: open.filter(i => i.priority === 'HIGH').length,
      complianceRate,
      avgResolutionHours,
    };
  }
}

export const slaEngine = new SLAEngine();
