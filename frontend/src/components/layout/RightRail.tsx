import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';
import type { TodayAttendanceResponse, AttendanceSummaryResponse } from '../../types/attendance';
import { formatHours, formatPercent } from '../../utils/format';
import { formatTime } from '../../utils/date';

interface RightRailProps {
  todayData?: TodayAttendanceResponse | null;
  summaryData?: AttendanceSummaryResponse | null;
}

export const RightRail: React.FC<RightRailProps> = ({ todayData, summaryData }) => {
  const { user } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = () => {
    if (!todayData || todayData.status === 'NOT_CLOCKED_IN') {
      return <Badge variant="neutral">Not Started</Badge>;
    }
    if (todayData.status === 'CLOCKED_IN') {
      return <Badge variant="warning">Active Session</Badge>;
    }
    return <Badge variant="success">Completed Today</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Profile Card */}
      <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--primary)',
            letterSpacing: '0.04em',
          }}
        >
          {getInitials(user?.name)}
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {user?.name || 'Trainee'}
        </h3>
        <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '16px' }}>
          {user?.email}
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.813rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          <Award size={16} color="var(--primary)" />
          Target: {formatHours(user?.requiredHours)}
        </div>
      </div>

      {/* Today's Status Widget */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.938rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Session Status
          </span>
          {getStatusBadge()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Clocked In:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {formatTime(todayData?.attendance?.clockInAt)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Clocked Out:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {formatTime(todayData?.attendance?.clockOutAt)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Rendered Today:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              {formatHours(todayData?.attendance?.renderedHours)}
            </span>
          </div>
        </div>

        {summaryData && (
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Overall OJT Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {formatPercent(summaryData.progressPercentage)}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, summaryData.progressPercentage))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), #818cf8)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.5s ease-in-out',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tip / Guidelines Box */}
      <div
        style={{
          background: 'var(--info-light)',
          border: '1px solid var(--info-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <ShieldCheck size={20} color="var(--info)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.813rem', color: 'var(--info-text)', lineHeight: 1.4 }}>
          <strong>PHT Timezone:</strong> All clock events align with official Manila working day schedules.
        </div>
      </div>
    </div>
  );
};
