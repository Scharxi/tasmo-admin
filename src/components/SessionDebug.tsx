"use client";

import { useSession } from "next-auth/react";

export function SessionDebug() {
  const { data: session, status } = useSession();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>User:</strong> {session?.user?.name || "None"}</p>
      <p><strong>Email:</strong> {session?.user?.email || "None"}</p>
      <p><strong>Username:</strong> {session?.user?.username || "None"}</p>
      <details className="mt-2">
        <summary className="cursor-pointer">Full Session</summary>
        <pre className="mt-1 text-xs overflow-auto max-h-32">
          {JSON.stringify(session, null, 2)}
        </pre>
      </details>
    </div>
  );
} 