import React, { useState } from 'react';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import type { AttendanceRecord } from '../../types/attendance';
import { formatWorkingDate, formatTime } from '../../utils/date';
import { formatHours } from '../../utils/format';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  limit?: number;
  isCompact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (record: AttendanceRecord) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  limit,
  isCompact = false,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete,
}) => {
  const [selectedNotes, setSelectedNotes] = useState<{ date: string; notes: string } | null>(null);

  const displayRecords = limit ? records.slice(0, limit) : records;
  const showActions = Boolean(onEdit || onDelete);

  return (
    <div>
      <div className="table-container">
        <table className={`custom-table ${isCompact ? 'compact' : ''}`}>
          <thead>
            <tr>
              <th>{isCompact ? 'Date' : 'Working Date'}</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Break</th>
              <th>{isCompact ? 'Hours' : 'Rendered Hours'}</th>
              <th>Status</th>
              <th>Notes</th>
              {showActions && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayRecords.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} style={{ textAlign: 'center', padding: isCompact ? '20px 0' : '32px 0' }}>
                  <EmptyState
                    size={isCompact ? 'sm' : 'md'}
                    title={emptyTitle || 'No attendance records'}
                    description={emptyDescription || 'Search by date or notes, or clock in to start.'}
                  />
                </td>
              </tr>
            ) : (
              displayRecords.map((record) => {
                const isCompleted = !!record.clockOutAt;
                const hasBreakData = Boolean(record.breakStartAt && record.breakEndAt);
                return (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600 }}>{formatWorkingDate(record.workingDate)}</td>
                    <td>{formatTime(record.clockInAt)}</td>
                    <td>{formatTime(record.clockOutAt)}</td>
                    <td style={{ fontSize: '0.813rem', color: hasBreakData ? 'var(--text-main)' : 'var(--text-light)' }}>
                      {hasBreakData ? (
                        isCompact ? (
                          `${record.breakMinutes}m`
                        ) : (
                          <span>
                            {formatTime(record.breakStartAt)} - {formatTime(record.breakEndAt)}
                            <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                              ({record.breakMinutes}m)
                            </span>
                          </span>
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: isCompleted ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {isCompleted ? formatHours(record.renderedHours) : '--'}
                    </td>
                    <td>
                      {isCompleted ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="warning">In Progress</Badge>
                      )}
                    </td>
                    <td>
                      {record.notes ? (
                        <button
                          onClick={() => setSelectedNotes({ date: record.workingDate, notes: record.notes! })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--primary)',
                            fontSize: '0.813rem',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--primary-light)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <FileText size={14} />
                          View
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.813rem' }}>-</span>
                      )}
                    </td>
                    {showActions && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: isCompact ? '4px' : '8px' }}>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(record)}
                              title="Edit attendance"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: isCompact ? '28px' : '32px',
                                height: isCompact ? '28px' : '32px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                transition: 'var(--transition)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--primary)';
                                e.currentTarget.style.borderColor = 'var(--primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-main)';
                                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                              }}
                            >
                              <Pencil size={isCompact ? 13 : 15} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(record)}
                              title="Delete attendance"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: isCompact ? '28px' : '32px',
                                height: isCompact ? '28px' : '32px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid #fee2e2',
                                background: '#fff5f5',
                                color: '#dc2626',
                                cursor: 'pointer',
                                transition: 'var(--transition)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#dc2626';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff5f5';
                                e.currentTarget.style.color = '#dc2626';
                              }}
                            >
                              <Trash2 size={isCompact ? 13 : 15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Notes Modal */}
      <Modal
        isOpen={!!selectedNotes}
        onClose={() => setSelectedNotes(null)}
        title={`Session Notes (${selectedNotes ? formatWorkingDate(selectedNotes.date) : ''})`}
      >
        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            fontSize: '0.938rem',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
          }}
        >
          {selectedNotes?.notes}
        </div>
      </Modal>
    </div>
  );
};
