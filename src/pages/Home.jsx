import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';

export default function Home() {
  const { createSession, joinSession, loading } = useSession();
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining]   = useState(false);

  async function handleCreate() {
    setCreating(true); setError('');
    try { await createSession(); }
    catch (e) { setError(e.message); }
    finally { setCreating(false); }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!code.trim()) return setError('Please enter a session code.');
    setJoining(true); setError('');
    try { await joinSession(code); }
    catch (e) { setError('Session not found or network error.'); }
    finally { setJoining(false); }
  }

  return (
    <div className="home-wrap">
      {/* Hero */}
      <div className="home-hero fade-in">
        <div className="home-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="M9 16l2 2 4-4"/>
          </svg>
        </div>
        <h1 className="home-title">Scout Scheduler</h1>
        <p className="home-subtitle">
          Create a shared session, let each team fill their schedule,<br />
          and instantly see if there are any <span className="highlight">conflicts</span>.
        </p>
      </div>

      {/* Cards */}
      <div className="home-cards fade-in" style={{ animationDelay: '.1s' }}>

        {/* Create */}
        <div className="card home-card">
          <div className="home-card-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <h2 className="home-card-title">New Session</h2>
          <p className="home-card-desc">Start fresh. A unique code will be generated — share it with your team.</p>
          <button
            id="btn-create-session"
            className="btn btn-primary btn-full btn-lg"
            onClick={handleCreate}
            disabled={creating || loading}
          >
            {creating ? <><span className="spinner" /> Creating…</> : <>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Session
            </>}
          </button>
        </div>

        {/* Divider */}
        <div className="home-or"><span>or</span></div>

        {/* Join */}
        <div className="card home-card">
          <div className="home-card-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </div>
          <h2 className="home-card-title">Join Session</h2>
          <p className="home-card-desc">Have a code? Enter it to join your team's session and add your schedule.</p>
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            <input
              id="input-session-code"
              className="input"
              placeholder="e.g. AB3X7K"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
              maxLength={8}
              autoComplete="off"
              spellCheck={false}
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '.15em', fontWeight: 600 }}
            />
            <button
              id="btn-join-session"
              type="submit"
              className="btn btn-secondary btn-full btn-lg"
              disabled={joining || loading}
            >
              {joining ? <><span className="spinner" /> Joining…</> : <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Join Session
              </>}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="home-error fade-in">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <style>{`
        .home-wrap {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          gap: 2rem;
        }
        .home-hero { text-align: center; }
        .home-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 72px; height: 72px;
          background: linear-gradient(135deg, rgba(63,185,80,.2), rgba(56,139,253,.15));
          border: 1px solid rgba(63,185,80,.3);
          border-radius: 20px;
          color: var(--accent);
          margin-bottom: 1rem;
        }
        .home-title { font-size: 2.2rem; font-weight: 800; letter-spacing: -.03em; margin-bottom: .5rem; }
        .home-subtitle { color: var(--text2); font-size: 1rem; line-height: 1.6; }
        .highlight { color: var(--accent); font-weight: 600; }

        .home-cards {
          display: flex;
          align-items: stretch;
          gap: 0;
          width: 100%;
          max-width: 700px;
        }
        .home-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: .65rem;
          padding: 1.75rem;
        }
        .home-card-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: var(--radius-sm);
          margin-bottom: .25rem;
        }
        .home-card-icon.green { background: rgba(63,185,80,.15); color: var(--accent); border: 1px solid rgba(63,185,80,.25); }
        .home-card-icon.blue  { background: rgba(56,139,253,.15); color: var(--blue);   border: 1px solid rgba(56,139,253,.25); }
        .home-card-title { font-size: 1.1rem; font-weight: 700; }
        .home-card-desc  { color: var(--text2); font-size: .88rem; line-height: 1.55; flex:1; }

        .home-or {
          display: flex; align-items: center; justify-content: center;
          padding: 0 1rem;
          color: var(--text3); font-size: .85rem; font-weight: 500;
          position: relative;
        }
        .home-or span {
          background: var(--bg);
          padding: .4rem;
          border: 1px solid var(--border);
          border-radius: 99px;
          line-height: 1;
        }
        .home-error {
          display: flex; align-items: center; gap: .5rem;
          color: var(--red);
          background: rgba(248,81,73,.1);
          border: 1px solid rgba(248,81,73,.3);
          border-radius: var(--radius-sm);
          padding: .65rem 1rem;
          font-size: .88rem;
          max-width: 700px;
          width: 100%;
        }
        @media(max-width:600px){
          .home-cards { flex-direction: column; }
          .home-or { flex-direction: row; padding: .5rem 0; }
          .home-title { font-size: 1.7rem; }
        }
      `}</style>
    </div>
  );
}
