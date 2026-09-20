import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { attendanceApi } from '../../api/attendanceApi';
import {
  toManilaDateString,
  getManilaTimeString,
  combineDateAndTimeManila,
  formatWorkingDate,
} from '../../utils/date';
import type { AttendanceRecord } from '../../types/attendance';

interface EditAttendanceModalProps {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingRecords: AttendanceRecord[];
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  record,
  isOpen,
  onClose,
  onSuccess,
  existingRecords,
}) => {
  const [date, setDate] = useState<string>('');
  const [clockInTime, setClockInTime] = useState<string>('');
  const [clockOutTime, setClockOutTime] = useState<string>('');
  const [hasClockOut, setHasClockOut] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (record && isOpen) {
      setDate(toManilaDateString(record.workingDate));
      setClockInTime(getManilaTimeString(record.clockInAt));
      setClockOutTime(getManilaTimeString(record.clockOutAt));
      setHasClockOut(Boolean(record.clockOutAt));
      setNotes(record.notes || '');
      setErrorMessage(null);
    }
  }, [record, isOpen]);

  if (!record) return null;

  // Collision check against other records excluding this one
  const conflictingRecord = existingRecords.find(
    (r) => r.id !== record.id && toManilaDateString(r.workingDate) === date
  );
  const isDuplicateDate = Boolean(conflictingRecord);

  // Time validity check
  let estimatedHours: number | null = null;
  let timeError: string | null = null;

  if (clockInTime && hasClockOut && clockOutTime) {
    const start = new Date(combineDateAndTimeManila(date, clockInTime)).getTime();
    const end = new Date(combineDateAndTimeManila(date, clockOutTime)).getTime();
    if (end <= start) {
      timeError = 'Clock out time must be later than clock in time';
    } else {
      const diffHrs = (end - start) / (1000 * 60 * 60);
      estimatedHours = Math.round(diffHrs * 100) / 100;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateDate || timeError) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const clockInIso = combineDateAndTimeManila(date, clockInTime);
      const clockOutIso = hasClockOut && clockOutTime
        ? combineDateAndTimeManila(date, clockOutTime)
        : null;

      await attendanceApi.updateAttendance(record.id, {
        date,
        clockIn: clockInIso,
        clockOut: clockOutIso,
        notes: notes.trim() || null,
      });

      onSuccess();
      onClose();
    } catch (err) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to update attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isDuplicateDate || Boolean(timeError) || isSubmitting || !date || !clockInTime;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Attendance Record">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
              <strong>Duplicate Date Conflict:</strong> Another attendance record already exists for{' '}
              {formatWorkingDate(date)}. Each date can only have one attendance log.
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
            max={toManilaDateString()}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Selected date: {formatWorkingDate(date)}
          </span>
        </div>

        {/* Time Inputs Grid */}
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
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="var(--primary)" />
              Clock Out Time
            </label>
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
            id="editHasClockOutToggle"
            checked={hasClockOut}
            onChange={(e) => setHasClockOut(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="editHasClockOutToggle" style={{ fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            Include Clock Out time (completed session)
          </label>
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
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} />
            Rendered Time: {estimatedHours} hour{estimatedHours !== 1 ? 's' : ''}
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

        {/* Actions */}
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
