import { useState } from "react";
import { Camera, RotateCcw, Check, ChevronDown, FileCode, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckpointData {
  checkpointId: string;
  label: string;
  description: string;
  time: string;
  filesChanged: number;
}

interface CheckpointCardProps {
  data: CheckpointData;
  checkpointNumber: number;
  isLatest: boolean;
  allReverted?: boolean;
}

export function CheckpointCard({ data, checkpointNumber, isLatest, allReverted }: CheckpointCardProps) {
  const [state, setState] = useState<"idle" | "confirming" | "reverted">("idle");
  const [expanded, setExpanded] = useState(false);

  const handleRevertClick = () => {
    if (state === "confirming") {
      setState("reverted");
    } else {
      setState("confirming");
      setTimeout(() => setState((s) => (s === "confirming" ? "idle" : s)), 3500);
    }
  };

  const isReverted = state === "reverted" || allReverted;
  const isConfirming = state === "confirming";

  return (
    <div
      className="relative"
      style={{ animation: "checkpoint-in 0.22s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      <style>{`
        @keyframes checkpoint-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes revert-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
          50%       { box-shadow: 0 0 0 4px rgba(251,191,36,0.12); }
        }
        .checkpoint-revert-pulse { animation: revert-pulse 0.8s ease-in-out 2; }
      `}</style>

      {/* Timeline connector line */}
      <div
        className="absolute left-[11px] -top-3 w-px h-3"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />

      <div
        className={cn(
          "rounded-xl overflow-hidden transition-all duration-300",
          isReverted ? "opacity-50" : ""
        )}
        style={{
          background: isReverted
            ? "rgba(255,255,255,0.02)"
            : "rgba(251,191,36,0.04)",
          border: isReverted
            ? "1px solid rgba(255,255,255,0.06)"
            : isConfirming
              ? "1px solid rgba(251,191,36,0.45)"
              : "1px solid rgba(251,191,36,0.18)",
        }}
      >
        {/* Main row */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {/* Camera icon */}
          <div
            className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
            style={
              isReverted
                ? { background: "rgba(255,255,255,0.05)" }
                : { background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.25)" }
            }
          >
            {isReverted ? (
              <Check className="h-3.5 w-3.5" style={{ color: "rgba(148,163,184,0.5)" }} />
            ) : (
              <Camera className="h-3.5 w-3.5" style={{ color: "#fbbf24" }} />
            )}
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[11px] font-semibold"
                style={{ color: isReverted ? "rgba(148,163,184,0.5)" : "rgba(226,232,240,0.95)" }}
              >
                {isReverted ? "Reverted" : `Checkpoint ${checkpointNumber}`}
              </span>
              {isLatest && !isReverted && (
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(74,222,128,0.12)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    color: "#4ade80",
                  }}
                >
                  latest
                </span>
              )}
            </div>
            <p
              className="text-[10px] truncate mt-0.5"
              style={{ color: "rgba(148,163,184,0.65)" }}
            >
              {data.description}
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] transition-all hover:bg-white/5"
              style={{ color: "rgba(148,163,184,0.45)" }}
            >
              <ChevronDown
                className="h-3 w-3 transition-transform duration-150"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {/* Revert button */}
            {!isReverted && (
              <button
                onClick={handleRevertClick}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                  isConfirming ? "checkpoint-revert-pulse" : ""
                )}
                style={
                  isConfirming
                    ? {
                        background: "rgba(251,191,36,0.2)",
                        border: "1px solid rgba(251,191,36,0.5)",
                        color: "#fbbf24",
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(203,213,225,0.7)",
                      }
                }
                data-testid={`button-revert-checkpoint-${data.checkpointId}`}
              >
                <RotateCcw className="h-2.5 w-2.5" />
                {isConfirming ? "Confirm revert?" : "Revert"}
              </button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div
            className="px-3 pb-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", animation: "checkpoint-in 0.15s ease-out both" }}
          >
            <div className="pt-2.5 space-y-2">
              {/* Files changed */}
              <div className="flex items-center gap-2">
                <FileCode className="h-3 w-3 flex-shrink-0" style={{ color: "rgba(124,141,255,0.7)" }} />
                <span className="text-[10.5px]" style={{ color: "rgba(148,163,184,0.7)" }}>
                  <span style={{ color: "rgba(203,213,225,0.9)", fontWeight: 500 }}>{data.filesChanged} file{data.filesChanged !== 1 ? "s" : ""}</span>
                  {" "}changed
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 flex-shrink-0" style={{ color: "rgba(124,141,255,0.7)" }} />
                <span className="text-[10.5px]" style={{ color: "rgba(148,163,184,0.7)" }}>
                  Saved <span style={{ color: "rgba(203,213,225,0.9)", fontWeight: 500 }}>{data.time}</span>
                </span>
              </div>

              {/* Label */}
              <div
                className="mt-1 px-2.5 py-1.5 rounded-lg text-[10.5px]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(203,213,225,0.8)",
                }}
              >
                {data.label}
              </div>

              {/* Revert warning */}
              {!isReverted && (
                <p className="text-[9.5px] leading-relaxed" style={{ color: "rgba(148,163,184,0.4)" }}>
                  Reverting will restore your project to this exact state. Any changes made after this checkpoint will be lost.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
