import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { attendanceApi } from '../../api/attendanceApi';
import { MetricsGrid } from '../../components/attendance/MetricsGrid';
import { ClockCard } from '../../components/attendance/ClockCard';
import { WeeklyBarChart } from '../../components/attendance/WeeklyBarChart';
import { AttendanceTable } from '../../components/attendance/AttendanceTable';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';
import { EditAttendanceModal } from '../../components/attendance/EditAttendanceModal';
import { DeleteAttendanceModal } from '../../components/attendance/DeleteAttendanceModal';
import { RightRail } from '../../components/layout/RightRail';
import { Card } from '../../components/common/Card';
import { getTodayFormatted } from '../../utils/date';
import type {
  TodayAttendanceResponse,
  AttendanceSummaryResponse,
  AttendanceRecord,
} from '../../types/attendance';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [todayData, setTodayData] = useState<TodayAttendanceResponse | null>(null);
  const [summaryData, setSummaryData] = useState<AttendanceSummaryResponse | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClocking, setIsClocking] = useState<boolean>(false);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [todayRes, summaryRes, historyRes] = await Promise.all([
        attendanceApi.getToday(),
        attendanceApi.getSummary(),
        attendanceApi.getHistory(),
      ]);
      setTodayData(todayRes.data);
      setSummaryData(summaryRes.data);
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      attendanceApi.getToday(),
      attendanceApi.getSummary(),
      attendanceApi.getHistory(),
    ])
      .then(([todayRes, summaryRes, historyRes]) => {
        if (isMounted) {
          setTodayData(todayRes.data);
          setSummaryData(summaryRes.data);
          setHistory(historyRes.data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load initial dashboard data', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClockIn = async (notes?: string) => {
    setIsClocking(true);
    try {
      await attendanceApi.clockIn({ notes });
      await fetchDashboardData();
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async (notes?: string) => {
    setIsClocking(true);
    try {
      await attendanceApi.clockOut({ notes });
      await fetchDashboardData();
    } finally {
      setIsClocking(false);
    }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Intern';

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

          <button
            onClick={() => {
              setIsLoading(true);
              fetchDashboardData();
            }}
            title="Refresh data"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Counter Grid */}
      <MetricsGrid summary={summaryData} isLoading={isLoading} />

      {/* Main Grid Content */}
      <div className="content-columns">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* Clock In / Out Card */}
          <ClockCard
            todayData={todayData}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            isLoading={isClocking}
          />

          {/* Weekly Hours Breakdown */}
          <WeeklyBarChart history={history} />

          {/* Recent Attendance Records */}
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
        </div>

        {/* Right Column: Profile & Status */}
        <div>
          <RightRail todayData={todayData} summaryData={summaryData} />
        </div>
      </div>

      {/* Modals */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={fetchDashboardData}
        existingRecords={history}
      />

      <EditAttendanceModal
        record={editingRecord}
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        onSuccess={fetchDashboardData}
        existingRecords={history}
      />

      <DeleteAttendanceModal
        record={deletingRecord}
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
