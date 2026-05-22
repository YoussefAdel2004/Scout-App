import React from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import Home from './pages/Home';
import Session from './pages/Session';
import './index.css';

function Router() {
  const { sessionCode } = useSession();
  return sessionCode ? <Session /> : <Home />;
}

export default function App() {
  return (
    <SessionProvider>
      <Router />
    </SessionProvider>
  );
}
