import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Calendar, RefreshCw, Clock, Layers, Plus, CalendarDays, List, Upload } from 'lucide-react';
import { useAttendanceHistory } from '../../hooks/useAttendanceQueries';
import { AttendanceTable } from '../../components/attendance/AttendanceTable';
import { WeeklyHistoryList } from '../../components/attendance/WeeklyHistoryList';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';
import { EditAttendanceModal } from '../../components/attendance/EditAttendanceModal';
import { DeleteAttendanceModal } from '../../components/attendance/DeleteAttendanceModal';
import { BulkDeleteAttendanceModal } from '../../components/attendance/BulkDeleteAttendanceModal';
import { BulkEditAttendanceModal } from '../../components/attendance/BulkEditAttendanceModal';
import { BulkActionBar } from '../../components/attendance/BulkActionBar';
import { UploadDtrModal } from '../../components/attendance/UploadDtrModal';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import type { AttendanceRecord } from '../../types/attendance';
import { formatHours } from '../../utils/format';

export const HistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'weekly' ? 'weekly' : 'daily';

  const {
    data: history = [],
    isLoading,
    isFetching,
    refetch: fetchHistory,
  } = useAttendanceHistory();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState<boolean>(false);
  const [isUploadDtrModalOpen, setIsUploadDtrModalOpen] = useState<boolean>(false);

  const handleTabChange = (tab: 'daily' | 'weekly') => {
    setSelectedIds(new Set());
    setSearchParams(tab === 'weekly' ? { tab: 'weekly' } : {});
  };


  const filteredHistory = history.filter((record) => {
    const term = searchTerm.toLowerCase();
    const dateMatch = record.workingDate.toLowerCase().includes(term);
    const notesMatch = record.notes ? record.notes.toLowerCase().includes(term) : false;
    return dateMatch || notesMatch;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      const next = new Set(selectedIds);
      filteredHistory.forEach((r) => next.add(r.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredHistory.forEach((r) => next.delete(r.id));
      setSelectedIds(next);
    }
  };

  const selectedRecords = history.filter((r) => selectedIds.has(r.id));
  const totalSelectedHours = selectedRecords.reduce(
    (acc, curr) => acc + Number(curr.renderedHours || 0),
    0
  );

  const totalRendered = history.reduce((acc, curr) => acc + Number(curr.renderedHours || 0), 0);
  const totalDays = history.length;
  const avgHours = totalDays > 0 ? totalRendered / totalDays : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="top-header">
        <div>
          <h1 className="greeting-title">Attendance Logs & Weekly Summary</h1>
          <p className="greeting-subtitle">
            View your daily shifts and explore total rendered hours week by week
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
            onClick={() => setIsUploadDtrModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition)',
            }}
          >
            <Upload size={16} />
            <span>Upload DTR</span>
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
            <RefreshCw size={16} className={isFetching || isLoading ? 'spin' : ''} />
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

      {/* View Switcher & Filters */}
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
          {/* Segmented Tab Controls */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-subtle)',
              padding: '4px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => handleTabChange('daily')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'daily' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'daily' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'daily' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <List size={16} />
              <span>Daily Shifts ({history.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('weekly')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'weekly' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'weekly' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'weekly' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <CalendarDays size={16} />
              <span>Weekly Summary</span>
            </button>
          </div>

          {/* Search box */}
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
              placeholder={activeTab === 'weekly' ? 'Search by week date or notes...' : 'Search by date (YYYY-MM-DD) or notes...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Bulk Action Bar (Daily Tab) */}
        {activeTab === 'daily' && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            totalSelectedHours={totalSelectedHours}
            onClearSelection={() => setSelectedIds(new Set())}
            onDeleteSelected={() => setIsBulkDeleteModalOpen(true)}
            onEditSelected={() => setIsBulkEditModalOpen(true)}
          />
        )}

        {/* Tab Content */}
        {activeTab === 'daily' ? (
          <AttendanceTable
            records={filteredHistory}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            emptyTitle={searchTerm ? 'No matching logs' : 'No attendance records yet'}
            emptyDescription={
              searchTerm
                ? `No logs match "${searchTerm}". Try another search term.`
                : 'Search by date or description, or log attendance to start.'
            }
            onEdit={(record) => setEditingRecord(record)}
            onDelete={(record) => setDeletingRecord(record)}
          />
        ) : (
          <WeeklyHistoryList
            records={filteredHistory}
            searchTerm={searchTerm}
            onEdit={(record) => setEditingRecord(record)}
            onDelete={(record) => setDeletingRecord(record)}
          />
        )}
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

      <BulkDeleteAttendanceModal
        records={selectedRecords}
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onSuccess={() => setSelectedIds(new Set())}
      />

      <BulkEditAttendanceModal
        records={selectedRecords}
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onSuccess={() => setSelectedIds(new Set())}
      />

      <UploadDtrModal
        isOpen={isUploadDtrModalOpen}
        onClose={() => setIsUploadDtrModalOpen(false)}
        existingRecords={history}
      />
    </div>
  );
};


