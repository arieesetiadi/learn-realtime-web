"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { User } from "./types";

const SessionContext = createContext<User | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}

export function useSession(): User {
  const user = useContext(SessionContext);

  if (!user) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return user;
}
