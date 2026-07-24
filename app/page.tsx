"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Diffboard: landing page
// ─────────────────────────────────────────────────────────────────────────────

interface DatasetSummary {
  slug: string;
  name: string;
  description: string;
  tags: string[];
}

const FONT_LINK_ID = "diffboard-fonts";

const DATASETS: DatasetSummary[] = [
  {
    slug: "job-board-listings",
    name: "job-board-listings",
    description:
      "Job listings aggregated nightly from major public job boards and startup-hiring pages, tracking title, company, location, and compensation across sources.",
    tags: ["jobs", "remote", "hybrid"],
  },
  {
    slug: "dev-electronics-listings",
    name: "dev-electronics-listings",
    description:
      "Amazon listing data for developer and hardware electronics, GPUs, RAM, mini PCs, and monitors, including product variants, pricing, and specs per category.",
    tags: ["electronics", "hardware"],
  },
];

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

export default function LandingPage() {
  useFonts();

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

  const theme = dark
    ? {
        bg: "#0F1115",
        surface: "#171A20",
        border: "#282C34",
        ink: "#EDEEF1",
        sub: "#9198A6",
        accent: "#5B8DFF",
        accentTint: "#1A2440",
      }
    : {
        bg: "#FAFAF8",
        surface: "#FFFFFF",
        border: "#E8E9ED",
        ink: "#14161A",
        sub: "#6B7280",
        accent: "#2451E0",
        accentTint: "#F0F3FF",
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

        .db-hero {
          padding: clamp(32px, 6vw, 56px) clamp(16px, 4vw, 32px) clamp(20px, 4vw, 32px);
        }
        .db-hero-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: clamp(28px, 5vw, 40px);
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin: 0 0 10px;
        }
        .db-hero-sub {
          font-size: clamp(14px, 2vw, 16px);
          color: ${theme.sub};
          max-width: 560px;
          line-height: 1.5;
          margin: 0;
        }
        .db-hero-source {
          font-size: 13px;
          color: ${theme.sub};
          margin: 12px 0 0;
        }
        .db-hero-source a {
          color: ${theme.accent};
          text-decoration: none;
          font-weight: 500;
        }
        .db-hero-source a:hover { text-decoration: underline; }

        .db-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          padding: 0 clamp(16px, 4vw, 32px) clamp(32px, 6vw, 56px);
        }

        .db-card {
          background: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 14px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .db-card:hover {
          border-color: ${theme.accent};
          transform: translateY(-2px);
        }
        .db-card-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          font-weight: 500;
          color: ${theme.ink};
        }
        .db-card-desc {
          font-size: 13px;
          line-height: 1.55;
          color: ${theme.sub};
          margin: 0;
        }
        .db-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .db-tag {
          font-size: 11px;
          background: ${theme.accentTint};
          color: ${theme.accent};
          padding: 3px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .db-card-footer {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid ${theme.border};
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .db-arrow {
          font-size: 16px;
          color: ${theme.accent};
        }

        @media (max-width: 480px) {
          .db-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="db-header">
        <span
          className="db-display"
          style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Diffboard
        </span>
        <button
          className="db-icon-btn"
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {dark ? "☀" : "☾"}
        </button>
      </header>

      <section className="db-hero">
        <h1 className="db-hero-title">Datasets</h1>
        <p className="db-hero-sub">
          Browse and query the datasets pulled from Quorel. Pick one to search,
          filter, and view it cleanly.
        </p>
        <p className="db-hero-source">
          Sourced from{" "}
          <a href="https://quorel.vercel.app" target="_blank" rel="noreferrer">
            Quorel's public datasets
          </a>
          . Grab your own or browse more there.
        </p>
      </section>

      <div className="db-grid">
        {DATASETS.map((ds) => (
          <Link key={ds.slug} href={`/${ds.slug}`} className="db-card">
            <span className="db-card-name">{ds.name}</span>
            <p className="db-card-desc">{ds.description}</p>
            <div className="db-tags">
              {ds.tags.map((t) => (
                <span className="db-tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="db-card-footer">
              <span className="db-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
