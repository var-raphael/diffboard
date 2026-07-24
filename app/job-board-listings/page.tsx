"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Diffboard — job-board-listings dataset page
// ─────────────────────────────────────────────────────────────────────────────

interface JobEntity {
  _source?: string;
  apply_url?: string;
  company?: string | null;
  date_posted?: string | null;
  job_title?: string | null;
  location?: string | null;
  salary_max?: number | string | null;
  salary_min?: number | string | null;
  source?: string;
}

const API_BASE = "/api/job-board-listings";
const FONT_LINK_ID = "diffboard-fonts";

function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

function formatSalary(v: number | string | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return `$${v.toLocaleString()}`;
  return String(v);
}

function formatDate(v: string | null | undefined): string {
  if (!v) return "";
  const parsed = Date.parse(v);
  if (!isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
  return v;
}

function dedupeKey(e: JobEntity): string {
  return JSON.stringify([e.job_title, e.company, e.location, e.apply_url]);
}

function isDevRole(job: JobEntity): boolean {
  const text = `${job.job_title ?? ""}`.toLowerCase();
  const devTerms = [
    "developer",
    "engineer",
    "engineering",
    "software",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "full stack",
    "full-stack",
    "devops",
    "sre",
    "qa engineer",
    "data engineer",
    "ml engineer",
    "machine learning",
    "programmer",
    "swe",
    "cto",
    "architect",
    "python developer",
    "web developer",
    "ai engineer",
  ];
  return devTerms.some((t) => text.includes(t));
}

export default function JobBoardPage() {
  useFonts();

  const [entities, setEntities] = useState<JobEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keywords, setKeywords] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [devOnly, setDevOnly] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("diffboard-theme");
    if (stored) {
      setDark(stored === "dark");
    } else if (window.matchMedia) {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d;
      window.localStorage.setItem("diffboard-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setEntities(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load dataset");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sources = useMemo(() => {
    const s = new Set<string>();
    entities.forEach((e) => e.source && s.add(e.source));
    return Array.from(s).sort();
  }, [entities]);

  const clean = useMemo(() => {
    const seen = new Set<string>();
    let rows = entities.filter((e) => {
      if (!e.job_title || !e.company) return false;
      const key = dedupeKey(e);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (sourceFilter !== "all") {
      rows = rows.filter((e) => e.source === sourceFilter);
    }

    if (devOnly) {
      rows = rows.filter(isDevRole);
    }

    if (keywords.trim()) {
      const terms = keywords
        .toLowerCase()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      rows = rows.filter((e) => {
        const haystack = `${e.job_title} ${e.company} ${e.location}`.toLowerCase();
        return terms.some((t) => haystack.includes(t));
      });
    }

    rows.sort((a, b) => {
      const da = a.date_posted ? Date.parse(a.date_posted) : NaN;
      const db = b.date_posted ? Date.parse(b.date_posted) : NaN;
      if (!isNaN(da) && !isNaN(db)) return db - da;
      return 0;
    });

    return rows;
  }, [entities, sourceFilter, devOnly, keywords]);

  const visible = clean.slice(0, visibleCount);

  const theme = dark
    ? {
        bg: "#0F1115",
        surface: "#171A20",
        border: "#282C34",
        ink: "#EDEEF1",
        sub: "#9198A6",
        accent: "#5B8DFF",
        accentTint: "#1A2440",
        errBg: "#2A1712",
        errBorder: "#4A281C",
        errInk: "#F0A98F",
      }
    : {
        bg: "#FAFAF8",
        surface: "#FFFFFF",
        border: "#E8E9ED",
        ink: "#14161A",
        sub: "#6B7280",
        accent: "#2451E0",
        accentTint: "#F0F3FF",
        errBg: "#FFF3F0",
        errBorder: "#F3C9BE",
        errInk: "#8A2E1B",
      };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.ink,
        fontFamily: "'Inter', sans-serif",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: ${theme.accentTint}; color: ${theme.accent}; }
        .db-mono { font-family: 'JetBrains Mono', monospace; }
        .db-display { font-family: 'Space Grotesk', sans-serif; }

        .db-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid ${theme.border};
          padding: 18px clamp(16px, 4vw, 32px);
        }
        .db-title-group {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .db-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: ${theme.accent};
          background: ${theme.accentTint};
          padding: 2px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .db-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .db-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          border: 1px solid ${theme.border};
          background: ${theme.surface};
          color: ${theme.ink};
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        }
        .db-icon-btn:hover { border-color: ${theme.accent}; }

        .db-toolbar {
          display: flex;
          gap: 10px;
          padding: 14px clamp(16px, 4vw, 32px);
          border-bottom: 1px solid ${theme.border};
          flex-wrap: wrap;
          align-items: center;
        }

        .db-input, .db-select {
          -webkit-appearance: none;
          appearance: none;
          display: inline-flex;
          align-items: center;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          border: 1px solid ${theme.border};
          background: ${theme.surface};
          border-radius: 8px;
          padding: 0 12px;
          font-size: 13px;
          line-height: normal;
          color: ${theme.ink};
          outline: none;
          transition: border-color 0.15s ease;
          height: 38px;
          max-height: 38px;
          flex-grow: 0;
          flex-shrink: 0;
        }
        .db-input:focus, .db-select:focus { border-color: ${theme.accent}; }
        .db-input { flex-basis: 220px; flex-grow: 1; min-width: 160px; }
        .db-select { cursor: pointer; flex-basis: auto; }
        .db-input::placeholder { color: ${theme.sub}; }

        .db-toggle-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid ${theme.border};
          background: ${theme.surface};
          font-size: 13px;
          color: ${theme.ink};
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .db-toggle-chip[data-active="true"] {
          border-color: ${theme.accent};
          background: ${theme.accentTint};
          color: ${theme.accent};
        }
        .db-toggle-chip input { accent-color: ${theme.accent}; cursor: pointer; }

        button.db-btn {
          font-family: 'Inter', sans-serif;
          background: ${theme.accent};
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 16px;
          height: 38px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s ease;
          white-space: nowrap;
        }
        button.db-btn:hover { opacity: 0.88; }
        button.db-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .db-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
          padding: 20px clamp(16px, 4vw, 32px) 48px;
        }

        .db-card {
          background: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .db-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.3;
          color: ${theme.ink};
          text-decoration: none;
          word-break: break-word;
        }
        .db-card-title:hover { color: ${theme.accent}; }
        .db-card-company {
          font-size: 13px;
          color: ${theme.sub};
          font-weight: 500;
        }
        .db-card-location {
          font-size: 12px;
          color: ${theme.sub};
        }
        .db-card-footer {
          margin-top: auto;
          padding-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .db-source-pill {
          font-size: 11px;
          background: ${theme.accentTint};
          color: ${theme.accent};
          padding: 3px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .db-salary {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: ${theme.ink};
        }
        .db-date {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: ${theme.sub};
        }

        .db-empty, .db-loading, .db-error {
          padding: 64px 16px;
          text-align: center;
          color: ${theme.sub};
          font-size: 14px;
        }
        .db-error {
          margin: 20px clamp(16px, 4vw, 32px);
          padding: 16px;
          border-radius: 8px;
          background: ${theme.errBg};
          border: 1px solid ${theme.errBorder};
          color: ${theme.errInk};
          text-align: left;
        }

        @media (max-width: 480px) {
          .db-toolbar { flex-direction: column; align-items: stretch; }
          .db-input, .db-select, button.db-btn, .db-toggle-chip { width: 100%; }
        }
      `}</style>

      <header className="db-header">
        <div className="db-title-group">
          <span
            className="db-display"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Diffboard
          </span>
          <span style={{ fontSize: 13, color: theme.sub }}>job-board-listings</span>
        </div>
        <div className="db-header-actions">
          <button
            className="db-icon-btn"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {dark ? "☀" : "☾"}
          </button>
          <button className="db-btn" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <div className="db-toolbar">
        <input
          className="db-input"
          placeholder="Search title, company, location…"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <select
          className="db-select"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="db-toggle-chip" data-active={devOnly}>
          <input
            type="checkbox"
            checked={devOnly}
            onChange={(e) => setDevOnly(e.target.checked)}
          />
          Dev roles only
        </label>
      </div>

      {error && (
        <div className="db-error">Couldn't load the dataset — {error}. Try refresh.</div>
      )}

      {!error && loading && entities.length === 0 && (
        <div className="db-loading">Loading job-board-listings…</div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="db-empty">No listings match these filters. Try clearing search.</div>
      )}

      {visible.length > 0 && (
        <>
          <div className="db-grid">
            {visible.map((job, i) => {
              const salaryText =
                formatSalary(job.salary_min) && formatSalary(job.salary_max)
                  ? `${formatSalary(job.salary_min)}–${formatSalary(job.salary_max)}`
                  : formatSalary(job.salary_min) || formatSalary(job.salary_max);

              return (
                <div className="db-card" key={i}>
                  {job.apply_url ? (
                    <a
                      className="db-card-title"
                      href={job.apply_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {job.job_title}
                    </a>
                  ) : (
                    <span className="db-card-title">{job.job_title}</span>
                  )}
                  <span className="db-card-company">{job.company}</span>
                  {job.location && (
                    <span className="db-card-location">{job.location}</span>
                  )}
                  <div className="db-card-footer">
                    <span className="db-source-pill">{job.source || "—"}</span>
                    {salaryText && <span className="db-salary">{salaryText}</span>}
                    {job.date_posted && (
                      <span className="db-date">{formatDate(job.date_posted)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {clean.length > visibleCount && (
            <div style={{ textAlign: "center", paddingBottom: 40 }}>
              <button
                className="db-btn"
                style={{
                  background: theme.surface,
                  color: theme.accent,
                  border: `1px solid ${theme.accent}`,
                }}
                onClick={() => setVisibleCount((c) => c + 24)}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
