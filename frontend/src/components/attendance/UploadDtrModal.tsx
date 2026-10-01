import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  FileImage,
  AlertCircle,
  CheckCircle2,
  XCircle,
  SkipForward,
  Loader2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useParseDtrMutation, useBulkImportMutation } from '../../hooks/useAttendanceQueries';
import { toManilaDateString } from '../../utils/date';
import type { AttendanceRecord, ProcessedDtrEntry, BulkImportResult } from '../../types/attendance';

interface UploadDtrModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRecords: AttendanceRecord[];
}

type Step = 'upload' | 'review' | 'results';

interface EditableEntry extends ProcessedDtrEntry {
  selected: boolean;
  status: 'new' | 'exists' | 'incomplete';
  dateStr: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonthName(month: number) {
  return MONTH_NAMES[month - 1] ?? '';
}

export const UploadDtrModal: React.FC<UploadDtrModalProps> = ({
  isOpen,
  onClose,
  existingRecords,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pay period
  const now = new Date();
  const [payMonth, setPayMonth] = useState(now.getMonth() + 1);
  const [payYear, setPayYear] = useState(now.getFullYear());

  // Parsed entries
  const [entries, setEntries] = useState<EditableEntry[]>([]);

  // Results
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const parseMutation = useParseDtrMutation();
  const importMutation = useBulkImportMutation();

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setFile(null);
      setPreview(null);
      setDragActive(false);
      setErrorMessage(null);
      setPayMonth(new Date().getMonth() + 1);
      setPayYear(new Date().getFullYear());
      setEntries([]);
      setImportResult(null);
    }
  }, [isOpen]);

  const handleFile = useCallback((f: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setErrorMessage('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be under 10MB.');
      return;
    }
    setFile(f);
    setErrorMessage(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  // Process entries after parsing
  const processEntries = useCallback((parsed: ProcessedDtrEntry[]) => {
    const result: EditableEntry[] = parsed.map((entry) => {
      const dateStr = `${payYear}-${String(payMonth).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`;
      const existsAlready = existingRecords.some(
        (r) => toManilaDateString(r.workingDate) === dateStr
      );

      let status: EditableEntry['status'] = 'new';
      if (existsAlready) status = 'exists';
      else if (!entry.clockOut) status = 'incomplete';

      return {
        ...entry,
        selected: status === 'new',
        status,
        dateStr,
      };
    });
    setEntries(result);
  }, [payYear, payMonth, existingRecords]);

  const handleScan = async () => {
    if (!file) return;
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('dtrImage', file);

      const res = await parseMutation.mutateAsync(formData);
      processEntries(res.data);
      setStep('review');
    } catch (err) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to parse DTR image');
    }
  };

  const handleImport = async () => {
    const selected = entries.filter((e) => e.selected && e.clockIn);
    if (selected.length === 0) return;

    setErrorMessage(null);

    try {
      const res = await importMutation.mutateAsync({
        payPeriodYear: payYear,
        payPeriodMonth: payMonth,
        entries: selected.map((e) => ({
          day: e.day,
          clockIn: e.clockIn!,
          clockOut: e.clockOut || undefined,
          breakStart: e.breakStartTime || undefined,
          breakEnd: e.breakEndTime || undefined,
        })),
      });
      setImportResult(res.data);
      setStep('results');
    } catch (err) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to import attendance records');
    }
  };

  const toggleEntry = (day: number) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.day === day && e.status !== 'exists' ? { ...e, selected: !e.selected } : e
      )
    );
  };

  const toggleAll = () => {
    const selectableEntries = entries.filter((e) => e.status !== 'exists');
    const allSelected = selectableEntries.every((e) => e.selected);
    setEntries((prev) =>
      prev.map((e) =>
        e.status !== 'exists' ? { ...e, selected: !allSelected } : e
      )
    );
  };

  const updateEntryTime = (day: number, field: keyof ProcessedDtrEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.day === day ? { ...e, [field]: value || null } : e))
    );
  };

  const removeEntry = (day: number) => {
    setEntries((prev) => prev.filter((e) => e.day !== day));
  };

  const selectedCount = entries.filter((e) => e.selected && e.clockIn).length;

  // Calculate total estimated hours for selected entries
  const selectedHours = entries
    .filter((e) => e.selected && e.clockIn && e.clockOut)
    .reduce((sum, e) => {
      const [inH, inM] = e.clockIn!.split(':').map(Number);
      const [outH, outM] = e.clockOut!.split(':').map(Number);
      let diff = (outH * 60 + outM) - (inH * 60 + inM);

      if (e.breakStartTime && e.breakEndTime) {
        const [bsH, bsM] = e.breakStartTime.split(':').map(Number);
        const [beH, beM] = e.breakEndTime.split(':').map(Number);
        diff -= (beH * 60 + beM) - (bsH * 60 + bsM);
      }

      return sum + Math.max(0, diff / 60);
    }, 0);

  const stepTitle =
    step === 'upload'
      ? 'Upload Physical DTR'
      : step === 'review'
        ? 'Review Extracted Records'
        : 'Import Results';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={stepTitle} size="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          {(['upload', 'review', 'results'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && (
                <div
                  style={{
                    width: '32px',
                    height: '2px',
                    background: step === s || (step === 'results' && i <= 2) || (step === 'review' && i <= 1)
                      ? 'var(--primary)'
                      : 'var(--border-subtle)',
                    transition: 'background 0.3s',
                  }}
                />
              )}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background:
                    step === s
                      ? 'var(--primary)'
                      : (step === 'review' && i === 0) || (step === 'results' && i <= 1)
                        ? 'var(--primary)'
                        : 'var(--bg-subtle)',
                  color:
                    step === s || (step === 'review' && i === 0) || (step === 'results' && i <= 1)
                      ? '#fff'
                      : 'var(--text-muted)',
                  border:
                    step === s
                      ? 'none'
                      : '1px solid var(--border-subtle)',
                  transition: 'all 0.3s',
                }}
              >
                {(step === 'review' && i === 0) || (step === 'results' && i <= 1) ? (
                  <CheckCircle2 size={14} />
                ) : (
                  i + 1
                )}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* ============ STEP 1: UPLOAD ============ */}
        {step === 'upload' && (
          <>
            {/* Pay Period Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Month</label>
                <select
                  className="form-input"
                  value={payMonth}
                  onChange={(e) => setPayMonth(Number(e.target.value))}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  className="form-input"
                  value={payYear}
                  min={2020}
                  max={2100}
                  onChange={(e) => setPayYear(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: preview ? '12px' : '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragActive ? 'var(--primary-light)' : 'var(--bg-subtle)',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {preview ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <img
                    src={preview}
                    alt="DTR Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '220px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'contain',
                    }}
                  />
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '0.813rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <FileImage size={14} />
                    <span>{file?.name}</span>
                    <span>·</span>
                    <span>{file ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : ''}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Upload size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px' }}>
                      Drop your DTR image here
                    </p>
                    <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)', margin: 0 }}>
                      or click to browse · JPG, PNG, WEBP · Max 10MB
                    </p>
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />

            {/* Scan Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
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
                onClick={handleScan}
                disabled={!file || parseMutation.isPending}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  opacity: !file || parseMutation.isPending ? 0.5 : 1,
                  cursor: !file || parseMutation.isPending ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {parseMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Scanning with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Scan DTR</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ============ STEP 2: REVIEW ============ */}
        {step === 'review' && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {getMonthName(payMonth)} {payYear} · {entries.length} days extracted
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={toggleAll}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Toggle All
                </button>
              </div>
            </div>

            {/* Scrollable table */}
            <div
              style={{
                maxHeight: '380px',
                overflowY: 'auto',
                overflowX: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: '600px',
                  borderCollapse: 'collapse',
                  fontSize: '0.813rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--bg-subtle)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}></th>
                    <th style={{ ...thStyle, width: '90px' }}>Day</th>
                    <th style={{ ...thStyle, width: '130px' }}>Clock In</th>
                    <th style={{ ...thStyle, width: '130px' }}>Clock Out</th>
                    <th style={{ ...thStyle, width: '120px' }}>Break</th>
                    <th style={{ ...thStyle, width: '100px' }}>Status</th>
                    <th style={{ ...thStyle, width: '44px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.day}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        opacity: entry.status === 'exists' ? 0.5 : 1,
                        background: entry.selected ? 'var(--primary-light)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={entry.selected}
                          disabled={entry.status === 'exists'}
                          onChange={() => toggleEntry(entry.day)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {getMonthName(payMonth).slice(0, 3)} {entry.day}
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="time"
                          value={entry.clockIn || ''}
                          onChange={(e) =>
                            updateEntryTime(entry.day, 'clockIn', e.target.value)
                          }
                          disabled={entry.status === 'exists'}
                          style={timeInputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="time"
                          value={entry.clockOut || ''}
                          onChange={(e) =>
                            updateEntryTime(entry.day, 'clockOut', e.target.value)
                          }
                          disabled={entry.status === 'exists'}
                          style={timeInputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        {entry.breakStartTime && entry.breakEndTime ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.813rem', whiteSpace: 'nowrap' }}>
                            {entry.breakStartTime} – {entry.breakEndTime}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontSize: '0.813rem' }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {entry.status === 'exists' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              color: '#b45309',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <SkipForward size={12} /> Exists
                          </span>
                        ) : entry.status === 'incomplete' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              color: '#d97706',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <AlertCircle size={12} /> Partial
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <CheckCircle2 size={12} /> New
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {entry.status !== 'exists' && (
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.day)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-light)',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Remove row"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Bar */}
            {selectedCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <span>
                  {selectedCount} record{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <span>
                  ~{Math.round(selectedHours * 100) / 100} hours total
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setStep('upload')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
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
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={selectedCount === 0 || importMutation.isPending}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  opacity: selectedCount === 0 || importMutation.isPending ? 0.5 : 1,
                  cursor: selectedCount === 0 || importMutation.isPending ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    <span>Import {selectedCount} Record{selectedCount !== 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ============ STEP 3: RESULTS ============ */}
        {step === 'results' && importResult && (
          <>
            {/* Success Header */}
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0 8px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 size={28} color="#fff" />
              </div>
              <h4 style={{ margin: '0 0 4px', color: 'var(--text-main)', fontSize: '1.125rem' }}>
                Import Complete!
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {getMonthName(payMonth)} {payYear} DTR processed
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '14px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>
                  {importResult.created.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>Created</div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '14px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>
                  {importResult.skipped.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Skipped</div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '14px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: importResult.errors.length > 0 ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${importResult.errors.length > 0 ? '#fecaca' : 'var(--border-subtle)'}`,
                }}
              >
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: importResult.errors.length > 0 ? '#dc2626' : 'var(--text-muted)',
                  }}
                >
                  {importResult.errors.length}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: importResult.errors.length > 0 ? '#b91c1c' : 'var(--text-muted)',
                  }}
                >
                  Errors
                </div>
              </div>
            </div>

            {/* Details */}
            {importResult.skipped.length > 0 && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: '0.813rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <SkipForward size={14} /> Skipped Records
                </div>
                {importResult.skipped.map((s) => (
                  <div key={s.day} style={{ color: '#78350f' }}>
                    Day {s.day}: {s.reason}
                  </div>
                ))}
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  fontSize: '0.813rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={14} /> Errors
                </div>
                {importResult.errors.map((e) => (
                  <div key={e.day} style={{ color: '#7f1d1d' }}>
                    Day {e.day}: {e.message}
                  </div>
                ))}
              </div>
            )}

            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{
                  padding: '10px 28px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// Table cell styles
const thStyle: React.CSSProperties = {
  padding: '10px 10px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--border-subtle)',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  verticalAlign: 'middle',
};

const timeInputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '108px',
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  fontSize: '0.813rem',
  fontFamily: 'inherit',
};
