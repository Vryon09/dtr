import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Calendar, CheckCircle2, Coffee } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useCreateManualAttendanceMutation } from '../../hooks/useAttendanceQueries';
import {
  toManilaDateString,
  combineDateAndTimeManila,
  formatWorkingDate,
} from '../../utils/date';
import type { AttendanceRecord } from '../../types/attendance';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingRecords: AttendanceRecord[];
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingRecords,
}) => {
  const todayStr = toManilaDateString();

  const [date, setDate] = useState<string>(todayStr);
  const [clockInTime, setClockInTime] = useState<string>('08:00');
  const [clockOutTime, setClockOutTime] = useState<string>('17:00');
  const [hasClockOut, setHasClockOut] = useState<boolean>(true);
  const [hasBreak, setHasBreak] = useState<boolean>(false);
  const [breakStartTime, setBreakStartTime] = useState<string>('12:00');
  const [breakEndTime, setBreakEndTime] = useState<string>('13:00');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateManualAttendanceMutation();

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setDate(toManilaDateString());
      setClockInTime('08:00');
      setClockOutTime('17:00');
      setHasClockOut(true);
      setHasBreak(false);
      setBreakStartTime('12:00');
      setBreakEndTime('13:00');
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Check if attendance already exists on selected date
  const conflictingRecord = existingRecords.find(
    (record) => toManilaDateString(record.workingDate) === date
  );

  const isDuplicateDate = Boolean(conflictingRecord);

  // Calculate estimated rendered hours if times are present
  let estimatedHours: number | null = null;
  let breakDurationHours: number = 0;
  let timeError: string | null = null;

  if (clockInTime && hasClockOut && clockOutTime) {
    const start = new Date(combineDateAndTimeManila(date, clockInTime)).getTime();
    const end = new Date(combineDateAndTimeManila(date, clockOutTime)).getTime();

    if (end <= start) {
      timeError = 'Clock out time must be later than clock in time';
    } else {
      let netDiffMs = end - start;

      if (hasBreak) {
        if (!breakStartTime || !breakEndTime) {
          timeError = 'Please specify both break start and break end time';
        } else {
          const bStart = new Date(combineDateAndTimeManila(date, breakStartTime)).getTime();
          const bEnd = new Date(combineDateAndTimeManila(date, breakEndTime)).getTime();

          if (bEnd <= bStart) {
            timeError = 'Break end time must be later than break start time';
          } else if (bStart < start) {
            timeError = 'Break start time cannot be earlier than clock in time';
          } else if (bEnd > end) {
            timeError = 'Break end time cannot be later than clock out time';
          } else {
            const breakDiffMs = bEnd - bStart;
            breakDurationHours = Math.round((breakDiffMs / (1000 * 60 * 60)) * 100) / 100;
            netDiffMs = Math.max(0, netDiffMs - breakDiffMs);
          }
        }
      }

      if (!timeError) {
        estimatedHours = Math.round((netDiffMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateDate || timeError) return;

    setErrorMessage(null);

    try {
      const clockInIso = combineDateAndTimeManila(date, clockInTime);
      const clockOutIso = hasClockOut && clockOutTime
        ? combineDateAndTimeManila(date, clockOutTime)
        : undefined;

      const breakStartIso = hasBreak && breakStartTime
        ? combineDateAndTimeManila(date, breakStartTime)
        : undefined;

      const breakEndIso = hasBreak && breakEndTime
        ? combineDateAndTimeManila(date, breakEndTime)
        : undefined;

      await createMutation.mutateAsync({
        date,
        clockIn: clockInIso,
        clockOut: clockOutIso,
        breakStart: breakStartIso,
        breakEnd: breakEndIso,
        notes: notes.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to create manual attendance');
    }
  };

  const isSubmitDisabled =
    isDuplicateDate || Boolean(timeError) || createMutation.isPending || !date || !clockInTime;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Attendance Manually">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Date Warning Banner */}
        {isDuplicateDate && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Duplicate Attendance:</strong> An attendance log already exists for{' '}
              {formatWorkingDate(date)}. You cannot clock in, clock out, or log another attendance on the same date.
              Please edit or delete the existing entry instead.
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.875rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Date Picker */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--primary)" />
            Working Date
          </label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setErrorMessage(null);
            }}
            required
            max={todayStr}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Selected date: {formatWorkingDate(date)}
          </span>
        </div>

        {/* Shift Time Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="var(--primary)" />
              Clock In Time
            </label>
            <input
              type="time"
              className="form-input"
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Clock size={15} color="var(--primary)" />
                Clock Out Time
              </label>
            </div>
            <input
              type="time"
              className="form-input"
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
              disabled={!hasClockOut}
              required={hasClockOut}
            />
          </div>
        </div>

        {/* Toggle optional clock out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="hasClockOutToggle"
            checked={hasClockOut}
            onChange={(e) => setHasClockOut(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="hasClockOutToggle" style={{ fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            Include Clock Out time (completed session)
          </label>
        </div>

        {/* Optional Break Section */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="hasBreakToggle"
              checked={hasBreak}
              onChange={(e) => setHasBreak(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="hasBreakToggle" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coffee size={15} color="#b45309" />
              Add Break Time (Optional - Deducts from rendered hours)
            </label>
          </div>

          {hasBreak && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.813rem' }}>
                  Break Start Time
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={breakStartTime}
                  onChange={(e) => setBreakStartTime(e.target.value)}
                  required={hasBreak}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.813rem' }}>
                  Break End Time
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={breakEndTime}
                  onChange={(e) => setBreakEndTime(e.target.value)}
                  required={hasBreak}
                />
              </div>
            </div>
          )}
        </div>

        {/* Time Error */}
        {timeError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.813rem', fontWeight: 500 }}>
            {timeError}
          </div>
        )}

        {/* Estimated Hours Preview */}
        {estimatedHours !== null && !timeError && !isDuplicateDate && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>Rendered Time: {estimatedHours} hour{estimatedHours !== 1 ? 's' : ''}</span>
            </div>
            {hasBreak && breakDurationHours > 0 && (
              <span style={{ fontSize: '0.813rem', color: '#b45309' }}>
                ({breakDurationHours} hr break deducted)
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Session Notes (Optional)</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Accomplishments, tasks completed, or activities during this shift..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {notes.length}/500
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              opacity: isSubmitDisabled ? 0.5 : 1,
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {createMutation.isPending ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
