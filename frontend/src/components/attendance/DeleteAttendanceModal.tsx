import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDeleteAttendanceMutation } from '../../hooks/useAttendanceQueries';
import { formatWorkingDate, formatTime } from '../../utils/date';
import { formatHours } from '../../utils/format';
import type { AttendanceRecord } from '../../types/attendance';

interface DeleteAttendanceModalProps {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeleteAttendanceModal: React.FC<DeleteAttendanceModalProps> = ({
  record,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteAttendanceMutation();

  if (!record) return null;

  const handleDelete = async () => {
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(record.id);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to delete attendance record');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Attendance Record">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#991b1b',
          }}
        >
          <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.938rem', marginBottom: '4px' }}>
              Are you sure you want to delete this record?
            </div>
            <div style={{ fontSize: '0.875rem', color: '#7f1d1d', lineHeight: 1.5 }}>
              This will permanently remove the logged session and recalculate your completed and remaining OJT hours.
            </div>
          </div>
        </div>

        {/* Record Details Card */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Date:</span>
            <strong style={{ color: 'var(--text-main)' }}>{formatWorkingDate(record.workingDate)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Clock In:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formatTime(record.clockInAt)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Clock Out:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formatTime(record.clockOutAt)}</span>
          </div>
          {Boolean(record.breakStartAt && record.breakEndAt) && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Break Time:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {formatTime(record.breakStartAt)} - {formatTime(record.breakEndAt)} ({record.breakMinutes}m)
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Rendered Hours:</span>
            <strong style={{ color: 'var(--primary)' }}>
              {record.clockOutAt ? formatHours(record.renderedHours) : 'In Progress'}
            </strong>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
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
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: deleteMutation.isPending ? 0.7 : 1,
            }}
          >
            <Trash2 size={16} />
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Record'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
