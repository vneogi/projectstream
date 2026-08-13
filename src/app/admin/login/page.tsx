"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Incorrect password");
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="page-glow" />
      <div className="container" style={{ maxWidth: "460px" }}>
        <span className="section__eyebrow">Editor access</span>
        <h1 className="section__title">Admin login</h1>
        <p className="section__lead">
          For the site owner to review submissions and publish articles.
        </p>

        <form onSubmit={handleSubmit} className="panel form">
          <div className="field">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="alert alert--error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
            <Icon name="arrow-right" />
          </button>
        </form>
      </div>
    </section>
  );
}
