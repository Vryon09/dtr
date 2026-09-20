import React, { useState, useEffect } from 'react';
import { Play, Square, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { TodayAttendanceResponse } from '../../types/attendance';
import { calculateElapsedSeconds, formatDuration, formatTime } from '../../utils/date';

interface ClockCardProps {
  todayData: TodayAttendanceResponse | null;
  onClockIn: (notes?: string) => Promise<void>;
  onClockOut: (notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const ClockCard: React.FC<ClockCardProps> = ({
  todayData,
  onClockIn,
  onClockOut,
  isLoading = false,
}) => {
  const [notes, setNotes] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    }).format(new Date())
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const status = todayData?.status || 'NOT_CLOCKED_IN';
  const attendance = todayData?.attendance;

  // Real-time Manila digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila',
        }).format(now)
      );
    };
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Elapsed session timer if CLOCKED_IN
  useEffect(() => {
    if (status !== 'CLOCKED_IN' || !attendance?.clockInAt) {
      return;
    }
    const updateElapsed = () => {
      setElapsedSeconds(calculateElapsedSeconds(attendance.clockInAt));
    };
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [status, attendance?.clockInAt]);

  const handleClockIn = async () => {
    setActionError(null);
    try {
      await onClockIn(notes.trim() || undefined);
      setNotes('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    setActionError(null);
    try {
      await onClockOut(notes.trim() || undefined);
      setNotes('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to clock out');
    }
  };

  return (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 className="card-title" style={{ fontSize: '1.25rem' }}>
            Daily Time Tracker
          </h2>
          <p className="card-subtitle">Log your daily OJT working hours and session notes</p>
        </div>

        <div>
          {status === 'NOT_CLOCKED_IN' && <Badge variant="neutral">Not Clocked In</Badge>}
          {status === 'CLOCKED_IN' && (
            <Badge variant="warning" icon={<Sparkles size={14} />}>
              Active Session
            </Badge>
          )}
          {status === 'CLOCKED_OUT' && <Badge variant="success">Completed for Today</Badge>}
        </div>
      </div>

      {actionError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--danger-light)',
            color: 'var(--danger-text)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Clock display banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          color: 'white',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 8px 24px -4px rgba(67, 56, 202, 0.35)',
        }}
      >
        <div style={{ fontSize: '0.813rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c7d2fe', fontWeight: 600 }}>
          Philippine Standard Time
        </div>
        <div
          className="digital-clock-time"
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '8px 0',
          }}
        >
          {currentTime || '--:--:-- --'}
        </div>

        {status === 'CLOCKED_IN' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              marginTop: '8px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Elapsed: {formatDuration(elapsedSeconds)}
            </span>
          </div>
        )}

        {status === 'CLOCKED_OUT' && (
          <div style={{ fontSize: '0.875rem', color: '#e0e7ff', marginTop: '6px' }}>
            Worked from <strong>{formatTime(attendance?.clockInAt)}</strong> to <strong>{formatTime(attendance?.clockOutAt)}</strong> ({Number(attendance?.renderedHours || 0).toFixed(2)} hrs)
          </div>
        )}
      </div>

      {/* Action Area */}
      {status !== 'CLOCKED_OUT' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} />
              Session Notes (Optional)
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder={
                status === 'NOT_CLOCKED_IN'
                  ? 'Add notes for today (e.g., Working on frontend UI tasks)...'
                  : 'Add wrap-up notes for today before clocking out...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {status === 'NOT_CLOCKED_IN' ? (
              <Button
                variant="primary"
                onClick={handleClockIn}
                isLoading={isLoading}
                icon={<Play size={18} />}
                style={{ flex: 1, padding: '14px' }}
              >
                Clock In Now
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleClockOut}
                isLoading={isLoading}
                icon={<Square size={18} />}
                style={{ flex: 1, padding: '14px' }}
              >
                Clock Out Session
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          ✨ You have completed your attendance for today. New session available tomorrow.
        </div>
      )}
    </Card>
  );
};
