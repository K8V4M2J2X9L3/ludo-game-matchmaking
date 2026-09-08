import { useEffect, useState } from 'react';
import { configureRealtimeDatabase } from '@/firebase';
import { apiUrl } from '@/lib/api';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);
    fetch(apiUrl('/api/admin/database-config'), { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((config) => configureRealtimeDatabase(config?.databaseURL))
      .catch(() => null)
      .finally(() => {
        window.clearTimeout(timeout);
        setDatabaseReady(true);
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  if (!databaseReady) {
    return <div className="app-loading"><span className="waiting-spinner" />Connecting to FriendLudo…</div>;
  }
  return <Component {...pageProps} />;
}

export default MyApp;
