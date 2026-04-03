import { useState, useEffect, useRef, useMemo } from "react";
import {
  Shield,
  Bug,
  Wrench,
  X,
  Search,
  Bot,
  BrainCircuit,
  Zap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  active: boolean;
}

const AGENTS: Agent[] = [
  { id: "security", name: "Security Agent", description: "Real-time threat detection", icon: Shield, color: "#f87171", active: true },
  { id: "bug-detector", name: "Bug Detector", description: "Identifies runtime & logical errors", icon: Bug, color: "#facc15", active: true },
  { id: "fix-engine", name: "Fix Engine", description: "Automated patches & corrections", icon: Wrench, color: "#4ade80", active: false },
];

interface Mode {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  glow: string;
  badge?: string;
}

const MODES: Mode[] = [
  {
    id: "claude",
    name: "Claude",
    description: "Deep reasoning, system-level thinking",
    icon: BrainCircuit,
    accent: "#a78bfa",
    glow: "167,139,250",
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "Fast coding and implementation",
    icon: Zap,
    accent: "#60a5fa",
    glow: "96,165,250",
  },
  {
    id: "lovable",
    name: "Lovable",
    description: "UI/UX, design and polish",
    icon: Sparkles,
    accent: "#f472b6",
    glow: "244,114,182",
    badge: "New",
  },
];

type Filter = "all" | "active" | "inactive";
type Tab = "agents" | "modes";

interface AgentsHubProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function AgentsHub({ open, onClose, anchorRef }: AgentsHubProps) {
  const [tab, setTab] = useState<Tab>("modes");
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [activeMode, setActiveMode] = useState<string>("claude");
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || (filter === "active" && a.active) || (filter === "inactive" && !a.active);
      return matchSearch && matchFilter;
    });
  }, [agents, search, filter]);

  const toggleAgent = (id: string) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  const selectMode = (id: string) => setActiveMode(id);

  if (!open && !visible) return null;

  return (
    <div
      ref={panelRef}
      className="flex flex-col"
      style={{
        width: "300px",
        maxHeight: "480px",
        background: "rgba(13,13,28,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,141,255,0.08)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(6px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.22s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
        {/* Top glow line */}
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-[14px] pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,141,255,0.5) 40%, rgba(167,139,250,0.5) 60%, transparent)" }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2 flex-shrink-0">
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            {tab === "modes" ? "Agent modes" : "Agents"}
          </span>
          <button
            onClick={onClose}
            data-testid="button-agents-hub-close"
            className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-white/8 transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 mx-3 mb-2 p-0.5 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["modes", "agents"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`tab-${t}`}
              className="flex-1 py-1.5 rounded-md text-[11px] font-medium capitalize transition-all duration-150"
              style={
                tab === t
                  ? { background: "rgba(124,141,255,0.18)", color: "#c4b5fd", border: "1px solid rgba(124,141,255,0.25)" }
                  : { color: "rgba(255,255,255,0.3)", border: "1px solid transparent" }
              }
            >
              {t === "modes" ? "Modes" : "Agents"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {tab === "modes" ? (
            <ModesTab modes={MODES} activeMode={activeMode} onSelect={selectMode} />
          ) : (
            <AgentsTab
              filtered={filtered}
              search={search}
              filter={filter}
              setSearch={setSearch}
              setFilter={setFilter}
              toggleAgent={toggleAgent}
            />
          )}
        </div>
    </div>
  );
}

function ModesTab({ modes, activeMode, onSelect }: { modes: Mode[]; activeMode: string; onSelect: (id: string) => void }) {
  return (
    <div className="px-2 pb-3 space-y-0.5">
      {modes.map((mode, i) => {
        const Icon = mode.icon;
        const isActive = mode.id === activeMode;
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            data-testid={`card-mode-${mode.id}`}
            className="w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 group"
            style={{
              background: isActive ? `rgba(${mode.glow},0.08)` : "transparent",
              borderBottom: i < modes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}
          >
            {/* Radio */}
            <div className="flex-shrink-0 mt-0.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  border: isActive ? `2px solid ${mode.accent}` : "2px solid rgba(255,255,255,0.2)",
                  boxShadow: isActive ? `0 0 8px rgba(${mode.glow},0.5)` : "none",
                }}
              >
                {isActive && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: mode.accent, boxShadow: `0 0 4px ${mode.accent}` }}
                  />
                )}
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[13px] font-medium leading-tight"
                  style={{ color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)" }}
                >
                  {mode.name}
                </span>
                {mode.badge && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    + {mode.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.35)" }}>
                {mode.description}
              </p>
            </div>

            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <Icon
                className="w-3.5 h-3.5 transition-all duration-200"
                style={{ color: isActive ? mode.accent : "rgba(255,255,255,0.2)" }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AgentsTab({
  filtered,
  search,
  filter,
  setSearch,
  setFilter,
  toggleAgent,
}: {
  filtered: Agent[];
  search: string;
  filter: Filter;
  setSearch: (v: string) => void;
  setFilter: (v: Filter) => void;
  toggleAgent: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Search className="w-3 h-3 text-white/25 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-agents-search"
            className="flex-1 bg-transparent text-[11px] text-white/70 placeholder:text-white/20 outline-none"
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 px-3 pb-2 flex-shrink-0">
        {(["all", "active", "inactive"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`button-filter-${f}`}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium capitalize transition-all duration-150"
            style={
              filter === f
                ? { background: "rgba(124,141,255,0.18)", color: "#a5b4fc", border: "1px solid rgba(124,141,255,0.3)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.05)" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Agent list */}
      <div className="px-2 pb-2 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-white/25">No agents found</p>
        ) : (
          filtered.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                data-testid={`card-agent-${agent.id}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/4"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: hexToRgba(agent.color, 0.12), border: `1px solid ${hexToRgba(agent.color, 0.22)}` }}
                >
                  <Icon className="w-3 h-3" style={{ color: agent.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-white/80 leading-tight truncate">{agent.name}</p>
                  <p className="text-[10px] text-white/30 truncate">{agent.description}</p>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => toggleAgent(agent.id)}
                  data-testid={`toggle-agent-${agent.id}`}
                  className="flex-shrink-0 w-8 h-4 rounded-full relative transition-all duration-250"
                  style={{
                    background: agent.active ? "linear-gradient(90deg,#7c8dff,#a78bfa)" : "rgba(255,255,255,0.1)",
                    boxShadow: agent.active ? "0 0 8px rgba(124,141,255,0.4)" : "none",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-250"
                    style={{ left: agent.active ? "calc(100% - 14px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface AgentsButtonProps {
  className?: string;
  size?: "sm" | "md";
}

export function AgentsButton({ className, size = "md" }: AgentsButtonProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-testid="button-agents-hub-open"
        className={cn(
          "flex items-center justify-center rounded-xl transition-all duration-200",
          size === "md" ? "w-8 h-8" : "w-6 h-6",
          className
        )}
        style={{
          background: open || hovered
            ? "linear-gradient(135deg, rgba(124,141,255,0.2), rgba(167,139,250,0.2))"
            : "rgba(255,255,255,0.06)",
          border: open || hovered
            ? "1px solid rgba(124,141,255,0.45)"
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: open || hovered ? "0 0 14px rgba(124,141,255,0.3)" : "none",
        }}
      >
        <Bot
          className={size === "md" ? "w-4 h-4" : "w-3.5 h-3.5"}
          style={{ color: open || hovered ? "#a5b4fc" : "rgba(255,255,255,0.5)" }}
        />
      </button>

      {/* Tooltip — only when closed and hovered */}
      {!open && (
        <div
          className="absolute bottom-full left-1/2 mb-2 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap pointer-events-none transition-all duration-150"
          style={{
            background: "rgba(10,10,28,0.95)",
            border: "1px solid rgba(124,141,255,0.25)",
            color: "#a5b4fc",
            opacity: hovered ? 1 : 0,
            transform: `translateX(-50%) translateY(${hovered ? "0px" : "4px"})`,
          }}
        >
          Open Agents Hub
        </div>
      )}

      {/* Panel — anchored above the button, right-aligned */}
      <div
        className="absolute z-50"
        style={{
          bottom: "calc(100% + 8px)",
          right: 0,
        }}
      >
        <AgentsHub open={open} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
