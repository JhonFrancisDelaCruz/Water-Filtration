import { useCallback, useEffect, useState } from 'react';
import { getDeviceSnapshot } from './supabase';

export function useAquasense(refreshMs = 15000) {
  const [snapshot, setSnapshot] = useState({ device: null, readings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const next = await getDeviceSnapshot();
      setSnapshot(next);
      setError('');
    } catch (e) {
      setError(e?.message || 'Could not load device data.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => { void refresh(); }, 0);
    const timer = setInterval(refresh, refreshMs);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [refresh, refreshMs]);
  return { ...snapshot, loading, error, refresh };
}
