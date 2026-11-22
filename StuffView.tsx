import React, { useMemo, useState } from 'react';
import { Boxes, Search, X, ExternalLink } from 'lucide-react';

interface AppDef { key: string; label: string; glyph: string; }

const base = (import.meta as any).env?.BASE_URL || '/';
const engine = (k: string) => `${base}stuff/engine.html#${k}`;

const A = (key: string, label: string, glyph: string): AppDef => ({ key, label, glyph });

// All apps from Yahiazakiz OS, grouped the way the original OS groups them.
const GROUPS: { title: string; apps: AppDef[] }[] = [
  { title: '~/fun', apps: [A('typing', 'Typing test', '⌨'), A('rand', 'Random', '⚄'), A('music', 'Music', '♫'), A('chat', 'Chat', '💬'), A('friends', 'Friends', '👥'), A('polls', 'Polls', '▦'), A('movies', 'Yahiazakiz Cinema', '🎬'), A('youtube', 'YouTube', '▶'), A('soccer', 'Soccer Sim', '⚽'), A('yzai', 'YahiaZakiZ AI', '🤖')] },
  { title: '~/productivity', apps: [A('todo', 'To-do', '☑'), A('notes', 'Notes', '☰'), A('plan', 'Planner', '▦'), A('timer', 'Focus timer', '◷'), A('stopwatch', 'Stopwatch', '⏱'), A('world', 'World clock', '◔'), A('sticky', 'Sticky notes', '▨'), A('count', 'Countdown', '⌛')] },
  { title: '~/study', apps: [A('cards', 'Flashcards', '▤'), A('gpa', 'GPA calc', '%'), A('words', 'Word counter', '¶'), A('cite', 'Citations', '“'), A('calc', 'Calculator', '+'), A('translate', 'Translate', '文'), A('dict', 'Dictionary', 'Aa'), A('conv', 'Converter', '⇄'), A('graph', 'Graphing calc', '∿'), A('ref', 'Reference', '⚛'), A('md', 'Markdown notes', '☷')] },
  { title: '~/create', apps: [A('html', 'HTML launcher', '‹/›'), A('dev', 'Dev utils', '{}'), A('draw', 'Drawing pad', '✎'), A('pixel', 'Pixel art', '▩'), A('morse', 'Morse code', '·–'), A('board', 'Whiteboard', '▭')] },
  { title: '~/os-hub', apps: [A('os_storm', 'StormOS', '☈')] },
  { title: '~/system', apps: [A('settings', 'Settings', '⚙'), A('keys', 'Shortcuts', '?')] },
];

const StuffView: React.FC = () => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<AppDef | null>(null);
  const total = GROUPS.reduce((n, g) => n + g.apps.length, 0);

  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    return GROUPS.map(g => ({ ...g, apps: g.apps.filter(a => !t || a.label.toLowerCase().includes(t) || a.key.includes(t)) })).filter(g => g.apps.length);
  }, [q]);

  return (
    <div className="flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[var(--color-line)] pb-6">
          <div>
            <div className="flex items-center gap-3 text-[var(--color-accent)] font-mono text-[10px] tracking-widest mb-2"><Boxes size={14} /> YAHIAZAKIZ_STUFF</div>
            <h2 className="text-4xl font-serif">Stuff</h2>
            <p className="font-mono text-xs text-[var(--color-text-muted)] mt-2">{total} apps from Yahiazakiz OS</p>
          </div>
          <div className="flex items-center gap-2 border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 min-w-[260px]">
            <Search size={14} className="text-[var(--color-text-muted)]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="SEARCH_APPS"
              className="bg-transparent outline-none font-mono text-xs w-full placeholder:text-[var(--color-text-muted)]" />
          </div>
        </div>

        {groups.map(g => (
          <section key={g.title}>
            <h3 className="font-mono text-[10px] tracking-widest text-[var(--color-text-muted)] mb-3">{g.title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {g.apps.map(a => (
                <button key={a.key} onClick={() => setOpen(a)}
                  className="group bg-[var(--color-card)] border border-[var(--color-line)] hover:border-[var(--color-accent)] transition-colors p-4 text-left flex items-center gap-4">
                  <span className="w-10 h-10 shrink-0 flex items-center justify-center border border-[var(--color-line)] group-hover:border-[var(--color-accent)] text-[var(--color-accent)] font-mono text-lg">{a.glyph}</span>
                  <span className="text-sm font-bold truncate">{a.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <div className="border border-dashed border-[var(--color-line)] p-10 text-center font-mono text-xs text-[var(--color-text-muted)]">NO_APPS_MATCH</div>}
        <div className="pb-10" />
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] bg-[var(--color-void)] flex flex-col">
          <div className="h-12 shrink-0 border-b border-[var(--color-line)] flex items-center justify-between px-4 font-mono text-xs">
            <span><span className="text-[var(--color-accent)]">{open.glyph}</span> {open.label}</span>
            <div className="flex items-center gap-4">
              <a href={engine(open.key)} target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent)] flex items-center gap-1"><ExternalLink size={12} /> OPEN_TAB</a>
              <button onClick={() => setOpen(null)} className="hover:text-red-500 flex items-center gap-1"><X size={14} /> CLOSE</button>
            </div>
          </div>
          <iframe key={open.key} title={open.label} src={engine(open.key)} className="flex-1 w-full border-0 bg-black"
            allow="fullscreen; clipboard-read; clipboard-write; microphone; camera; autoplay" />
        </div>
      )}
    </div>
  );
};

export default StuffView;
