import { createContext, useContext, useMemo, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qura_user")) || null; }
    catch { return null; }
  });

  useEffect(() => {
    try {
      if (user) localStorage.setItem("qura_user", JSON.stringify(user));
      else localStorage.removeItem("qura_user");
    } catch {}
  }, [user]);

  const login  = (data) => setUser(data);
  const logout = () => setUser(null);

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ✅ Never return null: always a safe fallback
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  return ctx ?? { user: null, login: () => {}, logout: () => {} };
};
