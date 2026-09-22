import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, RefreshCw, Plus, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useAttendanceToday,
  useAttendanceSummary,
  useAttendanceHistory,
  useClockInMutation,
  useStartBreakMutation,
  useEndBreakMutation,
  useClockOutMutation,
} from '../../hooks/useAttendanceQueries';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import { CustomizeDashboardModal } from '../../components/dashboard/CustomizeDashboardModal';
import { MetricsGrid } from '../../components/attendance/MetricsGrid';
import { ClockCard } from '../../components/attendance/ClockCard';
import { WeeklyBarChart } from '../../components/attendance/WeeklyBarChart';
import { AttendanceTable } from '../../components/attendance/AttendanceTable';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';
import { EditAttendanceModal } from '../../components/attendance/EditAttendanceModal';
import { DeleteAttendanceModal } from '../../components/attendance/DeleteAttendanceModal';
import { RightRail } from '../../components/layout/RightRail';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import owlMascotFinding from '../../assets/owl-mascot-finding.png';
import { getTodayFormatted } from '../../utils/date';
import type { AttendanceRecord } from '../../types/attendance';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const {
    visibility,
    toggleVisibility,
    resetVisibility,
    hiddenCount,
  } = useDashboardLayout(user?.id);

  const {
    data: todayData = null,
    isLoading: isTodayLoading,
    refetch: refetchToday,
  } = useAttendanceToday();

  const {
    data: summaryData = null,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useAttendanceSummary();

  const {
    data: history = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useAttendanceHistory();

  const clockInMutation = useClockInMutation();
  const startBreakMutation = useStartBreakMutation();
  const endBreakMutation = useEndBreakMutation();
  const clockOutMutation = useClockOutMutation();

  const isLoading = isTodayLoading || isSummaryLoading || isHistoryLoading;
  const isClocking =
    clockInMutation.isPending ||
    startBreakMutation.isPending ||
    endBreakMutation.isPending ||
    clockOutMutation.isPending;

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);

  const handleRefresh = () => {
    refetchToday();
    refetchSummary();
    refetchHistory();
  };

  const handleClockIn = async (notes?: string) => {
    await clockInMutation.mutateAsync({ notes });
  };

  const handleStartBreak = async () => {
    await startBreakMutation.mutateAsync();
  };

  const handleEndBreak = async () => {
    await endBreakMutation.mutateAsync();
  };

  const handleClockOut = async (notes?: string) => {
    await clockOutMutation.mutateAsync({ notes });
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Intern';
  const hasVisibleMain = visibility.clock || visibility.chart || visibility.recent;
  const allElementsHidden = !visibility.metrics && !visibility.rail && !hasVisibleMain;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div className="top-header">
        <div>
          <h1 className="greeting-title">Hello, {firstName} 👋</h1>
          <p className="greeting-subtitle">
            Track your daily OJT hours and achieve your completion target.
          </p>
        </div>

        <div className="top-header-actions">
          <div className="date-pill">
            <Calendar size={16} color="var(--primary)" />
            <span>{getTodayFormatted()}</span>
          </div>

          <button
            onClick={() => setIsManualModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
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

          {/* Customize Elements Modal Trigger */}
          <button
            onClick={() => setIsCustomizeModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            title="Show or hide dashboard elements"
          >
            <SlidersHorizontal size={16} />
            <span>Customize</span>
            {hiddenCount > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontSize: '0.6875rem',
                  padding: '1px 6px',
                  fontWeight: 700,
                }}
              >
                {hiddenCount} hidden
              </span>
            )}
          </button>

          <button
            onClick={handleRefresh}
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

      {/* Metrics Counter Grid */}
      {visibility.metrics && <MetricsGrid summary={summaryData} isLoading={isLoading} />}

      {/* Main Grid Content */}
      <div className={`content-columns ${!visibility.rail ? 'no-rail' : ''}`}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* Clock In / Out Card */}
          {visibility.clock && (
            <ClockCard
              todayData={todayData}
              onClockIn={handleClockIn}
              onStartBreak={handleStartBreak}
              onEndBreak={handleEndBreak}
              onClockOut={handleClockOut}
              isLoading={isClocking}
            />
          )}

          {/* Weekly Hours Breakdown */}
          {visibility.chart && <WeeklyBarChart history={history} />}

          {/* Recent Attendance Records */}
          {visibility.recent && (
            <Card>
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent Activity</h3>
                  <p className="card-subtitle">Your latest logged working shifts</p>
                </div>
                <Link
                  to="/history"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  View All <ArrowRight size={16} />
                </Link>
              </div>

              <AttendanceTable
                records={history}
                limit={5}
                isCompact
                onEdit={(record) => setEditingRecord(record)}
                onDelete={(record) => setDeletingRecord(record)}
              />
            </Card>
          )}

          {/* Fallback when all main widgets or all elements are hidden */}
          {!hasVisibleMain && (
            <Card>
              <EmptyState
                imageSrc={owlMascotFinding}
                imageAlt={allElementsHidden ? 'All dashboard elements hidden' : 'All main widgets hidden'}
                title={
                  allElementsHidden
                    ? 'All dashboard elements are hidden'
                    : 'All main dashboard widgets are hidden'
                }
                description={
                  allElementsHidden
                    ? 'Every element on your dashboard is currently hidden. Customize your layout to restore your workspace.'
                    : 'Your main workspace widgets (Clock, Chart, and Recent Activity) are hidden. Adjust your layout to bring them back.'
                }
                action={
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setIsCustomizeModalOpen(true)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      Manage Elements
                    </button>
                    {allElementsHidden && (
                      <button
                        type="button"
                        onClick={resetVisibility}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        Reset Layout
                      </button>
                    )}
                  </div>
                }
              />
            </Card>
          )}
        </div>

        {/* Right Column: Profile & Status */}
        {visibility.rail && (
          <div>
            <RightRail todayData={todayData} summaryData={summaryData} />
          </div>
        )}
      </div>

      {/* Customize Elements Modal */}
      <CustomizeDashboardModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        visibility={visibility}
        onToggleVisibility={toggleVisibility}
        onResetVisibility={resetVisibility}
      />

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
