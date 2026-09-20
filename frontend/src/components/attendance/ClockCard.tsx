import React, { useState, useEffect } from 'react';
import { Play, Square, FileText, AlertCircle, Sparkles, Coffee, Timer } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { TodayAttendanceResponse } from '../../types/attendance';
import { calculateElapsedSeconds, formatDuration, formatTime } from '../../utils/date';

interface ClockCardProps {
  todayData: TodayAttendanceResponse | null;
  onClockIn: (notes?: string) => Promise<void>;
  onStartBreak: () => Promise<void>;
  onEndBreak: () => Promise<void>;
  onClockOut: (notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const ClockCard: React.FC<ClockCardProps> = ({
  todayData,
  onClockIn,
  onStartBreak,
  onEndBreak,
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
  const [breakElapsedSeconds, setBreakElapsedSeconds] = useState<number>(0);
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

  // Elapsed session timer if CLOCKED_IN or ON_BREAK
  useEffect(() => {
    if ((status !== 'CLOCKED_IN' && status !== 'ON_BREAK') || !attendance?.clockInAt) {
      return;
    }
    const updateElapsed = () => {
      setElapsedSeconds(calculateElapsedSeconds(attendance.clockInAt));
    };
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [status, attendance?.clockInAt]);

  // Elapsed break timer if ON_BREAK
  useEffect(() => {
    if (status !== 'ON_BREAK' || !attendance?.breakStartAt) {
      return;
    }
    const updateBreakElapsed = () => {
      setBreakElapsedSeconds(calculateElapsedSeconds(attendance.breakStartAt!));
    };
    const interval = setInterval(updateBreakElapsed, 1000);
    return () => clearInterval(interval);
  }, [status, attendance?.breakStartAt]);

  const handleClockIn = async () => {
    setActionError(null);
    try {
      await onClockIn(notes.trim() || undefined);
      setNotes('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to clock in');
    }
  };

  const handleStartBreak = async () => {
    setActionError(null);
    try {
      await onStartBreak();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    setActionError(null);
    try {
      await onEndBreak();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to end break');
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
          <p className="card-subtitle">Log your daily OJT working hours, breaks, and session notes</p>
        </div>

        <div>
          {status === 'NOT_CLOCKED_IN' && <Badge variant="neutral">Not Clocked In</Badge>}
          {status === 'CLOCKED_IN' && (
            <Badge variant="warning" icon={<Sparkles size={14} />}>
              Active Session
            </Badge>
          )}
          {status === 'ON_BREAK' && (
            <Badge variant="warning" icon={<Coffee size={14} />}>
              On Break
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
          background:
            status === 'ON_BREAK'
              ? 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)'
              : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          color: 'white',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow:
            status === 'ON_BREAK'
              ? '0 8px 24px -4px rgba(217, 119, 6, 0.35)'
              : '0 8px 24px -4px rgba(67, 56, 202, 0.35)',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div style={{ fontSize: '0.813rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fed7aa', fontWeight: 600 }}>
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
              Shift Elapsed: {formatDuration(elapsedSeconds)}
            </span>
          </div>
        )}

        {status === 'ON_BREAK' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              marginTop: '8px',
            }}
          >
            <Coffee size={16} color="#fef08a" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fef08a' }}>
              Break Elapsed: {formatDuration(breakElapsedSeconds)}
            </span>
          </div>
        )}

        {status === 'CLOCKED_OUT' && (
          <div style={{ fontSize: '0.875rem', color: '#e0e7ff', marginTop: '6px' }}>
            Worked from <strong>{formatTime(attendance?.clockInAt)}</strong> to <strong>{formatTime(attendance?.clockOutAt)}</strong> ({Number(attendance?.renderedHours || 0).toFixed(2)} hrs net)
            {attendance?.breakStartAt && attendance?.breakEndAt && (
              <div style={{ fontSize: '0.813rem', color: '#c7d2fe', marginTop: '4px' }}>
                Break: {formatTime(attendance.breakStartAt)} - {formatTime(attendance.breakEndAt)} ({attendance.breakMinutes} mins)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Break Info Banner if Break was Completed during Active Shift */}
      {status === 'CLOCKED_IN' && attendance?.breakStartAt && attendance?.breakEndAt && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-subtle)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
            fontSize: '0.813rem',
            color: 'var(--text-main)',
          }}
        >
          <Timer size={16} color="var(--primary)" />
          <span>
            Break logged today: <strong>{formatTime(attendance.breakStartAt)} - {formatTime(attendance.breakEndAt)}</strong> ({attendance.breakMinutes} mins deducted)
          </span>
        </div>
      )}

      {/* Action Area */}
      {status !== 'CLOCKED_OUT' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {status !== 'ON_BREAK' && (
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
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {status === 'NOT_CLOCKED_IN' && (
              <Button
                variant="primary"
                onClick={handleClockIn}
                isLoading={isLoading}
                icon={<Play size={18} />}
                style={{ flex: 1, padding: '14px' }}
              >
                Clock In Now
              </Button>
            )}

            {status === 'CLOCKED_IN' && (
              <>
                {!attendance?.breakStartAt && (
                  <Button
                    variant="outline"
                    onClick={handleStartBreak}
                    isLoading={isLoading}
                    icon={<Coffee size={18} />}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#fffbeb',
                      color: '#b45309',
                      borderColor: '#fde68a',
                    }}
                  >
                    Start Break
                  </Button>
                )}

                <Button
                  variant="danger"
                  onClick={handleClockOut}
                  isLoading={isLoading}
                  icon={<Square size={18} />}
                  style={{ flex: 1, padding: '14px' }}
                >
                  Clock Out Session
                </Button>
              </>
            )}

            {status === 'ON_BREAK' && (
              <Button
                variant="primary"
                onClick={handleEndBreak}
                isLoading={isLoading}
                icon={<Play size={18} />}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: 'white',
                }}
              >
                End Break & Resume Work
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
