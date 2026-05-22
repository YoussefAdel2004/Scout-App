import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { formatTime, formatDate } from '../utils/conflicts';

/* ── helpers ──────────────────────────────────────────────────────────────── */
const todayStr    = () => new Date().toISOString().split('T')[0];
const blankAct    = () => ({ location: '', date: todayStr(), startTime: '08:00', endTime: '09:00' });

/* ── Activity Block inside the form ──────────────────────────────────────── */
function ActivityBlock({ index, data, onChange, onRemove, canRemove }) {
  const set = (k, v) => onChange(index, { ...data, [k]: v });
  return (
    <div className="act-block fade-in">
      <div className="act-block-head">
        <div className="act-num">{index + 1}</div>
        <span className="act-label">Activity {index + 1}</span>
        {canRemove && (
          <button type="button" className="btn btn-ghost btn-icon btn-sm act-remove" onClick={() => onRemove(index)} title="Remove activity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      <div className="field">
        <label className="label" htmlFor={`loc-${index}`}>Location / Place</label>
        <input id={`loc-${index}`} className="input" placeholder="e.g. Theater, Main Hall…" value={data.location} onChange={e => set('location', e.target.value)} />
      </div>
      <div className="field">
        <label className="label" htmlFor={`date-${index}`}>Date</label>
        <input id={`date-${index}`} type="date" className="input" value={data.date} onChange={e => set('date', e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor={`start-${index}`}>Start Time</label>
          <input id={`start-${index}`} type="time" className="input" value={data.startTime} onChange={e => set('startTime', e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor={`end-${index}`}>End Time</label>
          <input id={`end-${index}`} type="time" className="input" value={data.endTime} onChange={e => set('endTime', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

/* ── Entry Form (create + edit) ───────────────────────────────────────────── */
function EntryForm({ onClose, editEntry }) {
  const { addEntry, updateEntry } = useSession();
  const isEdit = !!editEntry;

  const [name,       setName]       = useState(editEntry?.name  || '');
  const [team,       setTeam]       = useState(editEntry?.team  || '');
  const [count,      setCount]      = useState(editEntry?.activities?.length || 1);
  const [activities, setActivities] = useState(editEntry?.activities?.length ? editEntry.activities : [blankAct()]);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState('');

  /* slider changes count + syncs array */
  function handleCount(val) {
    const n = Number(val);
    setCount(n);
    setActivities(prev =>
      n > prev.length
        ? [...prev, ...Array.from({ length: n - prev.length }, blankAct)]
        : prev.slice(0, n)
    );
  }

  function handleChange(i, updated) {
    setActivities(prev => prev.map((a, idx) => idx === i ? updated : a));
  }

  function handleAdd() {
    const n = count + 1;
    setCount(n);
    setActivities(prev => [...prev, blankAct()]);
  }

  function handleRemove(i) {
    const updated = activities.filter((_, idx) => idx !== i);
    setCount(updated.length);
    setActivities(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !team.trim()) return setErr('Please fill in your name and team.');
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (!a.location.trim() || !a.date) return setErr(`Activity ${i + 1}: fill in location and date.`);
      if (a.startTime >= a.endTime)       return setErr(`Activity ${i + 1}: end time must be after start time.`);
    }
    setSaving(true); setErr('');
    try {
      if (isEdit) {
        await updateEntry(editEntry.id, { name: name.trim(), team: team.trim(), activities });
      } else {
        await addEntry({ name: name.trim(), team: team.trim(), activities });
      }
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal pop-in">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon">
              {isEdit
                ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
            </div>
            <h2 className="modal-title">{isEdit ? 'Edit My Schedule' : 'Add Schedule Entry'}</h2>
          </div>
          <button id="btn-close-modal" className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Name + Team */}
          <div className="grid-2">
            <div className="field">
              <label className="label" htmlFor="f-name">Your Name</label>
              <input id="f-name" className="input" placeholder="e.g. Ahmed" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-team">Team Name</label>
              <input id="f-team" className="input" placeholder="e.g. Eagles" value={team} onChange={e => setTeam(e.target.value)} />
            </div>
          </div>

          {/* Slider */}
          <div className="field slider-field">
            <div className="slider-label-row">
              <label className="label" htmlFor="f-count">Number of Activities</label>
              <span className="slider-badge">{count}</span>
            </div>
            <input
              id="f-count" type="range" min={1} max={10}
              value={count} onChange={e => handleCount(e.target.value)}
              className="slider-input"
            />
            <div className="slider-ticks">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={`slider-tick ${i + 1 <= count ? 'active' : ''}`}>{i + 1}</span>
              ))}
            </div>
          </div>

          <div className="divider" style={{ margin: '0' }} />

          {/* Activity blocks */}
          <div className="acts-wrap">
            {activities.map((act, i) => (
              <ActivityBlock
                key={i} index={i} data={act}
                onChange={handleChange}
                onRemove={handleRemove}
                canRemove={activities.length > 1}
              />
            ))}

            {count < 10 && (
              <button type="button" className="btn btn-secondary btn-sm add-act-btn" onClick={handleAdd}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add another activity
              </button>
            )}
          </div>

          {err && (
            <div className="form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {err}
            </div>
          )}
        </form>

        {/* Footer outside scroll */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button id="btn-save-entry" className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
            {saving ? <><span className="spinner" /> Saving…</> : <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {isEdit ? 'Save Changes' : `Save ${count > 1 ? `${count} Activities` : 'Entry'}`}
            </>}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; z-index: 100;
        }
        .modal {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; width: 100%; max-width: 520px;
          max-height: 92vh;
          display: flex; flex-direction: column;
          box-shadow: var(--shadow-lg); overflow: hidden;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.2rem 1.4rem 0; flex-shrink: 0;
        }
        .modal-title-row { display: flex; align-items: center; gap: .65rem; }
        .modal-icon {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px;
          background: rgba(63,185,80,.15); color: var(--accent);
          border: 1px solid rgba(63,185,80,.25);
        }
        .modal-title { font-size: 1.05rem; font-weight: 700; }
        .modal-body {
          display: flex; flex-direction: column; gap: .85rem;
          padding: 1.2rem 1.4rem; overflow-y: auto; flex: 1;
        }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: .6rem;
          padding: .9rem 1.4rem;
          border-top: 1px solid var(--border); flex-shrink: 0;
          background: var(--bg2);
        }
        .form-error {
          display: flex; align-items: center; gap: .4rem;
          color: var(--red); background: rgba(248,81,73,.1);
          border: 1px solid rgba(248,81,73,.25); border-radius: 6px;
          padding: .55rem .85rem; font-size: .85rem;
        }

        /* Slider */
        .slider-field { gap: .5rem; }
        .slider-label-row { display: flex; align-items: center; justify-content: space-between; }
        .slider-badge {
          min-width: 28px; height: 28px; padding: 0 .5rem;
          background: rgba(163,113,247,.18); color: #d2a8ff;
          border: 1px solid rgba(163,113,247,.3); border-radius: 8px;
          font-size: .9rem; font-weight: 700;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .slider-input {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 6px;
          background: var(--bg3); border-radius: 99px; outline: none;
          cursor: pointer; border: 1px solid var(--border);
        }
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
          background: var(--purple); border: 2px solid rgba(163,113,247,.5);
          box-shadow: 0 0 0 4px rgba(163,113,247,.15); cursor: pointer; transition: box-shadow .18s;
        }
        .slider-input::-webkit-slider-thumb:hover { box-shadow: 0 0 0 7px rgba(163,113,247,.2); }
        .slider-ticks { display: flex; justify-content: space-between; padding: 0 2px; }
        .slider-tick { font-size: .7rem; color: var(--text3); width: 18px; text-align: center; transition: color .15s, font-weight .15s; }
        .slider-tick.active { color: var(--purple); font-weight: 600; }

        /* Activities */
        .acts-wrap { display: flex; flex-direction: column; gap: .75rem; }
        .add-act-btn { align-self: flex-start; }

        /* Activity block */
        .act-block {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1rem;
          display: flex; flex-direction: column; gap: .7rem;
        }
        .act-block-head { display: flex; align-items: center; gap: .5rem; }
        .act-num {
          width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
          background: rgba(163,113,247,.2); color: #d2a8ff;
          border: 1px solid rgba(163,113,247,.35);
          display: flex; align-items: center; justify-content: center;
          font-size: .75rem; font-weight: 700;
        }
        .act-label { font-size: .82rem; font-weight: 600; color: var(--text2); flex: 1; }
        .act-remove { color: var(--text3) !important; margin-left: auto; }
        .act-remove:hover { color: var(--red) !important; }
      `}</style>
    </div>
  );
}

/* ── Entry Card ───────────────────────────────────────────────────────────── */
function EntryCard({ entry, isOwn, conflictingSlots }) {
  const { removeEntry } = useSession();
  const [editing,  setEditing]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Remove your schedule entry?')) return;
    setDeleting(true);
    await removeEntry(entry.id);
  }

  return (
    <>
      <div className={`entry-card fade-in ${conflictingSlots.size > 0 ? 'entry-has-conflict' : ''}`}>
        {/* Card header — person info */}
        <div className="entry-head">
          <div className="entry-avatar">{entry.name?.charAt(0)?.toUpperCase() || '?'}</div>
          <div className="entry-person">
            <div className="entry-name">{entry.name}</div>
            <div className="entry-team">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {entry.team}
            </div>
          </div>
          {isOwn && (
            <div className="entry-actions">
              <span className="own-badge">You</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(true)} title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button className="btn btn-ghost btn-icon btn-sm entry-del" onClick={handleDelete} disabled={deleting} title="Delete">
                {deleting
                  ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                    </svg>}
              </button>
            </div>
          )}
        </div>

        {/* Activities list — all in one block */}
        <div className="entry-acts">
          {(entry.activities || []).map((act, i) => {
            const slotKey = `${i}`;
            const hasConflict = conflictingSlots.has(i);
            return (
              <div key={i} className={`entry-act ${hasConflict ? 'entry-act-conflict' : ''}`}>
                <div className="entry-act-num">{i + 1}</div>
                <div className="entry-act-details">
                  {hasConflict && (
                    <span className="mini-conflict-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Conflict
                    </span>
                  )}
                  <div className="entry-detail">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{act.location}</span>
                  </div>
                  <div className="entry-detail">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{formatDate(act.date)}</span>
                  </div>
                  <div className="entry-detail">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{formatTime(act.startTime)} — {formatTime(act.endTime)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && <EntryForm onClose={() => setEditing(false)} editEntry={entry} />}
    </>
  );
}

/* ── Conflict Summary ─────────────────────────────────────────────────────── */
function ConflictSummary({ conflicts }) {
  if (conflicts.length === 0) return null;
  return (
    <div className="conflict-banner fade-in">
      <div className="conflict-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <strong>{conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected</strong>
      </div>
      <div className="conflict-list">
        {conflicts.map((c, i) => (
          <div key={i} className="conflict-item">
            <span className="badge badge-red">#{i + 1}</span>
            <div className="conflict-desc">
              <strong>{c.a.team}</strong> ({c.a.name}) and <strong>{c.b.team}</strong> ({c.b.name})
              {' '}both booked <strong>{c.a.location}</strong> on <strong>{formatDate(c.a.date)}</strong> with overlapping times.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Session Page ─────────────────────────────────────────────────────────── */
export default function Session() {
  const { sessionCode, entries, conflicts, myEntryId, leaveSession, hasSupabase } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [copied,   setCopied]   = useState(false);

  // Build a map: entryId -> Set of activity indices that conflict
  const conflictMap = new Map();
  for (const c of conflicts) {
    // c.a and c.b have entryId + activityIndex (we need to add activityIndex to our conflict data)
    // We stored the full slot in the conflict, so we need to match by entryId + act index
    // Let's build it from entries
    for (const entry of entries) {
      const acts = entry.activities || [];
      acts.forEach((act, idx) => {
        const matches = (slot) =>
          slot.entryId === entry.id &&
          slot.location === act.location &&
          slot.date === act.date &&
          slot.startTime === act.startTime &&
          slot.endTime === act.endTime;
        if (matches(c.a) || matches(c.b)) {
          if (!conflictMap.has(entry.id)) conflictMap.set(entry.id, new Set());
          conflictMap.get(entry.id).add(idx);
        }
      });
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(sessionCode).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  const canAdd = !myEntryId;

  return (
    <div className="session-wrap">
      {/* ── Header ── */}
      <header className="session-header">
        <div className="session-header-inner">
          <div className="session-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M9 16l2 2 4-4"/>
            </svg>
            <span>Scout Scheduler</span>
          </div>
          <div className="session-code-pill" onClick={copyCode} title="Click to copy">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span style={{ letterSpacing: '.12em', fontWeight: 700 }}>{sessionCode}</span>
            {copied
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
          </div>
          <button id="btn-leave" className="btn btn-ghost btn-sm" onClick={leaveSession}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Leave
          </button>
        </div>
      </header>

      <main className="session-main">
        {!hasSupabase && (
          <div className="info-banner fade-in">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span><strong>Demo mode</strong> — entries sync on this device only. Connect Supabase to sync across devices.</span>
          </div>
        )}

        <div className="session-share-hint fade-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share code <strong style={{ letterSpacing: '.08em' }}>{sessionCode}</strong> with others so they can join from their devices.
        </div>

        <ConflictSummary conflicts={conflicts} />

        {entries.length > 1 && conflicts.length === 0 && (
          <div className="ok-banner fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <strong>No conflicts!</strong>
              <span style={{ color: 'var(--text2)', fontWeight: 400 }}>All schedules are compatible.</span>
            </div>
          </div>
        )}

        <div className="entries-header">
          <h2 className="entries-title">
            Schedules
            {entries.length > 0 && <span className="badge badge-blue">{entries.length}</span>}
          </h2>
          {canAdd ? (
            <button id="btn-add-entry" className="btn btn-primary" onClick={() => setShowForm(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add My Schedule
            </button>
          ) : (
            <span className="already-added">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Your schedule is added
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p>No schedules yet.</p>
            <p style={{ color: 'var(--text3)', fontSize: '.88rem' }}>Be the first to add your team's schedule.</p>
          </div>
        ) : (
          <div className="entries-grid">
            {entries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isOwn={entry.id === myEntryId}
                conflictingSlots={conflictMap.get(entry.id) || new Set()}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && <EntryForm onClose={() => setShowForm(false)} />}

      <style>{`
        .session-wrap { min-height: 100vh; display: flex; flex-direction: column; }

        .session-header {
          position: sticky; top: 0; z-index: 10;
          background: rgba(13,17,23,.88);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        .session-header-inner {
          max-width: 960px; margin: 0 auto;
          display: flex; align-items: center; gap: .75rem;
          padding: .85rem 1.25rem;
        }
        .session-brand {
          display: flex; align-items: center; gap: .5rem;
          font-weight: 700; font-size: .95rem; color: var(--accent); flex: 1;
        }
        .session-code-pill {
          display: flex; align-items: center; gap: .45rem;
          background: var(--bg3); border: 1px solid var(--border2);
          border-radius: 99px; padding: .35rem .85rem;
          font-size: .82rem; color: var(--text2);
          cursor: pointer; transition: all .18s; user-select: none;
        }
        .session-code-pill:hover { border-color: var(--blue); color: var(--text); }

        .session-main {
          flex: 1; max-width: 960px; margin: 0 auto;
          width: 100%; padding: 1.5rem 1.25rem 3rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .info-banner {
          display: flex; align-items: flex-start; gap: .6rem;
          background: rgba(56,139,253,.1); border: 1px solid rgba(56,139,253,.25);
          border-radius: var(--radius-sm); padding: .7rem 1rem;
          font-size: .85rem; color: var(--text2);
        }
        .info-banner svg { flex-shrink: 0; margin-top: 2px; color: var(--blue); }
        .session-share-hint { display: flex; align-items: center; gap: .5rem; color: var(--text3); font-size: .85rem; }

        .conflict-header { display: flex; align-items: center; gap: .6rem; color: #ff7b72; font-size: .95rem; margin-bottom: .75rem; }
        .conflict-list { display: flex; flex-direction: column; gap: .5rem; }
        .conflict-item { display: flex; align-items: flex-start; gap: .65rem; }
        .conflict-desc { font-size: .88rem; color: var(--text2); line-height: 1.55; }
        .conflict-desc strong { color: var(--text); }

        .entries-header { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-top: .5rem; }
        .entries-title { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: .6rem; }
        .already-added {
          display: flex; align-items: center; gap: .4rem;
          font-size: .83rem; color: var(--accent); font-weight: 500;
        }
        .entries-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        /* ── Entry Card ── */
        .entry-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1.1rem;
          display: flex; flex-direction: column; gap: .85rem;
          transition: border-color .2s;
        }
        .entry-card:hover { border-color: var(--border2); }
        .entry-has-conflict { border-color: rgba(248,81,73,.35) !important; }

        .entry-head { display: flex; align-items: center; gap: .7rem; }
        .entry-avatar {
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--accent2), var(--blue));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 1rem; color: #fff;
        }
        .entry-person { flex: 1; min-width: 0; }
        .entry-name { font-weight: 600; font-size: .95rem; }
        .entry-team { font-size: .78rem; color: var(--text2); display: flex; align-items: center; gap: .3rem; margin-top: 2px; }
        .entry-actions { display: flex; align-items: center; gap: .3rem; margin-left: auto; flex-shrink: 0; }
        .own-badge {
          font-size: .7rem; font-weight: 700;
          background: rgba(63,185,80,.15); color: var(--accent);
          border: 1px solid rgba(63,185,80,.3); border-radius: 99px;
          padding: .15rem .5rem;
        }
        .entry-del:hover { color: var(--red) !important; }

        /* ── Activities list inside card ── */
        .entry-acts { display: flex; flex-direction: column; gap: .6rem; }
        .entry-act {
          display: flex; gap: .65rem; align-items: flex-start;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: .7rem .8rem;
          transition: border-color .18s;
        }
        .entry-act-conflict { border-color: rgba(248,81,73,.35) !important; background: rgba(248,81,73,.05); }
        .entry-act-num {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          background: var(--bg); border: 1px solid var(--border2);
          display: flex; align-items: center; justify-content: center;
          font-size: .7rem; font-weight: 700; color: var(--text3); margin-top: 1px;
        }
        .entry-act-details { flex: 1; display: flex; flex-direction: column; gap: .25rem; }
        .mini-conflict-badge {
          display: inline-flex; align-items: center; gap: .25rem;
          font-size: .68rem; font-weight: 700; color: #ff7b72;
          background: rgba(248,81,73,.12); border: 1px solid rgba(248,81,73,.25);
          border-radius: 99px; padding: .1rem .45rem; margin-bottom: .2rem; align-self: flex-start;
        }
        .entry-detail { display: flex; align-items: center; gap: .4rem; font-size: .8rem; color: var(--text2); }
        .entry-detail svg { color: var(--text3); flex-shrink: 0; }

        /* ── Empty ── */
        .empty-state {
          text-align: center; padding: 3rem 1rem;
          color: var(--text2); display: flex; flex-direction: column; align-items: center; gap: .5rem;
        }
        .empty-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--bg3); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--text3); margin-bottom: .5rem;
        }

        @media(max-width: 500px) {
          .session-header-inner { padding: .7rem 1rem; }
          .entries-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
