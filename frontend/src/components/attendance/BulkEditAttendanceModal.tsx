import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coffee,
  Layers,
  Loader2,
  StickyNote,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useBatchUpdateAttendanceMutation } from '../../hooks/useAttendanceQueries';
import {
  combineDateAndTimeManila,
  formatWorkingDate,
  getManilaTimeString,
  toManilaDateString,
} from '../../utils/date';
import { formatHours } from '../../utils/format';
import type { AttendanceRecord, BatchUpdateAttendanceItem } from '../../types/attendance';

interface BulkEditAttendanceModalProps {
  records: AttendanceRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ClockOutMode = 'set' | 'clear';
type BreakMode = 'set' | 'remove';
type NotesMode = 'replace' | 'append' | 'clear';

interface PreviewRow {
  record: AttendanceRecord;
  date: string;
  beforeHours: number | null;
  afterHours: number | null;
  error: string | null;
  item: BatchUpdateAttendanceItem;
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const NOTES_MAX = 500;

export const BulkEditAttendanceModal: React.FC<BulkEditAttendanceModalProps> = ({
  records,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [changeClockIn, setChangeClockIn] = useState(false);
  const [clockIn, setClockIn] = useState('08:00');

  const [changeClockOut, setChangeClockOut] = useState(false);
  const [clockOutMode, setClockOutMode] = useState<ClockOutMode>('set');
  const [clockOut, setClockOut] = useState('17:00');

  const [changeBreak, setChangeBreak] = useState(false);
  const [breakMode, setBreakMode] = useState<BreakMode>('set');
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');

  const [changeNotes, setChangeNotes] = useState(false);
  const [notesMode, setNotesMode] = useState<NotesMode>('replace');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const batchUpdateMutation = useBatchUpdateAttendanceMutation();

  const resetForm = () => {
    setChangeClockIn(false);
    setClockIn('08:00');
    setChangeClockOut(false);
    setClockOutMode('set');
    setClockOut('17:00');
    setChangeBreak(false);
    setBreakMode('set');
    setBreakStart('12:00');
    setBreakEnd('13:00');
    setChangeNotes(false);
    setNotesMode('replace');
    setNotes('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.workingDate.localeCompare(b.workingDate)),
    [records]
  );

  const anyFieldChecked = changeClockIn || changeClockOut || changeBreak || changeNotes;

  const globalError = useMemo(() => {
    if (changeClockIn && !clockIn) return 'Please enter a clock in time';
    if (changeClockOut && clockOutMode === 'set' && !clockOut) return 'Please enter a clock out time';
    if (changeBreak && breakMode === 'set' && (!breakStart || !breakEnd)) {
      return 'Please specify both break start and break end time';
    }
    if (changeNotes && notesMode !== 'clear' && !notes.trim()) return 'Please enter notes text';
    if (changeClockOut && clockOutMode === 'clear' && records.length > 1) {
      return 'Only one session can be left open (no clock out). Select a single log to clear clock out.';
    }
    return null;
  }, [
    changeClockIn, clockIn, changeClockOut, clockOutMode, clockOut,
    changeBreak, breakMode, breakStart, breakEnd, changeNotes, notesMode, notes, records.length,
  ]);

  const previewRows: PreviewRow[] = useMemo(() => {
    return sortedRecords.map((record) => {
      const date = toManilaDateString(record.workingDate);
      const item: BatchUpdateAttendanceItem = { id: record.id };

      const inT = changeClockIn ? clockIn : getManilaTimeString(record.clockInAt);
      const outT = changeClockOut
        ? clockOutMode === 'set'
          ? clockOut
          : null
        : record.clockOutAt
          ? getManilaTimeString(record.clockOutAt)
          : null;

      const hasExistingBreak = Boolean(record.breakStartAt && record.breakEndAt);
      const bStartT = changeBreak
        ? breakMode === 'set'
          ? breakStart
          : null
        : hasExistingBreak
          ? getManilaTimeString(record.breakStartAt)
          : null;
      const bEndT = changeBreak
        ? breakMode === 'set'
          ? breakEnd
          : null
        : hasExistingBreak
          ? getManilaTimeString(record.breakEndAt)
          : null;

      // Build payload with only the opted-in fields
      if (changeClockIn && clockIn) item.clockIn = combineDateAndTimeManila(date, clockIn);
      if (changeClockOut) {
        item.clockOut = clockOutMode === 'set' && clockOut ? combineDateAndTimeManila(date, clockOut) : null;
      }
      if (changeBreak) {
        if (breakMode === 'set' && breakStart && breakEnd) {
          item.breakStart = combineDateAndTimeManila(date, breakStart);
          item.breakEnd = combineDateAndTimeManila(date, breakEnd);
        } else {
          item.breakStart = null;
          item.breakEnd = null;
        }
      }

      let error: string | null = null;
      if (changeNotes) {
        if (notesMode === 'clear') {
          item.notes = null;
        } else if (notesMode === 'replace') {
          item.notes = notes.trim() || null;
        } else {
          const existing = record.notes?.trim();
          const appended = existing ? `${existing}\n${notes.trim()}` : notes.trim();
          item.notes = appended || null;
          if (appended.length > NOTES_MAX) error = `Notes would exceed ${NOTES_MAX} characters`;
        }
      }

      let afterHours: number | null = null;
      if (!error && inT && outT) {
        const inM = toMinutes(inT);
        const outM = toMinutes(outT);
        if (outM <= inM) {
          error = 'Clock out must be later than clock in';
        } else {
          let net = outM - inM;
          if (bStartT && bEndT) {
            const bs = toMinutes(bStartT);
            const be = toMinutes(bEndT);
            if (be <= bs) error = 'Break end must be later than break start';
            else if (bs < inM) error = 'Break starts before clock in';
            else if (be > outM) error = 'Break ends after clock out';
            else net -= be - bs;
          }
          if (!error) afterHours = Math.round((net / 60) * 100) / 100;
        }
      } else if (!error && inT && !outT && bStartT && bEndT) {
        const bs = toMinutes(bStartT);
        const be = toMinutes(bEndT);
        if (be <= bs) error = 'Break end must be later than break start';
        else if (bs < toMinutes(inT)) error = 'Break starts before clock in';
      }

      return {
        record,
        date,
        beforeHours: record.renderedHours !== null ? Number(record.renderedHours) : null,
        afterHours,
        error,
        item,
      };
    });
  }, [
    sortedRecords, changeClockIn, clockIn, changeClockOut, clockOutMode, clockOut,
    changeBreak, breakMode, breakStart, breakEnd, changeNotes, notesMode, notes,
  ]);

  if (records.length === 0) return null;

  const invalidCount = previewRows.filter((r) => r.error).length;
  const beforeTotal = previewRows.reduce((s, r) => s + (r.beforeHours ?? 0), 0);
  const afterTotal = previewRows.reduce((s, r) => s + (r.afterHours ?? 0), 0);

  const firstDate = previewRows[0]?.date;
  const lastDate = previewRows[previewRows.length - 1]?.date;

  const isSubmitDisabled =
    !anyFieldChecked || Boolean(globalError) || invalidCount > 0 || batchUpdateMutation.isPending;

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    setErrorMessage(null);
    try {
      await batchUpdateMutation.mutateAsync({ updates: previewRows.map((r) => r.item) });
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to update selected attendance records');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit ${records.length} Attendance ${records.length === 1 ? 'Record' : 'Records'}`}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Scope chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <Layers size={16} />
          <span>
            Editing {records.length} {records.length === 1 ? 'log' : 'logs'}
            {firstDate && lastDate && (
              <>
                {' · '}
                {firstDate === lastDate
                  ? formatWorkingDate(firstDate)
                  : `${formatWorkingDate(firstDate)} – ${formatWorkingDate(lastDate)}`}
              </>
            )}
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.813rem', color: 'var(--text-muted)' }}>
          Tick the fields you want to change. Unticked fields keep each log's current value. Times are applied to each
          log's own date.
        </p>

        {errorMessage && <div style={errorBannerStyle}>{errorMessage}</div>}

        {/* Clock In */}
        <FieldSection
          id="bulkEditClockIn"
          checked={changeClockIn}
          onToggle={setChangeClockIn}
          icon={<Clock size={15} color="var(--primary)" />}
          label="Change Clock In"
        >
          <input
            id="bulkEditClockInTime"
            type="time"
            className="form-input"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            style={{ maxWidth: '200px' }}
          />
        </FieldSection>

        {/* Clock Out */}
        <FieldSection
          id="bulkEditClockOut"
          checked={changeClockOut}
          onToggle={setChangeClockOut}
          icon={<Clock size={15} color="var(--primary)" />}
          label="Change Clock Out"
        >
          <SegmentedControl
            value={clockOutMode}
            onChange={(v) => setClockOutMode(v as ClockOutMode)}
            options={[
              { value: 'set', label: 'Set time' },
              { value: 'clear', label: 'Clear (mark open)' },
            ]}
          />
          {clockOutMode === 'set' && (
            <input
              id="bulkEditClockOutTime"
              type="time"
              className="form-input"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              style={{ maxWidth: '200px' }}
            />
          )}
        </FieldSection>

        {/* Break */}
        <FieldSection
          id="bulkEditBreak"
          checked={changeBreak}
          onToggle={setChangeBreak}
          icon={<Coffee size={15} color="#b45309" />}
          label="Change Break"
        >
          <SegmentedControl
            value={breakMode}
            onChange={(v) => setBreakMode(v as BreakMode)}
            options={[
              { value: 'set', label: 'Set start & end' },
              { value: 'remove', label: 'Remove break' },
            ]}
          />
          {breakMode === 'set' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input
                id="bulkEditBreakStart"
                type="time"
                className="form-input"
                value={breakStart}
                onChange={(e) => setBreakStart(e.target.value)}
                style={{ maxWidth: '160px' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                id="bulkEditBreakEnd"
                type="time"
                className="form-input"
                value={breakEnd}
                onChange={(e) => setBreakEnd(e.target.value)}
                style={{ maxWidth: '160px' }}
              />
            </div>
          )}
        </FieldSection>

        {/* Notes */}
        <FieldSection
          id="bulkEditNotes"
          checked={changeNotes}
          onToggle={setChangeNotes}
          icon={<StickyNote size={15} color="var(--primary)" />}
          label="Change Notes"
        >
          <SegmentedControl
            value={notesMode}
            onChange={(v) => setNotesMode(v as NotesMode)}
            options={[
              { value: 'replace', label: 'Replace' },
              { value: 'append', label: 'Append' },
              { value: 'clear', label: 'Clear' },
            ]}
          />
          {notesMode !== 'clear' && (
            <>
              <textarea
                id="bulkEditNotesText"
                className="form-textarea"
                rows={2}
                placeholder={notesMode === 'append' ? 'Text added on a new line to existing notes...' : 'New notes for all selected logs...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={NOTES_MAX}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                {notes.length}/{NOTES_MAX}
              </div>
            </>
          )}
        </FieldSection>

        {/* Preview */}
        {anyFieldChecked && (
          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--bg-subtle)',
                fontSize: '0.813rem',
                fontWeight: 700,
                color: 'var(--text-main)',
              }}
            >
              <span>Preview</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                {formatHours(beforeTotal)} <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />{' '}
                <span style={{ color: 'var(--primary)' }}>{formatHours(afterTotal)}</span>
              </span>
            </div>
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {previewRows.map((row) => (
                <div
                  key={row.record.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 14px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.813rem',
                    background: row.error ? '#fef2f2' : 'transparent',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    {formatWorkingDate(row.date)}
                  </span>
                  {row.error ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#b91c1c',
                        fontWeight: 600,
                        textAlign: 'right',
                      }}
                    >
                      <AlertCircle size={13} /> {row.error}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {row.beforeHours !== null ? formatHours(row.beforeHours) : 'Open'}{' '}
                      <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />{' '}
                      <strong style={{ color: 'var(--primary)' }}>
                        {row.afterHours !== null ? formatHours(row.afterHours) : 'Open'}
                      </strong>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {globalError && anyFieldChecked && (
          <div style={{ color: 'var(--danger)', fontSize: '0.813rem', fontWeight: 500 }}>{globalError}</div>
        )}
        {!globalError && invalidCount > 0 && (
          <div style={{ color: 'var(--danger)', fontSize: '0.813rem', fontWeight: 500 }}>
            {invalidCount} {invalidCount === 1 ? 'log' : 'logs'} would become invalid. Adjust the values or change your selection.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
          <button type="button" onClick={handleClose} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button
            id="bulkEditApplyButton"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              opacity: isSubmitDisabled ? 0.5 : 1,
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {batchUpdateMutation.isPending ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>
                  Apply to {records.length} {records.length === 1 ? 'Log' : 'Logs'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ---------- Local presentational helpers ---------- */

interface FieldSectionProps {
  id: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

const FieldSection: React.FC<FieldSectionProps> = ({ id, checked, onToggle, icon, label, children }) => (
  <div
    style={{
      background: checked ? 'var(--bg-card)' : 'var(--bg-subtle)',
      padding: '12px 16px',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${checked ? 'rgba(79, 70, 229, 0.35)' : 'var(--border-subtle)'}`,
      boxShadow: checked ? '0 0 0 3px rgba(79, 70, 229, 0.08)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'all 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
      />
      <label
        htmlFor={id}
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {icon}
        {label}
      </label>
    </div>
    {checked && <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '24px' }}>{children}</div>}
  </div>
);

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ value, onChange, options }) => (
  <div
    style={{
      display: 'inline-flex',
      alignSelf: 'flex-start',
      background: 'var(--bg-subtle)',
      padding: '3px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--border-subtle)',
    }}
  >
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        style={{
          padding: '5px 12px',
          borderRadius: 'var(--radius-pill)',
          border: 'none',
          background: value === opt.value ? 'var(--bg-card)' : 'transparent',
          color: value === opt.value ? 'var(--primary)' : 'var(--text-muted)',
          fontWeight: 700,
          fontSize: '0.75rem',
          cursor: 'pointer',
          boxShadow: value === opt.value ? 'var(--shadow-sm)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const errorBannerStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  fontSize: '0.875rem',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
};
