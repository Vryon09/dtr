import React, { useState } from 'react';
import { Search, Calendar, RefreshCw, Clock, Layers, Plus } from 'lucide-react';
import { useAttendanceHistory } from '../../hooks/useAttendanceQueries';
import { AttendanceTable } from '../../components/attendance/AttendanceTable';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';
import { EditAttendanceModal } from '../../components/attendance/EditAttendanceModal';
import { DeleteAttendanceModal } from '../../components/attendance/DeleteAttendanceModal';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import type { AttendanceRecord } from '../../types/attendance';
import { formatHours } from '../../utils/format';

export const HistoryPage: React.FC = () => {
  const {
    data: history = [],
    isLoading,
    refetch: fetchHistory,
  } = useAttendanceHistory();

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);

  const filteredHistory = history.filter((record) => {
    const term = searchTerm.toLowerCase();
    const dateMatch = record.workingDate.toLowerCase().includes(term);
    const notesMatch = record.notes ? record.notes.toLowerCase().includes(term) : false;
    return dateMatch || notesMatch;
  });

  const totalRendered = history.reduce((acc, curr) => acc + Number(curr.renderedHours || 0), 0);
  const totalDays = history.length;
  const avgHours = totalDays > 0 ? totalRendered / totalDays : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="top-header">
        <div>
          <h1 className="greeting-title">Attendance Logs</h1>
          <p className="greeting-subtitle">
            Complete record of your daily working hours, times, and session notes
          </p>
        </div>

        <div className="top-header-actions">
          <button
            onClick={() => setIsManualModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              transition: 'var(--transition)',
            }}
          >
            <Plus size={16} />
            <span>Log Attendance</span>
          </button>

          <button
            onClick={() => fetchHistory()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="stat-grid">
        <StatCard
          label="Total Shifts Logged"
          value={`${totalDays} Days`}
          icon={<Calendar size={22} />}
          iconVariant="primary"
          subtext="Recorded working sessions"
        />
        <StatCard
          label="Total Hours Recorded"
          value={formatHours(totalRendered)}
          icon={<Clock size={22} />}
          iconVariant="success"
          subtext="Sum of rendered hours"
        />
        <StatCard
          label="Daily Average"
          value={formatHours(avgHours)}
          icon={<Layers size={22} />}
          iconVariant="info"
          subtext="Average rendered per shift"
        />
      </div>

      {/* Filter and Table Card */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search
              size={18}
              color="var(--text-light)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by date (YYYY-MM-DD) or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {filteredHistory.length} of {history.length} records
          </div>
        </div>

        <AttendanceTable
          records={filteredHistory}
          emptyTitle={searchTerm ? 'No matching logs' : 'No attendance records yet'}
          emptyDescription={
            searchTerm
              ? `No logs match "${searchTerm}". Try another search term.`
              : 'Search by date or description, or log attendance to start.'
          }
          onEdit={(record) => setEditingRecord(record)}
          onDelete={(record) => setDeletingRecord(record)}
        />
      </Card>

      {/* Modals */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        existingRecords={history}
      />

      <EditAttendanceModal
        record={editingRecord}
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        existingRecords={history}
      />

      <DeleteAttendanceModal
        record={deletingRecord}
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
      />
    </div>
  );
};
