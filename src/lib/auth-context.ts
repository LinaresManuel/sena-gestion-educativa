import { createContext, useContext } from "react";

interface AuthUser {
  id: number;
  username: string;
  nombre: string;
  rol: string;
  debeCambiarPassword: boolean;
}

export const AuthContext = createContext<AuthUser | null>(null);

export function useAuth() {
  const user = useContext(AuthContext);
  if (!user) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return user;
}

export function useCanEdit() {
  const user = useAuth();
  return user.rol === "admin" || user.rol === "editor";
}
