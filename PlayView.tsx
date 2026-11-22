import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Gamepad2, Search, X, ExternalLink, Maximize2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// [name, sourceIndex, url, image, mode]  mode: 0 = fetch html, 1 = open directly, 3 = arcade id
type Row = [string, number, string, string, number];
interface Catalog { sources: string[]; games: Row[]; }

const PAGE = 60;
const base = (import.meta as any).env?.BASE_URL || '/';
const asset = (p: string) => (/^https?:/i.test(p) ? p : base + p.replace(/^\//, ''));

const letterTile = (name: string) => {
  const ch = (name.replace(/[^A-Za-z0-9]/g, '')[0] || '?').toUpperCase();
  return ch;
};

const PlayView: React.FC = () => {
  const [cat, setCat] = useState<Catalog | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [src, setSrc] = useState(-1);
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<Row | null>(null);
  const [frame, setFrame] = useState<{ src?: string; srcDoc?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const dq = useDeferredValue(q);

  useEffect(() => {
    fetch(asset('data/games.json'))
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((c: Catalog) => setCat(c))
      .catch(e => setError(String(e.message || e)));
  }, []);

  const lc = useMemo(() => (cat ? cat.games.map(g => g[0].toLowerCase()) : []), [cat]);

  const filtered = useMemo(() => {
    if (!cat) return [] as Row[];
    const t = dq.trim().toLowerCase();
    const out: Row[] = [];
    for (let i = 0; i < cat.games.length; i++) {
      const g = cat.games[i];
      if (src >= 0 && g[1] !== src) continue;
      if (t && !lc[i].includes(t)) continue;
      out.push(g);
    }
    return out;
  }, [cat, dq, src, lc]);

  useEffect(() => setPage(0), [dq, src]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const launch = async (g: Row) => {
    setActive(g);
    setFrame(null);
    const [name, , url, , mode] = g;
    if (mode === 3) {
      setLoading(true);
      try {
        const t = await (await fetch(asset('games/arcade.html'))).text();
        setFrame({ srcDoc: t.replace('data-game="STORM_ARCADE_GAME"', 'data-game="' + url + '"') });
      } catch { setFrame({ srcDoc: '<p style="font:14px monospace;color:#f66;padding:16px">Could not load ' + name + '</p>' }); }
      setLoading(false);
      return;
    }
    if (mode === 1) { setFrame({ src: asset(url) }); return; }
    // mode 0: fetch the page and run it inline so hosts that block framing still work
    setLoading(true);
    const tries = [url];
    const m = url.match(/^https:\/\/cdn\.jsdelivr\.net\/gh\/([^/]+)\/([^/@]+)@([^/]+)\/(.*)$/);
    if (m) tries.push(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`);
    for (const u of tries) {
      try {
        const r = await fetch(u);
        if (!r.ok) continue;
        let t = await r.text();
        if (!/<base\s/i.test(t)) t = t.replace(/<head[^>]*>/i, h => h + `<base href="${u}">`) || `<base href="${u}">` + t;
        setFrame({ srcDoc: t });
        setLoading(false);
        return;
      } catch { /* try next */ }
    }
    setFrame({ src: url });
    setLoading(false);
  };

  const close = () => { setActive(null); setFrame(null); };

  return (
    <div className="flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[var(--color-line)] pb-6">
          <div>
            <div className="flex items-center gap-3 text-[var(--color-accent)] font-mono text-[10px] tracking-widest mb-2"><Gamepad2 size={14} /> YAHIAZAKIZ_PLAY</div>
            <h2 className="text-4xl font-serif">Yahiazakiz Play</h2>
            <p className="font-mono text-xs text-[var(--color-text-muted)] mt-2">
              {cat ? `${cat.games.length.toLocaleString()} games from ${cat.sources.length} libraries` : 'Loading game library…'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 min-w-[260px]">
              <Search size={14} className="text-[var(--color-text-muted)]" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="SEARCH_GAMES"
                className="bg-transparent outline-none font-mono text-xs w-full placeholder:text-[var(--color-text-muted)]" />
            </div>
            <select value={src} onChange={e => setSrc(+e.target.value)}
              className="border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 font-mono text-xs max-w-[220px]">
              <option value={-1}>ALL_LIBRARIES</option>
              {cat?.sources.map((s, i) => <option key={i} value={i}>{s}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="border border-red-500/50 text-red-500 font-mono text-xs p-4">GAME_LIBRARY_ERROR: {error}</div>}
        {!cat && !error && <div className="flex items-center gap-3 font-mono text-xs text-[var(--color-text-muted)]"><Loader2 className="animate-spin" size={14} /> LOADING_CATALOG…</div>}

        {cat && (
          <>
            <div className="font-mono text-[10px] tracking-widest text-[var(--color-text-muted)]">
              {filtered.length.toLocaleString()} RESULTS — PAGE {page + 1}/{pages}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {shown.map((g, i) => (
                <button key={g[0] + g[2] + i} onClick={() => launch(g)}
                  className="group text-left bg-[var(--color-card)] border border-[var(--color-line)] hover:border-[var(--color-accent)] transition-colors flex flex-col">
                  <div className="aspect-square relative overflow-hidden bg-[var(--color-panel)] flex items-center justify-center">
                    <span className="absolute font-serif text-5xl text-[var(--color-accent)] opacity-40">{letterTile(g[0])}</span>
                    {g[3] && <img src={g[3]} alt="" loading="lazy" referrerPolicy="no-referrer"
                      onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                  </div>
                  <div className="p-2 border-t border-[var(--color-line)]">
                    <div className="text-xs font-bold truncate">{g[0]}</div>
                    <div className="text-[9px] font-mono text-[var(--color-text-muted)] truncate">{cat.sources[g[1]]}</div>
                  </div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && <div className="border border-dashed border-[var(--color-line)] p-10 text-center font-mono text-xs text-[var(--color-text-muted)]">NO_GAMES_MATCH</div>}
            <div className="flex items-center justify-center gap-4 pt-4 pb-10 font-mono text-xs">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border border-[var(--color-line)] px-3 py-2 disabled:opacity-30 hover:border-[var(--color-accent)]"><ChevronLeft size={14} /></button>
              <span>{page + 1} / {pages}</span>
              <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="border border-[var(--color-line)] px-3 py-2 disabled:opacity-30 hover:border-[var(--color-accent)]"><ChevronRight size={14} /></button>
            </div>
          </>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-[100] bg-[var(--color-void)] flex flex-col">
          <div className="h-12 shrink-0 border-b border-[var(--color-line)] flex items-center justify-between px-4 font-mono text-xs">
            <span className="truncate"><span className="text-[var(--color-accent)]">▶</span> {active[0]}</span>
            <div className="flex items-center gap-4">
              {/^https?:/i.test(active[2]) && <a href={active[2]} target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent)] flex items-center gap-1"><ExternalLink size={12} /> OPEN_TAB</a>}
              <button onClick={() => (document.getElementById('yz-play-frame') as HTMLIFrameElement | null)?.requestFullscreen?.()} className="hover:text-[var(--color-accent)] flex items-center gap-1"><Maximize2 size={12} /> FULLSCREEN</button>
              <button onClick={close} className="hover:text-red-500 flex items-center gap-1"><X size={14} /> CLOSE</button>
            </div>
          </div>
          <div className="flex-1 relative bg-black">
            {loading && <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-white gap-2"><Loader2 className="animate-spin" size={14} /> LOADING…</div>}
            {frame && (
              <iframe id="yz-play-frame" title={active[0]} className="w-full h-full border-0"
                allow="fullscreen; gamepad; autoplay; clipboard-write; accelerometer; gyroscope"
                {...(frame.srcDoc !== undefined ? { srcDoc: frame.srcDoc } : { src: frame.src })} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayView;
