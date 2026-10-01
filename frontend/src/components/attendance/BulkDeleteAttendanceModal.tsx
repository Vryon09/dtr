import React, { useState } from 'react';
import { Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useBatchDeleteAttendanceMutation } from '../../hooks/useAttendanceQueries';
import { formatWorkingDate } from '../../utils/date';
import { formatHours } from '../../utils/format';
import type { AttendanceRecord } from '../../types/attendance';

interface BulkDeleteAttendanceModalProps {
  records: AttendanceRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkDeleteAttendanceModal: React.FC<BulkDeleteAttendanceModalProps> = ({
  records,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAllDates, setShowAllDates] = useState(false);
  const batchDeleteMutation = useBatchDeleteAttendanceMutation();

  if (records.length === 0) return null;

  const totalHours = records.reduce((acc, curr) => acc + Number(curr.renderedHours || 0), 0);

  const handleDelete = async () => {
    setErrorMessage(null);
    try {
      const ids = records.map((r) => r.id);
      await batchDeleteMutation.mutateAsync(ids);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to delete selected attendance records');
    }
  };

  const previewRecords = showAllDates ? records : records.slice(0, 6);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${records.length} Attendance ${records.length === 1 ? 'Record' : 'Records'}`}
    >
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

        {/* Warning Alert */}
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
              Are you sure you want to permanently delete {records.length} selected {records.length === 1 ? 'record' : 'records'}?
            </div>
            <div style={{ fontSize: '0.875rem', color: '#7f1d1d', lineHeight: 1.5 }}>
              This action cannot be undone. All selected daily shifts will be deleted and your total completed and remaining OJT hours will be recalculated.
            </div>
          </div>
        </div>

        {/* Summary Details Card */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Records to Delete:</span>
            <strong style={{ color: 'var(--text-main)' }}>{records.length} shifts</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Rendered Hours Removed:</span>
            <strong style={{ color: '#dc2626' }}>{formatHours(totalHours)}</strong>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-muted)',
                marginBottom: '8px',
                fontSize: '0.813rem',
                fontWeight: 600,
              }}
            >
              <Calendar size={14} />
              <span>Selected Dates:</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                maxHeight: showAllDates ? '160px' : 'auto',
                overflowY: showAllDates ? 'auto' : 'visible',
              }}
            >
              {previewRecords.map((r) => (
                <span
                  key={r.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                  }}
                >
                  {formatWorkingDate(r.workingDate)} ({formatHours(r.renderedHours)})
                </span>
              ))}
              {!showAllDates && records.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllDates(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 6px',
                  }}
                >
                  +{records.length - 6} more...
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            disabled={batchDeleteMutation.isPending}
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
              cursor: batchDeleteMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: batchDeleteMutation.isPending ? 0.7 : 1,
            }}
          >
            <Trash2 size={16} />
            {batchDeleteMutation.isPending ? 'Deleting...' : `Delete ${records.length} ${records.length === 1 ? 'Record' : 'Records'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
