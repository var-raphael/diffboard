"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Diffboard — dev-electronics-listings dataset page
// ─────────────────────────────────────────────────────────────────────────────

interface ElectronicsEntity {
  _source?: string;
  brand?: string | null;
  currency?: string | null;
  image_url?: string | null;
  is_prime?: boolean | null;
  price?: number | string | null;
  product_url?: string | null;
  rating?: number | null;
  star_rating?: number | null;
  review_count?: number | null;
  title?: string | null;
  variant_spec?: string | null;
}

const API_BASE = "/api/dev-electronics-listings";
const FONT_LINK_ID = "diffboard-fonts";

const CATEGORY_TERMS: { label: string; terms: string[] }[] = [
  { label: "GPUs", terms: ["graphics card", "rtx", "radeon rx", "geforce"] },
  { label: "RAM", terms: ["ddr5", "ddr4", "memory", "ram"] },
  { label: "Mini PCs", terms: ["mini pc", "mini computer", "micro desktop"] },
  { label: "Monitors", terms: ["monitor", "display", "1440p", "wqhd", "144hz"] },
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

function parsePrice(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const cleaned = v.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function formatPrice(v: number | string | null | undefined): string | null {
  const n = parsePrice(v);
  if (n === null) return null;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getRating(e: ElectronicsEntity): number | null {
  return e.rating ?? e.star_rating ?? null;
}

function dedupeKey(e: ElectronicsEntity): string {
  return e.product_url || `${e.title}-${e.brand}-${e.variant_spec}`;
}

function categoryOf(e: ElectronicsEntity): string {
  const text = `${e.title ?? ""} ${e._source ?? ""}`.toLowerCase();
  for (const cat of CATEGORY_TERMS) {
    if (cat.terms.some((t) => text.includes(t))) return cat.label;
  }
  return "Other";
}

export default function ElectronicsPage() {
  useFonts();

  const [entities, setEntities] = useState<ElectronicsEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keywords, setKeywords] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inStockPriceOnly, setInStockPriceOnly] = useState(true);
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

  const brands = useMemo(() => {
    const s = new Set<string>();
    entities.forEach((e) => e.brand && s.add(e.brand));
    return Array.from(s).sort();
  }, [entities]);

  const clean = useMemo(() => {
    const seen = new Set<string>();
    let rows = entities.filter((e) => {
      if (!e.title || !e.product_url) return false;
      const key = dedupeKey(e);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (inStockPriceOnly) {
      rows = rows.filter((e) => parsePrice(e.price) !== null);
    }

    if (brandFilter !== "all") {
      rows = rows.filter((e) => e.brand === brandFilter);
    }

    if (categoryFilter !== "all") {
      rows = rows.filter((e) => categoryOf(e) === categoryFilter);
    }

    if (keywords.trim()) {
      const terms = keywords
        .toLowerCase()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      rows = rows.filter((e) => {
        const haystack = `${e.title} ${e.brand} ${e.variant_spec}`.toLowerCase();
        return terms.some((t) => haystack.includes(t));
      });
    }

    rows.sort((a, b) => {
      const ra = getRating(a) ?? -1;
      const rb = getRating(b) ?? -1;
      return rb - ra;
    });

    return rows;
  }, [entities, inStockPriceOnly, brandFilter, categoryFilter, keywords]);

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
        imgBg: "#1D2028",
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
        imgBg: "#F3F4F6",
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
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
          padding: 20px clamp(16px, 4vw, 32px) 48px;
        }

        .db-card {
          background: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          text-decoration: none;
          color: inherit;
        }
        .db-card-imgwrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          background: ${theme.imgBg};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .db-card-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .db-card-img-fallback {
          font-size: 11px;
          color: ${theme.sub};
        }
        .db-card-brand {
          font-size: 11px;
          font-weight: 600;
          color: ${theme.accent};
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .db-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          line-height: 1.35;
          color: ${theme.ink};
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .db-card-spec {
          font-size: 11.5px;
          color: ${theme.sub};
        }
        .db-card-footer {
          margin-top: auto;
          padding-top: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .db-price {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 500;
          color: ${theme.ink};
        }
        .db-rating {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          color: ${theme.sub};
          white-space: nowrap;
        }
        .db-prime-pill {
          font-size: 10px;
          font-weight: 600;
          background: ${theme.accentTint};
          color: ${theme.accent};
          padding: 2px 7px;
          border-radius: 999px;
          white-space: nowrap;
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
          <span style={{ fontSize: 13, color: theme.sub }}>
            dev-electronics-listings
          </span>
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
          placeholder="Search title, brand, spec…"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <select
          className="db-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {CATEGORY_TERMS.map((c) => (
            <option key={c.label} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="db-select"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
        >
          <option value="all">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="db-toggle-chip" data-active={inStockPriceOnly}>
          <input
            type="checkbox"
            checked={inStockPriceOnly}
            onChange={(e) => setInStockPriceOnly(e.target.checked)}
          />
          Priced only
        </label>
      </div>

      {error && (
        <div className="db-error">Couldn't load the dataset — {error}. Try refresh.</div>
      )}

      {!error && loading && entities.length === 0 && (
        <div className="db-loading">Loading dev-electronics-listings…</div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="db-empty">No products match these filters. Try clearing search.</div>
      )}

      {visible.length > 0 && (
        <>
          <div className="db-grid">
            {visible.map((item, i) => {
              const price = formatPrice(item.price);
              const rating = getRating(item);

              const card = (
                <>
                  <div className="db-card-imgwrap">
                    {item.image_url ? (
                      <img
                        className="db-card-img"
                        src={item.image_url}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="db-card-img-fallback">No image</span>
                    )}
                  </div>
                  {item.brand && <span className="db-card-brand">{item.brand}</span>}
                  <span className="db-card-title">{item.title}</span>
                  {item.variant_spec && (
                    <span className="db-card-spec">{item.variant_spec}</span>
                  )}
                  <div className="db-card-footer">
                    {price ? (
                      <span className="db-price">{price}</span>
                    ) : (
                      <span className="db-rating">Price unavailable</span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {item.is_prime && <span className="db-prime-pill">Prime</span>}
                      {rating !== null && (
                        <span className="db-rating">
                          ★{rating.toFixed(1)}
                          {item.review_count ? ` (${item.review_count})` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              return item.product_url ? (
                <a
                  className="db-card"
                  key={i}
                  href={item.product_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {card}
                </a>
              ) : (
                <div className="db-card" key={i}>
                  {card}
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
