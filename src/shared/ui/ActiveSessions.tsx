import { useEffect, useState } from 'react';
import { Badge, Spinner } from "@shared/ui";
import { identityApi } from '../../lib/zodiosClients';
import { useToast } from '../../contexts/ToastContext';
import { asUntyped } from '../../lib/untypedResponse';

export interface ActiveSessionsProps {
  callingService: string;
  onAddApiLog?: (log: { id: string; label: string; method: string }) => void;
}

export function ActiveSessions({ callingService, onAddApiLog }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const { showError } = useToast();

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      if (onAddApiLog) {
        onAddApiLog({ id: 'get_sessions', label: `GET /api/v1/internal/auth/sessions`, method: 'GET' });
      }
      const res = await identityApi.auth.get('/api/v1/internal/auth/sessions', { 
        headers: { 'X-Calling-Service': callingService } 
      });
      if (res?.data) {
        setSessions(res.data as unknown[]);
      }
    } catch (e: unknown) {
      console.error(e);
      showError('Failed to load active sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      if (onAddApiLog) {
        onAddApiLog({ id: `revoke_${sessionId}`, label: `DELETE /api/v1/internal/auth/sessions/${sessionId}`, method: 'DELETE' });
      }
      await identityApi.auth.delete('/api/v1/internal/auth/sessions/:sessionId', undefined, { 
        params: { sessionId }, 
        headers: { 'X-Calling-Service': callingService } 
      });
      
      // Reload sessions
      await loadSessions();
    } catch (e: unknown) {
      // @ts-expect-error auto-migration type suppression
      if (e.status === 401) {
        // We revoked our own session
        window.location.href = '/';
      } else {
        console.error(e);
        showError('Failed to revoke session');
      }
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pt-6 border-t border-rose-500/10">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">Logged-in Devices</h4>
      </div>
      <div className="space-y-2">
        {isLoadingSessions ? (
          <div className="text-center py-6 text-sm font-bold text-slate-500 dark:text-slate-400">
            <Spinner size="sm" className="mx-auto mb-2" />
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-sm font-bold text-slate-500 dark:text-slate-400">
            No active sessions found.
          </div>
        ) : (
          sessions.map((s: unknown) => {
            const session = asUntyped<unknown>(s) as { id?: string, sessionId?: string, serviceName?: string, os?: string, browser?: string, deviceInfo?: string, lastActive?: string | number };
            const sessionId = session.sessionId || session.id || "";
            const os = session.os || "Unknown";
            const browser = session.browser || "Unknown";
            
            return (
              <div key={sessionId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {session.serviceName ? <Badge variant="warning" className="mr-2 text-[9px] px-1.5 py-0.5">{session.serviceName}</Badge> : null}
                    {os} • {browser}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{session.deviceInfo}</p>
                  <p className="text-[9px] text-rose-500 mt-0.5">Last Active: {session.lastActive ? new Date(session.lastActive).toLocaleString() : ''}</p>
                </div>
                <button
                  onClick={() => revokeSession(sessionId)}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold p-1 shrink-0"
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
