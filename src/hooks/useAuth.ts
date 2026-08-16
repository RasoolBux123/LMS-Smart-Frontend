import { useContext } from "react";
import { AuthContext, type Role } from "../context/auth/AuthContext";

export type { Role };

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
