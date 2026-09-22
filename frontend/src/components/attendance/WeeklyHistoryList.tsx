import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, CalendarDays, BarChart2 } from 'lucide-react';
import { AttendanceTable } from './AttendanceTable';
import { EmptyState } from '../common/EmptyState';
import type { AttendanceRecord } from '../../types/attendance';
import { groupRecordsByWeek } from '../../utils/date';
import { formatHours } from '../../utils/format';

interface WeeklyHistoryListProps {
  records: AttendanceRecord[];
  searchTerm?: string;
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (record: AttendanceRecord) => void;
}

export const WeeklyHistoryList: React.FC<WeeklyHistoryListProps> = ({
  records,
  searchTerm = '',
  onEdit,
  onDelete,
}) => {
  const weeks = useMemo(() => groupRecordsByWeek(records), [records]);

  // Track expanded weeks; default: first 3 weeks expanded
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    weeks.slice(0, 3).forEach((w) => {
      initial[w.weekKey] = true;
    });
    return initial;
  });

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekKey]: !prev[weekKey],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    weeks.forEach((w) => {
      all[w.weekKey] = true;
    });
    setExpandedWeeks(all);
  };

  const collapseAll = () => {
    setExpandedWeeks({});
  };

  // Filter weeks by search term
  const filteredWeeks = useMemo(() => {
    if (!searchTerm.trim()) return weeks;
    const term = searchTerm.toLowerCase();
    return weeks.filter((w) => {
      const labelMatch = w.label.toLowerCase().includes(term);
      const keyMatch = w.weekKey.toLowerCase().includes(term);
      const recordsMatch = w.records.some(
        (r) =>
          r.workingDate.toLowerCase().includes(term) ||
          (r.notes && r.notes.toLowerCase().includes(term))
      );
      return labelMatch || keyMatch || recordsMatch;
    });
  }, [weeks, searchTerm]);

  // Calculate overall summary across all weeks
  const totalWeeksWithShifts = weeks.filter((w) => w.totalHours > 0).length;
  const overallHours = records.reduce((acc, r) => acc + Number(r.renderedHours || 0), 0);
  const avgWeeklyHours = totalWeeksWithShifts > 0 ? overallHours / totalWeeksWithShifts : 0;

  if (weeks.length === 0) {
    return (
      <EmptyState
        size="md"
        title="No weekly data available"
        description="Clock in to start tracking weekly rendered hours."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top summary stats bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Logged Weeks: <strong style={{ color: 'var(--text-main)' }}>{totalWeeksWithShifts}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--success)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Total Hours: <strong style={{ color: 'var(--text-main)' }}>{formatHours(overallHours)}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="var(--info)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Weekly Average: <strong style={{ color: 'var(--text-main)' }}>{formatHours(avgWeeklyHours)}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={expandAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.813rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Expand All
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <button
            type="button"
            onClick={collapseAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.813rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {filteredWeeks.length === 0 ? (
        <EmptyState
          size="sm"
          title="No matching weeks"
          description={`No weekly records found for "${searchTerm}".`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredWeeks.map((week) => {
            const isExpanded = !!expandedWeeks[week.weekKey];
            const hasShifts = week.shiftCount > 0;
            const maxDayHours = Math.max(8, ...week.days.map((d) => d.hours));

            return (
              <div
                key={week.weekKey}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: week.isCurrentWeek
                    ? '2px solid rgba(99, 102, 241, 0.35)'
                    : '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  boxShadow: week.isCurrentWeek ? '0 4px 14px rgba(99, 102, 241, 0.08)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header / Clickable row */}
                <div
                  onClick={() => toggleWeek(week.weekKey)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    gap: '16px',
                    flexWrap: 'wrap',
                    background: week.isCurrentWeek ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
                  }}
                >
                  {/* Left: Week Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-md)',
                        background: week.isCurrentWeek ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: week.isCurrentWeek ? '#ffffff' : 'var(--text-main)',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        lineHeight: 1.1,
                      }}
                    >
                      <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.85 }}>Wk</span>
                      <span>{week.weekNumber}</span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {week.label}
                        </span>
                        {week.isCurrentWeek && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              background: 'rgba(99, 102, 241, 0.12)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                            }}
                          >
                            Current Week
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.813rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Calendar size={13} />
                        <span>{week.startDate} to {week.endDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Mini Daily Spark Bars */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '4px',
                      height: '34px',
                      padding: '0 8px',
                    }}
                  >
                    {week.days.map((d) => {
                      const h = d.hours;
                      const hasH = h > 0;
                      const hPercent = maxDayHours > 0 ? (h / maxDayHours) * 100 : 0;
                      return (
                        <div
                          key={d.dateString}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                            width: '14px',
                          }}
                          title={`${d.dayName} (${d.formattedDate}): ${h > 0 ? `${h.toFixed(1)}h` : '0h'}`}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: hasH ? `${Math.max(15, hPercent)}%` : '3px',
                              background: !hasH
                                ? 'var(--border-subtle)'
                                : h >= 8
                                ? 'var(--primary)'
                                : '#38bdf8',
                              borderRadius: '3px 3px 1px 1px',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Hours Total & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: hasShifts ? 'var(--primary)' : 'var(--text-light)',
                        }}
                      >
                        {formatHours(week.totalHours)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {week.shiftCount} {week.shiftCount === 1 ? 'shift' : 'shifts'}
                        {week.shiftCount > 0 && ` (${(week.totalHours / week.shiftCount).toFixed(1)}h avg)`}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-main)',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      padding: '16px',
                      background: 'var(--bg-main)',
                    }}
                  >
                    {week.records.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '16px',
                          color: 'var(--text-muted)',
                          fontSize: '0.875rem',
                        }}
                      >
                        No attendance logs recorded for this week.
                      </div>
                    ) : (
                      <AttendanceTable
                        records={week.records}
                        isCompact
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
