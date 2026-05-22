import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, hasSupabase } from '../utils/supabase';
import { detectConflicts } from '../utils/conflicts';

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

// ── Local Storage helpers ─────────────────────────────────────────────────
const LS_KEY     = 'scout_sessions';
const MY_KEY     = 'scout_my_entry'; // sessionStorage: entryId per session

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveSessions(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getMyEntryId(sessionCode) {
  try { return JSON.parse(sessionStorage.getItem(MY_KEY) || '{}')[sessionCode] || null; }
  catch { return null; }
}
function setMyEntryId(sessionCode, id) {
  try {
    const map = JSON.parse(sessionStorage.getItem(MY_KEY) || '{}');
    map[sessionCode] = id;
    sessionStorage.setItem(MY_KEY, JSON.stringify(map));
  } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────
export function SessionProvider({ children }) {
  const [sessionCode, setSessionCode] = useState(null);
  const [entries,     setEntries]     = useState([]);
  const [conflicts,   setConflicts]   = useState([]);
  const [myEntryId,   setMyEntryId_]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    setConflicts(detectConflicts(entries));
  }, [entries]);

  // ── Supabase realtime ──
  const subscribeRealtime = useCallback((code) => {
    if (!hasSupabase) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`session-${code}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'session_entries',
        filter: `session_code=eq.${code}`
      }, () => fetchEntries(code))
      .subscribe();
    channelRef.current = ch;
  }, []);

  // ── Fetch entries ──
  const fetchEntries = useCallback(async (code) => {
    if (!code) return;
    if (hasSupabase) {
      const { data } = await supabase
        .from('session_entries')
        .select('*')
        .eq('session_code', code)
        .order('created_at', { ascending: true });
      // activities stored as JSONB — already parsed by supabase client
      setEntries((data || []).map(e => ({ ...e, activities: e.activities || [] })));
    } else {
      const sessions = loadSessions();
      setEntries(sessions[code]?.entries || []);
    }
  }, []);

  // ── Join / Create ──
  const joinSession = useCallback(async (code) => {
    setLoading(true);
    const upper = code.toUpperCase().trim();
    if (hasSupabase) {
      const { data: existing } = await supabase
        .from('sessions').select('code').eq('code', upper).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from('sessions').insert({ code: upper });
        if (error && error.code !== '23505') { setLoading(false); throw error; }
      }
    } else {
      const sessions = loadSessions();
      if (!sessions[upper]) { sessions[upper] = { entries: [] }; saveSessions(sessions); }
    }
    await fetchEntries(upper);
    subscribeRealtime(upper);
    const mine = getMyEntryId(upper);
    setMyEntryId_(mine);
    setSessionCode(upper);
    setLoading(false);
    return upper;
  }, [fetchEntries, subscribeRealtime]);

  const createSession = useCallback(async () => joinSession(generateCode()), [joinSession]);

  const leaveSession = useCallback(() => {
    if (channelRef.current && hasSupabase) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    setSessionCode(null);
    setEntries([]);
    setConflicts([]);
    setMyEntryId_(null);
  }, []);

  // ── Add entry (name + team + activities[]) ──
  const addEntry = useCallback(async ({ name, team, activities }) => {
    if (!sessionCode) return;
    const id    = generateId();
    const entry = { id, session_code: sessionCode, name, team, activities, created_at: new Date().toISOString() };

    if (hasSupabase) {
      await supabase.from('session_entries').insert(entry);
    } else {
      const sessions = loadSessions();
      sessions[sessionCode].entries = [...(sessions[sessionCode].entries || []), entry];
      saveSessions(sessions);
      setEntries(prev => [...prev, entry]);
      window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY }));
    }

    setMyEntryId(sessionCode, id);
    setMyEntryId_(id);
  }, [sessionCode]);

  // ── Update own entry's activities ──
  const updateEntry = useCallback(async (id, { name, team, activities }) => {
    if (!sessionCode) return;
    if (hasSupabase) {
      await supabase.from('session_entries').update({ name, team, activities }).eq('id', id);
    } else {
      const sessions = loadSessions();
      sessions[sessionCode].entries = sessions[sessionCode].entries.map(e =>
        e.id === id ? { ...e, name, team, activities } : e
      );
      saveSessions(sessions);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, name, team, activities } : e));
      window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY }));
    }
  }, [sessionCode]);

  // ── Remove entry ──
  const removeEntry = useCallback(async (id) => {
    if (hasSupabase) {
      await supabase.from('session_entries').delete().eq('id', id);
    } else {
      const sessions = loadSessions();
      sessions[sessionCode].entries = sessions[sessionCode].entries.filter(e => e.id !== id);
      saveSessions(sessions);
      setEntries(prev => prev.filter(e => e.id !== id));
      window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY }));
    }
    // Clear ownership if they deleted their own
    if (id === myEntryId) { setMyEntryId_(null); }
  }, [sessionCode, myEntryId]);

  // Storage events (mock multi-tab)
  useEffect(() => {
    if (hasSupabase || !sessionCode) return;
    const handler = (e) => { if (e.key === LS_KEY) fetchEntries(sessionCode); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [sessionCode, fetchEntries]);

  return (
    <SessionContext.Provider value={{
      sessionCode, entries, conflicts, myEntryId, loading, hasSupabase,
      createSession, joinSession, leaveSession,
      addEntry, updateEntry, removeEntry,
    }}>
      {children}
    </SessionContext.Provider>
  );
}
