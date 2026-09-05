import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import { translateAuthError } from "./errors";

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

type AuthResult = { error: string | null };

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  /** true entre o clique no link de recuperação e a senha ser trocada com sucesso — ver UpdatePasswordPage. */
  isPasswordRecovery: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setStatus(newSession ? "authenticated" : "unauthenticated");
        setIsPasswordRecovery(event === "PASSWORD_RECOVERY");
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${ROUTES.entrar}`,
      },
    });
    return { error: error ? translateAuthError(error) : null };
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? translateAuthError(error) : null };
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async function requestPasswordReset(email: string): Promise<AuthResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${ROUTES.redefinirSenha}`,
    });
    return { error: error ? translateAuthError(error) : null };
  }

  async function updatePassword(password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      setIsPasswordRecovery(false);
    }
    return { error: error ? translateAuthError(error) : null };
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        user: session?.user ?? null,
        isPasswordRecovery,
        signUp,
        signIn,
        signOut,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
