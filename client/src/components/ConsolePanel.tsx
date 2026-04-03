import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, RotateCcw, Copy, Check, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

type LogLine = {
  id: string;
  type: "output" | "error" | "warn" | "success" | "command" | "system";
  text: string;
};

const WELCOME: LogLine[] = [
  { id: "w1", type: "system",  text: "Console ready. Type a command and press Enter." },
  { id: "w2", type: "system",  text: "────────────────────────────────────────────────" },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fakeRun(cmd: string, push: (l: LogLine) => void): "CLEAR" | undefined {
  const c = cmd.trim().toLowerCase();
  if (c === "clear") return "CLEAR";
  if (c === "help") {
    ["Available commands:", "  help    – show this message", "  clear   – clear console", "  date    – print current date", "  ls      – list project files", "  echo <text> – print text"].forEach((t) =>
      push({ id: uid(), type: "output", text: t })
    );
    return;
  }
  if (c === "date") {
    push({ id: uid(), type: "success", text: new Date().toString() });
    return;
  }
  if (c === "ls") {
    ["src/", "public/", "package.json", "tsconfig.json", "vite.config.ts", "tailwind.config.ts"].forEach((f) =>
      push({ id: uid(), type: "output", text: f })
    );
    return;
  }
  if (c.startsWith("echo ")) {
    push({ id: uid(), type: "output", text: cmd.slice(5) });
    return;
  }
  push({ id: uid(), type: "error", text: `command not found: ${cmd}` });
}

export function ConsolePanel() {
  const [lines, setLines] = useState<LogLine[]>(WELCOME);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const push = useCallback((l: LogLine) => {
    setLines((prev) => [...prev, l]);
  }, []);

  const runCommand = useCallback(() => {
    const cmd = input.trim();
    if (!cmd) return;

    push({ id: uid(), type: "command", text: cmd });
    setHistory((h) => [cmd, ...h].slice(0, 100));
    setHistIdx(-1);
    setInput("");

    const result = fakeRun(cmd, push);
    if (result === "CLEAR") setLines(WELCOME);
  }, [input, push]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : history[next] ?? "");
    } else if (e.key === "c" && e.ctrlKey) {
      push({ id: uid(), type: "system", text: "^C" });
      setInput("");
    }
  };

  const handleClear = () => setLines(WELCOME);

  const handleRestart = () => {
    setLines([
      ...WELCOME,
      { id: uid(), type: "system", text: "Process restarted." },
    ]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCopy = () => {
    const text = lines.map((l) => (l.type === "command" ? "$ " : "  ") + l.text).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lineStyle = (type: LogLine["type"]): React.CSSProperties => {
    switch (type) {
      case "error":   return { color: "#f87171" };
      case "warn":    return { color: "#fbbf24" };
      case "success": return { color: "#34d399" };
      case "command": return { color: "#7dd3fc", fontWeight: 600 };
      case "system":  return { color: "rgba(100,116,139,0.7)" };
      default:        return { color: "rgba(203,213,225,0.85)" };
    }
  };

  const linePrefix = (type: LogLine["type"]) => {
    switch (type) {
      case "command": return "$ ";
      case "error":   return "✗ ";
      case "success": return "✓ ";
      case "warn":    return "⚠ ";
      default:        return "  ";
    }
  };

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        background: "hsl(222,32%,5.5%)",
        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Menlo',monospace",
        animation: "console-fadein 0.2s ease",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <style>{`
        @keyframes console-fadein {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cursor-blink {
          0%,100% { opacity:1; } 50% { opacity:0; }
        }
        .console-cursor { animation: cursor-blink 1.1s step-start infinite; }
        .console-scrollbar::-webkit-scrollbar { width: 5px; }
        .console-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .console-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5" style={{ color: "rgba(148,163,184,0.55)" }} />
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: "rgba(226,232,240,0.7)" }}
          >
            Console
          </span>
          {/* live dot */}
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#4ade80", boxShadow: "0 0 5px rgba(74,222,128,0.7)" }}
          />
        </div>

        <div className="flex items-center gap-0.5">
          {[
            { icon: <Trash2  className="h-3.5 w-3.5" />, label: "Clear",   action: handleClear,   testId: "button-console-clear" },
            { icon: <RotateCcw className="h-3.5 w-3.5" />, label: "Restart", action: handleRestart, testId: "button-console-restart" },
          ].map(({ icon, label, action, testId }) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); action(); }}
              title={label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors duration-150"
              style={{ color: "rgba(148,163,184,0.55)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.color = "rgba(226,232,240,0.9)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.55)";
              }}
              data-testid={testId}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}

          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            title="Copy logs"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors duration-150"
            style={{ color: copied ? "#34d399" : "rgba(148,163,184,0.55)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            data-testid="button-console-copy"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* ── Output ── */}
      <div
        className="flex-1 overflow-y-auto px-5 py-3 min-h-0 console-scrollbar"
        style={{ lineHeight: "1.75" }}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className="text-[12px] whitespace-pre-wrap break-all select-text"
            style={lineStyle(line.type)}
          >
            <span style={{ opacity: 0.4, userSelect: "none", marginRight: 4 }}>
              {linePrefix(line.type)}
            </span>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div
        className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span
          className="text-[14px] select-none"
          style={{ color: "rgba(124,141,255,0.9)", fontWeight: 700 }}
        >
          ›
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command…"
          className="flex-1 bg-transparent outline-none text-[12px]"
          style={{
            color: "rgba(226,232,240,0.92)",
            caretColor: "rgba(124,141,255,1)",
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-testid="input-console"
        />
        <span
          className={cn("text-[13px] select-none console-cursor", !input && "opacity-0")}
          style={{ color: "rgba(124,141,255,0.8)" }}
        >
          ▋
        </span>
      </div>
    </div>
  );
}
