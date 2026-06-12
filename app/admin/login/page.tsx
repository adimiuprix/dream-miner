"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const from        = searchParams.get("from") ?? "/admin";

  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Login failed");
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight:       "100vh",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        background:      "var(--admin-bg, #0a0a0a)",
        padding:         "1rem",
      }}
    >
      <div
        style={{
          width:        "100%",
          maxWidth:     360,
          background:   "var(--admin-surface, #111)",
          border:       "1px solid var(--admin-border, rgba(255,255,255,0.08))",
          borderRadius: 16,
          padding:      "2rem",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          48,
              height:         48,
              borderRadius:   12,
              background:     "rgba(99,102,241,0.15)",
              fontSize:       22,
              marginBottom:   "0.75rem",
            }}
          >
            ⛏
          </div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", margin: 0 }}>
            Dream Miner
          </h1>
          <p style={{ fontSize: "0.75rem", color: "#666", marginTop: 4 }}>Admin Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#888", marginBottom: 6 }}
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoFocus
              style={{
                width:        "100%",
                padding:      "0.625rem 0.875rem",
                borderRadius: 8,
                border:       "1px solid rgba(255,255,255,0.1)",
                background:   "rgba(255,255,255,0.04)",
                color:        "#fff",
                fontSize:     "0.875rem",
                outline:      "none",
                boxSizing:    "border-box",
              }}
            />
          </div>

          {error && (
            <p
              style={{
                fontSize:     "0.8rem",
                color:        "#f87171",
                background:   "rgba(239,68,68,0.08)",
                border:       "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8,
                padding:      "0.5rem 0.75rem",
                margin:       0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              padding:      "0.65rem",
              borderRadius: 8,
              border:       "none",
              background:   loading ? "rgba(99,102,241,0.4)" : "#6366f1",
              color:        "#fff",
              fontWeight:   700,
              fontSize:     "0.875rem",
              cursor:       loading ? "not-allowed" : "pointer",
              transition:   "opacity 0.15s",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
