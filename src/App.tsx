import React, { useEffect } from 'react';
import { AppRouter } from './routes/AppRouter';
import { runWardWatchSelfTests } from './lib/selftest';

export default function App() {
  useEffect(() => {
    // Run unit-style sanity tests for Rules 2, 4, 5, 10 on application load
    runWardWatchSelfTests();
  }, []);

  return <AppRouter />;
}
