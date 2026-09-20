import React from 'react';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import type { AttendanceRecord } from '../../types/attendance';
import { formatWorkingDate } from '../../utils/date';

interface WeeklyBarChartProps {
  history: AttendanceRecord[];
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ history }) => {
  // Take last 7 records reversed to show chronological order
  const recentRecords = [...history].slice(0, 7).reverse();
  const maxHours = Math.max(8, ...recentRecords.map((r) => Number(r.renderedHours || 0)));

  return (
    <Card>
      <div className="card-header">
        <div>
          <h3 className="card-title">Recent Daily Hours</h3>
          <p className="card-subtitle">Rendered hours per working shift</p>
        </div>
        <span
          style={{
            fontSize: '0.813rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'var(--bg-subtle)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          Last {recentRecords.length || 0} Sessions
        </span>
      </div>

      {recentRecords.length === 0 ? (
        <EmptyState
          size="sm"
          title="No daily data"
          description="Clock in to see your daily working hours chart."
        />
      ) : (
        <div className="chart-bars-container" style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '160px', paddingTop: '20px' }}>
          {recentRecords.map((record) => {
            const hours = Number(record.renderedHours || 0);
            const heightPercent = maxHours > 0 ? (hours / maxHours) * 100 : 0;
            const dateLabel = formatWorkingDate(record.workingDate).split(',')[0] || '';

            return (
              <div
                key={record.id}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {hours.toFixed(1)}h
                </div>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '42px',
                    height: `${Math.max(8, heightPercent)}%`,
                    background:
                      hours >= 8
                        ? 'linear-gradient(180deg, #4f46e5 0%, #818cf8 100%)'
                        : 'linear-gradient(180deg, #38bdf8 0%, #bae6fd 100%)',
                    borderRadius: '8px 8px 4px 4px',
                    transition: 'height 0.4s ease-out',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                  }}
                  title={`${record.workingDate}: ${hours.toFixed(2)} hours`}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {dateLabel}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
