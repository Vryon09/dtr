import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import type { AttendanceRecord } from '../../types/attendance';
import { groupRecordsByWeek } from '../../utils/date';
import { formatHours } from '../../utils/format';

interface WeeklyBarChartProps {
  history: AttendanceRecord[];
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ history }) => {
  const weeks = useMemo(() => groupRecordsByWeek(history), [history]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);

  const selectedWeek = weeks[selectedWeekIndex] || weeks[0];
  const maxHours = Math.max(8, ...(selectedWeek?.days.map((d) => d.hours) || [8]));

  const canGoNext = selectedWeekIndex > 0; // closer to current week
  const canGoPrev = selectedWeekIndex < weeks.length - 1; // further into past

  const handlePrev = () => {
    if (canGoPrev) setSelectedWeekIndex((i) => i + 1);
  };

  const handleNext = () => {
    if (canGoNext) setSelectedWeekIndex((i) => i - 1);
  };

  const handleResetToCurrent = () => {
    setSelectedWeekIndex(0);
  };

  return (
    <Card>
      <div className="card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="card-title">Weekly Rendered Hours</h3>
            {selectedWeek?.isCurrentWeek && (
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
          <p className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Calendar size={13} />
            <span>{selectedWeek?.label || 'Loading...'}</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Week total badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              marginRight: '6px',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Week Total
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
              {formatHours(selectedWeek?.totalHours || 0)}
            </span>
          </div>

          {/* Week Navigator buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-subtle)',
              padding: '2px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous week"
              style={{
                background: 'none',
                border: 'none',
                color: canGoPrev ? 'var(--text-main)' : 'var(--text-light)',
                cursor: canGoPrev ? 'pointer' : 'not-allowed',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {selectedWeekIndex !== 0 && (
              <button
                type="button"
                onClick={handleResetToCurrent}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 6px',
                }}
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next week"
              style={{
                background: 'none',
                border: 'none',
                color: canGoNext ? 'var(--text-main)' : 'var(--text-light)',
                cursor: canGoNext ? 'pointer' : 'not-allowed',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {!selectedWeek || selectedWeek.days.length === 0 ? (
        <EmptyState
          size="sm"
          title="No data for this week"
          description="Clock in to see your daily rendered hours for this week."
        />
      ) : (
        <div>
          <div
            className="chart-bars-container"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '10px',
              height: '170px',
              paddingTop: '24px',
              paddingBottom: '8px',
            }}
          >
            {selectedWeek.days.map((day) => {
              const hours = day.hours;
              const hasHours = hours > 0;
              const heightPercent = maxHours > 0 ? (hours / maxHours) * 100 : 0;

              return (
                <div
                  key={day.dateString}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: hasHours ? 'var(--text-main)' : 'var(--text-light)',
                    }}
                  >
                    {hasHours ? `${hours.toFixed(1)}h` : '0h'}
                  </div>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '40px',
                      height: hasHours ? `${Math.max(10, heightPercent)}%` : '6px',
                      background: !hasHours
                        ? 'var(--bg-subtle)'
                        : hours >= 8
                        ? 'linear-gradient(180deg, #4f46e5 0%, #818cf8 100%)'
                        : 'linear-gradient(180deg, #0284c7 0%, #38bdf8 100%)',
                      borderRadius: '8px 8px 4px 4px',
                      transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
                      boxShadow: hasHours ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                    }}
                    title={`${day.dayName}, ${day.formattedDate}: ${hours.toFixed(2)} hours`}
                  />

                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: hasHours ? 'var(--text-main)' : 'var(--text-muted)',
                        fontWeight: 700,
                      }}
                    >
                      {day.dayName}
                    </div>
                    <div style={{ fontSize: '0.688rem', color: 'var(--text-light)', fontWeight: 500 }}>
                      {day.formattedDate}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer info bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.813rem',
            }}
          >
            <div style={{ color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>{selectedWeek.shiftCount}</strong> working{' '}
              {selectedWeek.shiftCount === 1 ? 'day' : 'days'} logged this week
              {selectedWeek.shiftCount > 0 && (
                <span>
                  {' '}• Avg <strong>{(selectedWeek.totalHours / selectedWeek.shiftCount).toFixed(1)}h</strong>/day
                </span>
              )}
            </div>

            <Link
              to="/history?tab=weekly"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              All Weeks <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
};

