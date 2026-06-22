import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from './useAuth';
import type { User, Session } from '../types/auth.types';
import { buildDemoSessionPayload, readDemoAccess } from '../lib/demo-access';
import { authSessionQueryOptions } from '../lib/auth-session.query';
import { mergeUserWithStoredCompanyContext } from '@/lib/company-context';

/**
 * useAuthSession - Hook de Sincronización de Sesión 2026
 * 
 * Actúa como un puente entre la persistencia de cookies de BetterAuth
 * (gestionada via React Query) y el estado reactivo global de Zustand.
 * 
 * ESTRATEGIA:
 * - React Query es el dueño del fetching de la sesión.
 * - Zustand es el dueño del acceso síncrono a los datos del usuario.
 */
export function useAuthSession() {
  const setSession = useAuthStore((state) => state.setSession);
  const isAuthenticatedInStore = useAuthStore((state) => state.isAuthenticated);

  const { data: sessionData, isPending, error } = useQuery(authSessionQueryOptions());
  const demoAccess = useMemo(
    () => (!isPending && !sessionData ? readDemoAccess() : null),
    [isPending, sessionData],
  );
  const demoSessionData = useMemo(
    () => (demoAccess ? buildDemoSessionPayload(demoAccess) : null),
    [demoAccess],
  );
  const activeSessionData = sessionData ?? demoSessionData;
  const activeUser = useMemo(
    () =>
      activeSessionData?.user
        ? mergeUserWithStoredCompanyContext(activeSessionData.user as User)
        : null,
    [activeSessionData],
  );
  const activeSession = (activeSessionData?.session as Session) || null;

  /**
   * Sincronización de Sesión:
   * Solo disparamos el update de Zustand cuando los datos de React Query cambian
   * o cuando el estado de carga termina.
   */
  useEffect(() => {
    // 1. Si tenemos datos reales de BetterAuth
    if (activeUser) {
      setSession({
        user: activeUser,
        session: activeSession,
      });
      return;
    }

    // 3. Si definitivamente no hay sesión
    if (!isPending && !sessionData && isAuthenticatedInStore) {
      setSession(null);
    }
  }, [activeUser, activeSession, sessionData, isPending, setSession, isAuthenticatedInStore]);

  return {
    session: activeSession,
    user: activeUser,
    isLoading: isPending,
    error,
    isAuthenticated: !!activeUser,
  };
}
