import { useState, useEffect, useRef } from "react";
import {
  Brain, FileText, FileCode, Trash2, Terminal, Package, Server,
  RefreshCw, Database, GitBranch, Globe, Camera, Monitor, Eye,
  ScrollText, Zap, Link, Lock, Sparkles, Bot, History,
  MessageSquarePlus, Plus, Paperclip, ImageIcon, Send, ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentMarkdown } from "@/components/AgentMarkdown";
import { CheckpointCard, type CheckpointData } from "@/components/CheckpointCard";
import { type AgentStreamItem } from "@/components/AgentActionFeed";
import { FileDiffCard, generateMockDiffs, type FileDiff } from "@/components/FileDiffCard";
import { AgentsButton } from "@/components/AgentsHub";

/* ─────────────────────────── Tool maps ─────────────────────────── */

export const TOOL_ICON_MAP: Record<string, React.ElementType> = {
  "analysis.think":     Brain,
  "file.read":          FileText,
  "file.write":         FileCode,
  "file.delete":        Trash2,
  "console.run":        Terminal,
  "package.install":    Package,
  "package.remove":     Package,
  "server.start":       Server,
  "server.restart":     RefreshCw,
  "db.push":            Database,
  "db.migrate":         Database,
  "git.clone":          GitBranch,
  "git.commit":         GitBranch,
  "deploy.publish":     Globe,
  "screenshot.capture": Camera,
  "ui.render":          Monitor,
  "preview.open":       Eye,
  "logs.stream":        ScrollText,
  "api.call":           Link,
  "auth.login":         Lock,
  "webhook.trigger":    Zap,
};

export const TOOL_COLOR_MAP: Record<string, string> = {
  "analysis.think":     "#a78bfa",
  "file.read":          "#7dd3fc",
  "file.write":         "#86efac",
  "file.delete":        "#f87171",
  "console.run":        "#fbbf24",
  "package.install":    "#fb923c",
  "package.remove":     "#fb923c",
  "server.start":       "#4ade80",
  "server.restart":     "#fb923c",
  "db.push":            "#34d399",
  "db.migrate":         "#34d399",
  "git.clone":          "#86efac",
  "git.commit":         "#86efac",
  "deploy.publish":     "#60a5fa",
  "screenshot.capture": "#f472b6",
  "ui.render":          "#c084fc",
  "preview.open":       "#f472b6",
  "logs.stream":        "#94a3b8",
  "api.call":           "#38bdf8",
  "auth.login":         "#facc15",
  "webhook.trigger":    "#818cf8",
};

export const TOOL_EMOJI_MAP: Record<string, string> = {
  "analysis.think":     "🧠",
  "file.read":          "📁",
  "file.write":         "📁",
  "file.delete":        "📁",
  "console.run":        "💻",
  "package.install":    "📦",
  "package.remove":     "📦",
  "server.start":       "🟢",
  "server.restart":     "🔄",
  "db.push":            "🗄️",
  "db.migrate":         "🗄️",
  "git.clone":          "🌿",
  "git.commit":         "🌿",
  "deploy.publish":     "🚀",
  "screenshot.capture": "📸",
  "ui.render":          "🖥️",
  "preview.open":       "👁️",
  "logs.stream":        "📜",
  "api.call":           "🔗",
  "auth.login":         "🔐",
  "webhook.trigger":    "📡",
};

/* ─────────────────────────── Animation map ─────────────────────── */

type AnimationStyle = "spin" | "pulse" | "bounce" | "flash" | "ping" | "shake";

export const TOOL_ANIMATION_MAP: Record<string, AnimationStyle> = {
  "analysis.think":     "pulse",
  "file.read":          "bounce",
  "file.write":         "bounce",
  "file.delete":        "shake",
  "console.run":        "flash",
  "package.install":    "spin",
  "package.remove":     "spin",
  "server.start":       "pulse",
  "server.restart":     "spin",
  "db.push":            "ping",
  "db.migrate":         "ping",
  "git.clone":          "spin",
  "git.commit":         "pulse",
  "deploy.publish":     "bounce",
  "screenshot.capture": "flash",
  "ui.render":          "pulse",
  "preview.open":       "flash",
  "logs.stream":        "pulse",
  "api.call":           "ping",
  "auth.login":         "pulse",
  "webhook.trigger":    "flash",
};

/* ─────────────────────────── ToolGroupLine ─────────────────────── */

const TOOL_GROUP_STYLES = `
  @keyframes tg-fade-in   { from{opacity:0;transform:translateY(-2px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tg-expand-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .tg-fade-in   { animation: tg-fade-in   0.14s ease-out both; }
  .tg-expand-in { animation: tg-expand-in 0.18s ease-out both; }
`;

function ToolGroupLine({ actions }: { actions: AgentStreamItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const isSingle = actions.length === 1;

  return (
    <div className="tg-fade-in flex flex-col gap-0" data-testid="tool-group-line">
      <style>{TOOL_GROUP_STYLES}</style>

      {/* ── Collapsed pill row — click to expand ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 w-full text-left group rounded-md px-1 py-0.5 -mx-1 transition-colors hover:bg-white/[0.03]"
        data-testid="button-tool-group-toggle"
      >
        {/* Colored tool icons */}
        {actions.slice(0, 5).map((action, idx) => {
          const tool  = action.tool ?? "analysis.think";
          const Icon  = TOOL_ICON_MAP[tool] ?? Brain;
          const color = TOOL_COLOR_MAP[tool] ?? "#a78bfa";
          return (
            <Icon
              key={idx}
              className="flex-shrink-0 transition-opacity group-hover:opacity-80"
              style={{ width: 13, height: 13, color, strokeWidth: 1.6 }}
              title={tool}
            />
          );
        })}

        <span style={{ color: "rgba(100,116,139,0.2)", fontSize: 10, userSelect: "none" }}>·</span>

        <span className="text-[11px] leading-none flex-1 truncate" style={{ color: "rgba(100,116,139,0.6)" }}>
          {isSingle ? actions[0].content : `${actions.length} actions`}
        </span>

        {/* Chevron — always visible on hover, rotates when expanded */}
        <ChevronDown
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{
            width: 11, height: 11,
            color: "rgba(100,116,139,0.5)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div
          className="tg-expand-in mt-1.5 rounded-xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          data-testid="tool-group-detail-panel"
        >
          {actions.map((action, idx) => {
            const tool    = action.tool ?? "analysis.think";
            const Icon    = TOOL_ICON_MAP[tool] ?? Brain;
            const color   = TOOL_COLOR_MAP[tool] ?? "#a78bfa";
            const isLast  = idx === actions.length - 1;

            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 px-3 py-2.5"
                style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.045)" }}
              >
                {/* Left: colored icon box */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${color}15`, border: `1px solid ${color}28` }}
                >
                  <Icon style={{ width: 12, height: 12, color, strokeWidth: 1.75 }} />
                </div>

                {/* Right: content */}
                <div className="flex-1 min-w-0">
                  {/* Row: chip + label + check */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: `${color}12`,
                        border: `1px solid ${color}25`,
                        color: `${color}bb`,
                      }}
                    >
                      {tool}
                    </span>
                    <span
                      className="text-[11px] font-medium truncate flex-1"
                      style={{ color: "rgba(203,213,225,0.8)" }}
                    >
                      {action.content}
                    </span>
                    <CheckCircle2
                      className="flex-shrink-0 ml-auto"
                      style={{ width: 12, height: 12, color: "rgba(74,222,128,0.75)" }}
                    />
                  </div>

                  {/* Terminal / log output */}
                  {action.meta?.logs && (
                    <div
                      className="mt-2 rounded-md px-2.5 py-2 text-[9.5px] font-mono leading-relaxed"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: `1px solid ${color}18`,
                        borderLeft: `2px solid ${color}50`,
                        color: "rgba(148,163,184,0.7)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {action.meta.logs}
                    </div>
                  )}

                  {/* File paths */}
                  {action.meta?.file && (
                    <div
                      className="mt-1.5 flex items-center gap-1 text-[9.5px] font-mono"
                      style={{ color: `${color}88` }}
                    >
                      <span>→</span>
                      <span className="truncate">{action.meta.file}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── LiveActionBar ─────────────────────── */

const LIVE_ACTION_CSS = `
  @keyframes la-spin    { to { transform: rotate(360deg); } }
  @keyframes la-pulse   { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: 0.55; } }
  @keyframes la-bounce  { 0%,100% { transform: translateY(0); } 45% { transform: translateY(-4px); } }
  @keyframes la-flash   { 0%,100% { opacity: 1; } 50% { opacity: 0.12; } }
  @keyframes la-shake   { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-14deg); } 75% { transform: rotate(14deg); } }
  @keyframes la-ping    { 0% { transform: scale(1); opacity: 0.9; } 80%,100% { transform: scale(2); opacity: 0; } }
  @keyframes la-dot-hop { 0%,100% { transform: translateY(0); opacity: 0.35; } 50% { transform: translateY(-3px); opacity: 1; } }
  @keyframes la-enter   { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .la-spin    { animation: la-spin    0.85s linear infinite; }
  .la-pulse   { animation: la-pulse   1.1s ease-in-out infinite; }
  .la-bounce  { animation: la-bounce  0.75s ease-in-out infinite; }
  .la-flash   { animation: la-flash   0.65s ease-in-out infinite; }
  .la-shake   { animation: la-shake   0.45s ease-in-out infinite; }
  .la-enter   { animation: la-enter   0.18s ease-out both; }
`;

function LiveActionBar({ action }: { action: AgentStreamItem }) {
  const tool  = action.tool ?? "analysis.think";
  const Icon  = TOOL_ICON_MAP[tool] ?? Brain;
  const color = TOOL_COLOR_MAP[tool] ?? "#a78bfa";
  const anim  = TOOL_ANIMATION_MAP[tool] ?? "pulse";

  return (
    <div className="la-enter flex items-center gap-2 pl-0.5 py-0.5" data-testid="live-action-bar">
      <style>{LIVE_ACTION_CSS}</style>

      {/* Icon wrapper — ping gets an absolute ring behind it */}
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 16, height: 16 }}>
        {anim === "ping" && (
          <span
            className="absolute rounded-full"
            style={{
              width: 14, height: 14,
              background: color, opacity: 0.25,
              animation: "la-ping 1.1s ease-out infinite",
            }}
          />
        )}
        <Icon
          className={`la-${anim} flex-shrink-0`}
          style={{ width: 13, height: 13, color, strokeWidth: 1.5 }}
          title={tool}
        />
      </div>

      {/* Action label */}
      <span className="text-[11px] leading-none" style={{ color: "rgba(148,163,184,0.72)" }}>
        {action.content}
      </span>

      {/* Trailing animated dots */}
      <span className="flex items-center gap-[3px] ml-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              width: 2.5, height: 2.5,
              background: color,
              animation: `la-dot-hop 1.15s ease-in-out infinite`,
              animationDelay: `${i * 140}ms`,
            }}
          />
        ))}
      </span>
    </div>
  );
}

/* ─────────────────────────── Types ─────────────────────────────── */

type ChatMessage =
  | { role: "user";        content: string;               time: string }
  | { role: "agent";       content: string;               time: string }
  | { role: "tool_group";  actions: AgentStreamItem[];    time: string }
  | { role: "diff";        diffs: FileDiff[];             time: string }
  | { role: "checkpoint";  checkpoint: CheckpointData;    time: string };

/* ─────────────────────────── Mock data ─────────────────────────── */

const MOCK_CHAT_HISTORY = [
  { id: 1, title: "Build a SaaS landing page with hero animation",   time: "2 hours ago", active: true },
  { id: 2, title: "Add authentication with Google OAuth",             time: "Yesterday" },
  { id: 3, title: "Fix the payment processing bug in Stripe",        time: "Yesterday" },
  { id: 4, title: "Create a REST API for user management",           time: "2 days ago" },
  { id: 5, title: "Add dark mode support to the dashboard",          time: "3 days ago" },
  { id: 6, title: "Connect PostgreSQL database to the backend",      time: "4 days ago" },
  { id: 7, title: "Design a responsive mobile navigation menu",      time: "5 days ago" },
  { id: 8, title: "Set up CI/CD pipeline with GitHub Actions",       time: "1 week ago" },
];

const THINKING_STEPS: AgentStreamItem[] = [
  { type: "action", tool: "analysis.think", content: "Analyzing request and planning steps",        status: "pending", group_id: "grp_1" },
  { type: "action", tool: "file.read",      content: "Reading codebase",                            status: "pending", group_id: "grp_1", meta: { file: "src/App.tsx · src/components/ · shared/schema.ts" } },
  { type: "action", tool: "file.write",     content: "Writing code",                                status: "pending", group_id: "grp_1", meta: { logs: "Created  src/components/Feature.tsx\nUpdated  src/App.tsx\nUpdated  src/index.css" } },
  { type: "action", tool: "console.run",    content: "Running build commands",                      status: "pending", group_id: "grp_1", meta: { logs: "$ npm install\n$ npm run build\n✓ Build succeeded" } },
  { type: "action", tool: "preview.open",   content: "Verifying preview",                           status: "pending", group_id: "grp_1", meta: { logs: "Checking app renders on port 5000…\n✓ Preview looks good" } },
  { type: "state",  content: "Server running on localhost:5000", icon: "🟢" },
  { type: "result", content: "All changes applied successfully.", status: "done" },
];

/* ─────────────────────────── Props ─────────────────────────────── */

interface ChatPanelProps {
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  currentAction?: AgentStreamItem | null;
}

/* ─────────────────────────── Component ─────────────────────────── */

export function ChatPanel({ inputRef, currentAction }: ChatPanelProps) {
  const [messages, setMessages]             = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]           = useState("");
  const [showChatAddPopup, setShowChatAddPopup] = useState(false);
  const [showNewChatScreen, setShowNewChatScreen] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel]   = useState(false);
  const [isAgentTyping, setIsAgentTyping]   = useState(false);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [activeAction, setActiveAction]     = useState<AgentStreamItem | null>(null);

  const checkpointCountRef  = useRef(0);
  const internalInputRef    = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef      = useRef<HTMLDivElement>(null);
  const chatAddPopupRef     = useRef<HTMLDivElement>(null);
  const chatFileInputRef    = useRef<HTMLInputElement>(null);
  const chatPhotoInputRef   = useRef<HTMLInputElement>(null);
  const thinkingTimersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  const chatInputRef = (inputRef as React.RefObject<HTMLTextAreaElement>) ?? internalInputRef;

  /* ── sync external action stream (WebSocket / props) ── */
  useEffect(() => {
    if (currentAction === undefined) return;
    setActiveAction(currentAction);
    if (currentAction) {
      setIsAgentThinking(true);
    } else {
      setIsAgentThinking(false);
    }
  }, [currentAction]);

  /* ── scroll ── */
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages, isAgentThinking]);

  /* ── close add popup on outside click ── */
  useEffect(() => {
    if (!showChatAddPopup) return;
    const handler = (e: MouseEvent) => {
      if (chatAddPopupRef.current && !chatAddPopupRef.current.contains(e.target as Node))
        setShowChatAddPopup(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showChatAddPopup]);

  /* ── initial URL prompt ── */
  useEffect(() => {
    const prompt = new URLSearchParams(window.location.search).get("prompt") || "";
    if (prompt && messages.length === 0) {
      setMessages([{ role: "user", content: prompt, time: "just now" }]);
    }
  }, []);

  /* ── stop agent ── */
  const stopAgent = () => {
    thinkingTimersRef.current.forEach(clearTimeout);
    thinkingTimersRef.current = [];
    setIsAgentThinking(false);
    setIsAgentTyping(false);
    setActiveAction(null);
  };

  /* ── send message ── */
  const handleSend = () => {
    if (!chatInput.trim() || isAgentThinking || isAgentTyping) return;
    const msg = chatInput.trim();
    setChatInput("");
    setShowNewChatScreen(false);
    setMessages((prev) => [...prev, { role: "user", content: msg, time: "just now" }]);

    setIsAgentThinking(true);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const push = (delay: number, fn: () => void) => { const t = setTimeout(fn, delay); timers.push(t); };

    push(0, () => setActiveAction({
      type: "action", tool: "analysis.think",
      content: "Analyzing request and planning steps", status: "running",
    }));

    push(400, () => {
      setActiveAction({
        type: "action", tool: "file.read",
        content: "Reading codebase", status: "running",
        meta: { file: "src/App.tsx · src/components/ · shared/schema.ts" },
      });
      setMessages((prev) => [...prev, {
        role: "tool_group", time: "just now",
        actions: [
          { type: "action", tool: "analysis.think", content: "Analyzing request and planning steps", status: "done" },
          { type: "action", tool: "file.read",      content: "Reading codebase",                    status: "done", meta: { file: "src/App.tsx · src/components/ · shared/schema.ts" } },
        ],
      }]);
    });

    push(1000, () => {
      setActiveAction(null);
      setIsAgentTyping(true);
    });
    push(1800, () => {
      setIsAgentTyping(false);
      setMessages((prev) => [...prev, {
        role: "agent",
        content: `I'll start by exploring the project structure to understand what needs to change. Let me read the relevant files first.`,
        time: "just now",
      }]);
    });

    push(2000, () => setActiveAction({
      type: "action", tool: "file.write",
      content: "Writing code changes", status: "running",
      meta: { logs: "Created  src/components/Feature.tsx\nUpdated  src/App.tsx\nUpdated  src/index.css" },
    }));

    push(2200, () => {
      setActiveAction({
        type: "action", tool: "console.run",
        content: "Running build commands", status: "running",
        meta: { logs: "$ npm install\n$ npm run build\n✓ Build succeeded" },
      });
      setMessages((prev) => [...prev, {
        role: "tool_group", time: "just now",
        actions: [
          { type: "action", tool: "file.write",   content: "Writing code changes",   status: "done", meta: { logs: "Created  src/components/Feature.tsx\nUpdated  src/App.tsx\nUpdated  src/index.css" } },
          { type: "action", tool: "console.run",  content: "Running build commands", status: "done", meta: { logs: "$ npm install\n$ npm run build\n✓ Build succeeded" } },
          { type: "action", tool: "server.start", content: "Starting dev server",    status: "done" },
        ],
      }]);
    });

    push(2600, () => setActiveAction({
      type: "action", tool: "server.start",
      content: "Starting dev server", status: "running",
    }));

    push(2900, () => {
      setActiveAction({
        type: "action", tool: "preview.open",
        content: "Verifying preview on port 5000", status: "running",
      });
      setMessages((prev) => [...prev, {
        role: "tool_group", time: "just now",
        actions: [
          { type: "action", tool: "preview.open", content: "Verifying preview on port 5000", status: "done" },
        ],
      }]);
    });

    push(3400, () => {
      setActiveAction(null);
      setIsAgentTyping(true);
    });
    push(4200, () => {
      setIsAgentTyping(false);
      setIsAgentThinking(false);
      checkpointCountRef.current += 1;
      const now     = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const diffs   = generateMockDiffs(msg);
      const filesChanged = diffs.reduce((sum, d) => sum + d.additions + d.deletions, 0);
      setMessages((prev) => [...prev,
        {
          role: "agent",
          content: `Got it! I've implemented **"${msg}"**.\n\nHere's what I did:\n- Scaffolded the project structure\n- Created the core components\n- Wired up the logic\n\nCheck the **Preview** tab to see the result. Let me know if you'd like any changes!`,
          time: "just now",
        },
        {
          role: "checkpoint",
          time: timeStr,
          checkpoint: {
            checkpointId: `cp-${Date.now()}`,
            label: msg.length > 60 ? msg.slice(0, 60) + "…" : msg,
            description: `After: ${msg.length > 40 ? msg.slice(0, 40) + "…" : msg}`,
            time: timeStr,
            filesChanged,
          },
        },
      ]);
    });

    thinkingTimersRef.current = timers;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ─────────────────────────── Render ────────────────────────── */

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.015)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c8dff 0%, #a78bfa 100%)",
              boxShadow: "0 0 8px rgba(124,141,255,0.45)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">Agent</span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.6)" }}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowHistoryPanel((v) => !v); setShowNewChatScreen(false); }}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded-lg transition-all",
              showHistoryPanel
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
            data-testid="button-chat-history"
            title="Chat history"
          >
            <History className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setShowNewChatScreen(true); setShowHistoryPanel(false); setMessages([]); }}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            data-testid="button-new-chat"
            title="New chat with Agent"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── History panel ── */}
      {showHistoryPanel && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Chat History</p>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {MOCK_CHAT_HISTORY.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setShowHistoryPanel(false)}
                data-testid={`button-history-chat-${chat.id}`}
                className="w-full flex flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-white/4 transition-colors group relative"
                style={chat.active ? { background: "rgba(124,141,255,0.07)" } : {}}
                onMouseEnter={(e) => { if (!chat.active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { if (!chat.active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {chat.active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: "linear-gradient(135deg, #7c8dff 0%, #a78bfa 100%)" }}
                  />
                )}
                <p
                  className="text-[12px] leading-snug line-clamp-2 pr-2"
                  style={{ color: chat.active ? "rgba(226,232,240,0.95)" : "rgba(226,232,240,0.7)" }}
                >
                  {chat.title}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(100,116,139,0.55)" }}>{chat.time}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className={cn("flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0", showHistoryPanel && "hidden")}>

        {/* New chat screen */}
        {showNewChatScreen && (
          <div className="flex flex-col items-center justify-center flex-1 h-full gap-5 text-center px-2 py-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(124,141,255,0.08)", border: "1px solid rgba(124,141,255,0.18)" }}
            >
              <MessageSquarePlus className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1.5">New chat with Agent</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed px-2">
                Agent can make changes, review its work, and debug itself automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Check my app for bugs",
                "Add payment processing",
                "Connect with an AI Assistant",
                "Add SMS message sending",
                "Add a database",
                "Add authenticated user login",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setChatInput(prompt); setShowNewChatScreen(false); setTimeout(() => chatInputRef.current?.focus(), 50); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] text-white/75 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                  data-testid={`button-new-chat-prompt-${prompt.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {!showNewChatScreen && messages.map((msg, i) => {
          if (msg.role === "checkpoint") {
            const cpNumber = messages.slice(0, i + 1).filter((m) => m.role === "checkpoint").length;
            const isLatest = messages.slice(i + 1).every((m) => m.role !== "checkpoint");
            return <CheckpointCard key={i} data={msg.checkpoint} checkpointNumber={cpNumber} isLatest={isLatest} />;
          }
          if (msg.role === "diff") {
            return (
              <div key={i} className="flex flex-col gap-2" data-testid={`diff-group-${i}`}>
                {msg.diffs.map((diff, j) => <FileDiffCard key={j} diff={diff} />)}
              </div>
            );
          }
          if (msg.role === "tool_group") {
            return <ToolGroupLine key={i} actions={msg.actions} />;
          }
          return (
            <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div
                className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                style={msg.role === "agent"
                  ? { background: "linear-gradient(135deg, #7c8dff 0%, #a78bfa 100%)" }
                  : { background: "rgba(255,255,255,0.1)" }
                }
              >
                {msg.role === "agent" ? <Bot className="h-3 w-3 text-white" /> : <span className="text-foreground">U</span>}
              </div>
              {msg.role === "agent" ? (
                <div className="flex-1 min-w-0 py-0.5" data-testid={`message-agent-${i}`}>
                  <AgentMarkdown content={msg.content} />
                </div>
              ) : (
                <div
                  className="max-w-[82%] px-3 py-2 rounded-2xl text-[11.5px] leading-relaxed"
                  style={{
                    background: "rgba(124,141,255,0.18)",
                    border: "1px solid rgba(124,141,255,0.28)",
                    color: "rgba(226,232,240,1)",
                  }}
                  data-testid={`message-user-${i}`}
                >
                  {msg.content}
                </div>
              )}
            </div>
          );
        })}

        {/* Live action bar — shown while an action is in progress */}
        {activeAction && !isAgentTyping && (
          <LiveActionBar action={activeAction} />
        )}

        {/* Typing indicator */}
        {isAgentTyping && (
          <div className="flex gap-2 items-end" data-testid="agent-typing-indicator">
            <style>{`
              @keyframes typing-bounce {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                30%           { transform: translateY(-5px); opacity: 1; }
              }
              .typing-dot-1 { animation: typing-bounce 1.1s ease-in-out infinite; animation-delay: 0ms; }
              .typing-dot-2 { animation: typing-bounce 1.1s ease-in-out infinite; animation-delay: 160ms; }
              .typing-dot-3 { animation: typing-bounce 1.1s ease-in-out infinite; animation-delay: 320ms; }
              @keyframes typing-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
              .typing-wrapper { animation: typing-fade-in 0.18s ease-out both; }
            `}</style>
            <div
              className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mb-0.5"
              style={{ background: "linear-gradient(135deg, #7c8dff 0%, #a78bfa 100%)" }}
            >
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div
              className="typing-wrapper flex items-center gap-1.5 px-3.5 py-3 rounded-2xl rounded-bl-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <span className="typing-dot-1 w-1.5 h-1.5 rounded-full block" style={{ background: "rgba(167,139,250,0.85)" }} />
              <span className="typing-dot-2 w-1.5 h-1.5 rounded-full block" style={{ background: "rgba(167,139,250,0.85)" }} />
              <span className="typing-dot-3 w-1.5 h-1.5 rounded-full block" style={{ background: "rgba(167,139,250,0.85)" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div
        className={cn("p-3 border-t flex-shrink-0", showHistoryPanel && "hidden")}
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="rounded-xl transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: (isAgentThinking || isAgentTyping)
              ? "1px solid rgba(124,141,255,0.4)"
              : "1px solid rgba(255,255,255,0.09)",
            boxShadow: (isAgentThinking || isAgentTyping)
              ? "0 0 0 3px rgba(124,141,255,0.08), 0 4px 20px rgba(0,0,0,0.2)"
              : "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAgentThinking ? "Agent is working…" :
              isAgentTyping   ? "Agent is responding…" :
              "Make, test, iterate..."
            }
            disabled={isAgentThinking || isAgentTyping}
            rows={1}
            className="w-full bg-transparent px-3 pt-3 text-xs text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: 42, maxHeight: 120 }}
            data-testid="input-chat"
          />
          <div className="flex items-center justify-between px-2 pb-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <input ref={chatFileInputRef}  type="file"           className="hidden" data-testid="input-chat-upload-file"  onChange={() => setShowChatAddPopup(false)} />
              <input ref={chatPhotoInputRef} type="file" accept="image/*" className="hidden" data-testid="input-chat-upload-photo" onChange={() => setShowChatAddPopup(false)} />
              <div ref={chatAddPopupRef} className="relative">
                <button
                  onClick={() => setShowChatAddPopup((v) => !v)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/6 transition-colors"
                  data-testid="button-chat-add"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                {showChatAddPopup && (
                  <div
                    className="absolute bottom-full left-0 mb-2 z-50 overflow-hidden"
                    style={{
                      width: 175,
                      background: "rgba(13,13,28,0.98)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      boxShadow: "0 -4px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <button
                      onClick={() => chatFileInputRef.current?.click()}
                      data-testid="button-chat-popup-upload-file"
                      className="flex items-center gap-3 w-full px-4 py-3 text-left text-xs text-white/75 hover:bg-white/6 hover:text-white transition-colors"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-[#7c8dff] flex-shrink-0" />
                      <span>Upload File</span>
                    </button>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px" }} />
                    <button
                      onClick={() => chatPhotoInputRef.current?.click()}
                      data-testid="button-chat-popup-upload-photo"
                      className="flex items-center gap-3 w-full px-4 py-3 text-left text-xs text-white/75 hover:bg-white/6 hover:text-white transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-[#a78bfa] flex-shrink-0" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {!isAgentThinking && !isAgentTyping && <AgentsButton size="sm" />}
              {(isAgentThinking || isAgentTyping) ? (
                <button
                  onClick={stopAgent}
                  className="flex items-center gap-1 px-2 h-6 rounded-lg text-[10px] font-semibold text-white transition-all hover:opacity-80 active:scale-95"
                  style={{ background: "rgba(239,68,68,0.85)", boxShadow: "0 0 10px rgba(239,68,68,0.4)" }}
                  data-testid="button-stop-agent-input"
                >
                  <div className="w-2 h-2 rounded-sm bg-white flex-shrink-0" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim()}
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200",
                    chatInput.trim()
                      ? "text-white hover:opacity-90"
                      : "bg-white/5 text-muted-foreground/50 cursor-not-allowed"
                  )}
                  style={chatInput.trim() ? {
                    background: "linear-gradient(135deg, #7c8dff 0%, #a78bfa 100%)",
                    boxShadow: "0 0 12px rgba(124,141,255,0.4)",
                  } : {}}
                  data-testid="button-chat-send"
                >
                  <Send className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
