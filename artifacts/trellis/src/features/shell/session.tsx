import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '@workspace/replit-auth-web';

type Session = ReturnType<typeof useAuth>;

const SessionContext = createContext<Session | null>(null);

/** Loads the signed-in user once and shares it (plus login/logout) with the app. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <SessionContext.Provider value={auth}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
