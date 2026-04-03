import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { usePreviewRuntime } from "../hooks/usePreviewRuntime";
import { ArrowLeft, MoreVertical, Monitor, Terminal, LayoutGrid, Play, RefreshCw, ExternalLink, ChevronLeft, ChevronRight, Lock, Database, UserCheck, Plus, Search, X, Link as LinkIcon, Wrench, Copy, Check, AlertTriangle, ChevronDown, Smartphone, Tablet, Code, Settings, HelpCircle, Keyboard, Globe, Server, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useAppState } from "@/context/app-state-context";
import { GridPreviewPage } from "@/components/grid-preview-page";
import { GridAgentPage } from "@/components/grid-agent-page";
import { GridConsolePage } from "@/components/grid-console-page";
import { GridPublishingPage } from "@/components/grid-publishing-page";
import { FilesModal } from "@/components/files-modal";
import { URLSharingModal } from "@/components/url-sharing-modal";

const RELOAD_DEBOUNCE_MS = 2500;

type DeviceKey =
  | "fullsize"
  | "16:9"
  | "iphone-se"
  | "iphone-air"
  | "iphone-17"
  | "iphone-17-pro"
  | "iphone-17-pro-max"
  | "pixel-10"
  | "pixel-10-pro"
  | "pixel-10-pro-xl"
  | "galaxy-s25"
  | "galaxy-s25-plus"
  | "galaxy-s25-ultra";

interface DeviceConfig {
  label: string;
  width: string | null;
  height: string | null;
  frame: "none" | "phone" | "tablet";
  dims?: string;
}

const DEVICE_CONFIGS: Record<DeviceKey, DeviceConfig> = {
  "fullsize":          { label: "Full size",                width: null,     height: null,    frame: "none" },
  "16:9":              { label: "Tablet (16:9)",            width: "1280px", height: "720px", frame: "tablet", dims: "1280 × 720" },
  "iphone-se":         { label: "iPhone SE",                width: "375px",  height: "667px", frame: "phone", dims: "375 × 667" },
  "iphone-air":        { label: "iPhone Air",               width: "390px",  height: "844px", frame: "phone", dims: "390 × 844" },
  "iphone-17":         { label: "iPhone 17",                width: "393px",  height: "852px", frame: "phone", dims: "393 × 852" },
  "iphone-17-pro":     { label: "iPhone 17 Pro",            width: "393px",  height: "852px", frame: "phone", dims: "393 × 852" },
  "iphone-17-pro-max": { label: "iPhone 17 Pro Max",        width: "430px",  height: "932px", frame: "phone", dims: "430 × 932" },
  "pixel-10":          { label: "Pixel 10",                 width: "412px",  height: "892px", frame: "phone", dims: "412 × 892" },
  "pixel-10-pro":      { label: "Pixel 10 Pro",             width: "412px",  height: "900px", frame: "phone", dims: "412 × 900" },
  "pixel-10-pro-xl":   { label: "Pixel 10 Pro XL",          width: "428px",  height: "950px", frame: "phone", dims: "428 × 950" },
  "galaxy-s25":        { label: "Galaxy S25 Ultra",          width: "412px",  height: "883px", frame: "phone", dims: "412 × 883" },
  "galaxy-s25-plus":   { label: "Samsung Galaxy S25+",      width: "384px",  height: "824px", frame: "phone", dims: "384 × 824" },
  "galaxy-s25-ultra":  { label: "Samsung Galaxy S25 Ultra", width: "412px",  height: "883px", frame: "phone", dims: "412 × 883" },
};

const DEVICE_GROUPS: { groupLabel: string; keys: DeviceKey[] }[] = [
  { groupLabel: "General", keys: ["fullsize", "16:9"] },
  { groupLabel: "Apple",   keys: ["iphone-se", "iphone-air"] },
  { groupLabel: "Samsung", keys: ["galaxy-s25"] },
];

function TabletFrame({ children }: { children: React.ReactNode }) {
  const outerR = 16;
  const innerR = 10;
  const bezel  = 14;

  const shadow = [
    "0 36px 90px rgba(0,0,0,0.82)",
    "0 18px 44px rgba(0,0,0,0.62)",
    "0 7px 22px rgba(0,0,0,0.50)",
    "0 2px 8px rgba(0,0,0,0.40)",
    "0 0 0 1px rgba(0,0,0,1)",
    "0 0 0 1.5px rgba(255,255,255,0.07)",
    "inset 0 1.5px 0 rgba(255,255,255,0.28)",
    "inset -1.5px 0 0 rgba(255,255,255,0.18)",
    "inset 0 -1.5px 0 rgba(0,0,0,0.98)",
    "inset 1.5px 0 0 rgba(0,0,0,0.92)",
    "inset 0 3px 14px rgba(0,0,0,0.45)",
    "inset 0 -3px 12px rgba(0,0,0,0.58)",
    "inset 4px 0 12px rgba(0,0,0,0.42)",
    "inset -2px 0 8px rgba(0,0,0,0.20)",
  ].join(", ");

  return (
    <div style={{ position:"relative", width:"100%", height:"100%", boxSizing:"border-box" }}>
      <style>{`@keyframes tablet-frame-in{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Right-side power button */}
      <div style={{ position:"absolute", right:-2, top:"28%", width:2, height:36, borderRadius:"0 2px 2px 0", background:"linear-gradient(90deg, #080808, #1c1c1c)", zIndex:2, boxShadow:"1px 0 4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.85)" }} />
      {/* Right-side volume up */}
      <div style={{ position:"absolute", right:-2, top:"40%", width:2, height:26, borderRadius:"0 2px 2px 0", background:"linear-gradient(90deg, #080808, #1c1c1c)", zIndex:2, boxShadow:"1px 0 4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.85)" }} />
      {/* Right-side volume down */}
      <div style={{ position:"absolute", right:-2, top:"49%", width:2, height:26, borderRadius:"0 2px 2px 0", background:"linear-gradient(90deg, #080808, #1c1c1c)", zIndex:2, boxShadow:"1px 0 4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.85)" }} />

      {/* Tablet body */}
      <div style={{
        position:"absolute", inset:0,
        borderRadius: outerR,
        background:"linear-gradient(170deg, #252525 0%, #1e1e1e 12%, #171717 28%, #111111 50%, #0d0d0d 72%, #0a0a0a 88%, #080808 100%)",
        border:"none",
        boxSizing:"border-box",
        overflow:"hidden",
        display:"flex",
        flexDirection:"column",
        boxShadow: shadow,
        animation:"tablet-frame-in 0.25s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* Top bezel */}
        <div style={{ height:bezel, flexShrink:0, background:"linear-gradient(180deg, #212121 0%, #181818 55%, #101010 100%)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
          {/* Camera punch-hole — centered, sharp */}
          <div style={{
            width:6, height:6, borderRadius:"50%",
            background:"radial-gradient(circle at 35% 35%, #0a0a12, #000000)",
            border:"0.5px solid rgba(255,255,255,0.07)",
            boxShadow:"0 0 0 0.5px rgba(0,0,0,1), inset 0 1px 3px rgba(0,0,0,0.95)",
          }}>
            <div style={{ position:"absolute", top:1, left:1, width:2, height:2, borderRadius:"50%", background:"rgba(255,255,255,0.12)" }} />
          </div>
        </div>

        {/* Middle row */}
        <div style={{ flex:1, display:"flex", minHeight:0 }}>
          {/* Left bezel — slightly darker (shadow side) */}
          <div style={{ width:bezel, flexShrink:0, background:"linear-gradient(90deg, #080808 0%, #0f0f0f 100%)" }} />

          {/* Screen area */}
          <div style={{
            flex:1, minWidth:0, borderRadius:innerR, overflow:"hidden", position:"relative", backgroundColor:"#ebebeb",
            boxShadow:[
              "inset 0 0 0 1px rgba(0,0,0,0.88)",
              "inset 0 3px 10px rgba(0,0,0,0.55)",
              "inset 4px 0 10px rgba(0,0,0,0.38)",
              "inset -2px 0 7px rgba(0,0,0,0.18)",
              "inset 0 -2px 7px rgba(0,0,0,0.38)",
              "inset 0 0 0 2px rgba(255,255,255,0.02)",
            ].join(", "),
          }}>
            {children}
            {/* Glass reflection — soft diagonal from top-left */}
            <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(138deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.030) 18%, rgba(255,255,255,0.010) 36%, transparent 55%)", pointerEvents:"none", zIndex:5, borderRadius:innerR }} />
          </div>

          {/* Right bezel — slightly lighter (light side) */}
          <div style={{ width:bezel, flexShrink:0, background:"linear-gradient(90deg, #141414 0%, #1e1e1e 100%)" }} />
        </div>

        {/* Bottom bezel */}
        <div style={{ height:bezel, flexShrink:0, background:"linear-gradient(0deg, #060606 0%, #0c0c0c 45%, #111111 100%)" }} />
      </div>

      {/* ── Edge highlight overlays (outside overflow:hidden) ── */}
      {/* Top edge — bright catch light */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, borderRadius:`${outerR}px ${outerR}px 0 0`, background:"linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.20) 18%, rgba(255,255,255,0.34) 42%, rgba(255,255,255,0.38) 58%, rgba(255,255,255,0.22) 80%, rgba(255,255,255,0.05) 100%)", pointerEvents:"none", zIndex:32 }} />
      {/* Top soft bloom */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, borderRadius:`${outerR}px ${outerR}px 0 0`, background:"linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)", pointerEvents:"none", zIndex:31 }} />
      {/* Right edge — lighter side */}
      <div style={{ position:"absolute", top:0, right:0, bottom:0, width:1, borderRadius:`0 ${outerR}px ${outerR}px 0`, background:"linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.18) 35%, rgba(255,255,255,0.08) 70%, rgba(255,255,255,0.02) 100%)", pointerEvents:"none", zIndex:32 }} />
      {/* Right bloom inward */}
      <div style={{ position:"absolute", top:0, right:0, bottom:0, width:5, borderRadius:`0 ${outerR}px ${outerR}px 0`, background:"linear-gradient(270deg, rgba(255,255,255,0.04) 0%, transparent 100%)", pointerEvents:"none", zIndex:31 }} />
      {/* Bottom edge — deep shadow */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, borderRadius:`0 0 ${outerR}px ${outerR}px`, background:"linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 100%)", pointerEvents:"none", zIndex:32 }} />
      {/* Bottom inner falloff */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:8, borderRadius:`0 0 ${outerR}px ${outerR}px`, background:"linear-gradient(0deg, rgba(0,0,0,0.45) 0%, transparent 100%)", pointerEvents:"none", zIndex:31 }} />
      {/* Left edge — darkest shadow */}
      <div style={{ position:"absolute", top:0, left:0, bottom:0, width:1, borderRadius:`${outerR}px 0 0 ${outerR}px`, background:"linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.90) 55%, rgba(0,0,0,1) 100%)", pointerEvents:"none", zIndex:32 }} />
      {/* Left concave depth */}
      <div style={{ position:"absolute", top:0, left:0, bottom:0, width:5, borderRadius:`${outerR}px 0 0 ${outerR}px`, background:"linear-gradient(90deg, rgba(0,0,0,0.25) 0%, transparent 100%)", pointerEvents:"none", zIndex:31 }} />
      {/* Diagonal metallic sheen across whole frame */}
      <div style={{ position:"absolute", inset:0, borderRadius:outerR, background:"linear-gradient(130deg, rgba(255,255,255,0.038) 0%, rgba(255,255,255,0.015) 22%, transparent 46%, rgba(0,0,0,0.14) 100%)", pointerEvents:"none", zIndex:26 }} />
      {/* Inner screen separation ring */}
      <div style={{ position:"absolute", top:bezel, left:bezel, right:bezel, bottom:bezel, borderRadius:innerR+1, boxShadow:"0 0 0 1px rgba(0,0,0,0.95), 0 0 0 2px rgba(255,255,255,0.028)", pointerEvents:"none", zIndex:28 }} />
    </div>
  );
}

function DeviceFrame({ deviceKey, children }: { deviceKey: DeviceKey; children: React.ReactNode }) {
  const isIphoneSE   = deviceKey === "iphone-se";
  const isIphoneAir  = deviceKey === "iphone-air";
  const hasDI        = ["iphone-air","iphone-17","iphone-17-pro","iphone-17-pro-max"].includes(deviceKey);
  const isIphone     = deviceKey.startsWith("iphone");
  const isPixel      = deviceKey.startsWith("pixel");
  const isSamsung    = deviceKey.startsWith("galaxy");
  const isPro        = deviceKey === "iphone-17-pro" || deviceKey === "iphone-17-pro-max";
  const hasPunchHole = isPixel || isSamsung;

  /* Corner radii */
  const outerR = isIphoneSE ? 36 : isIphoneAir ? 28 : isIphone ? 52 : isSamsung ? 10 : isPixel ? 38 : 42;
  const innerR = isIphoneSE ? 4  : isIphoneAir ? 20 : isIphone ? 42 : isSamsung ? 4  : isPixel ? 28 : 32;

  /* Explicit bezel thicknesses */
  const bezelSide   = isIphoneSE ? 8 : isIphoneAir ? 8 : isSamsung ? 7 : 13;
  const bezelTop    = isIphoneSE ? 37 : isIphoneAir ? 8 : hasDI ? 38 : isSamsung ? 7 : hasPunchHole ? 32 : 14;
  const bezelBottom = isIphoneSE ? 37 : isIphoneAir ? 8 : isIphone ? 28 : isSamsung ? 7 : hasPunchHole ? 22 : 14;

  /* Frame body color */
  const frameColor = isIphoneSE ? "#0f0f0f" : isIphoneAir ? "#0a0a0a" : isPro ? "#535358" : isIphone ? "#2a2a2c" : isSamsung ? "#0d0d18" : "#3e3e3e";

  /* Outer border — sharp metallic rim */
  const borderCol = isIphoneSE ? "rgba(255,255,255,0.22)" : isIphoneAir ? "rgba(255,255,255,0.20)" : isPro ? "rgba(205,215,225,0.45)" : isSamsung ? "rgba(255,255,255,0.0)" : "rgba(255,255,255,0.22)";

  /* Drop shadow */
  const shadow = isIphoneSE
    ? [
        "0 0 0 1px rgba(0,0,0,0.95)",
        "0 18px 48px rgba(0,0,0,0.55)",
        "0 6px 18px rgba(0,0,0,0.35)",
        "0 0 0 1.5px rgba(255,255,255,0.13)",
        "inset 0 1px 0 rgba(255,255,255,0.14)",
        "inset 0 -1px 0 rgba(0,0,0,0.4)",
        "inset 1px 0 0 rgba(255,255,255,0.06)",
        "inset -1px 0 0 rgba(0,0,0,0.25)",
      ].join(", ")
    : isIphoneAir
    ? [
        "0 0 0 1px rgba(0,0,0,0.95)",
        "inset 0 1px 0 rgba(255,255,255,0.08)",
        "inset 0 -1px 0 rgba(0,0,0,0.5)",
      ].join(", ")
    : isSamsung
  ? [
        /* floating device — deep layered shadow */
        "0 60px 120px rgba(0,0,0,0.97)",
        "0 28px 56px rgba(0,0,0,0.84)",
        "0 10px 24px rgba(0,0,0,0.70)",
        "0 3px 8px rgba(0,0,0,0.58)",
        /* crisp outer separation ring */
        "0 0 0 1px rgba(0,0,0,1)",
        "0 0 0 2px rgba(255,255,255,0.07)",
        /* asymmetric inset edge highlights — light from top-right */
        "inset 0 1.5px 0 rgba(255,255,255,0.52)",   /* top: strong titanium catch */
        "inset -1.5px 0 0 rgba(255,255,255,0.34)",  /* right: lighter, catches light */
        "inset 0 -1.5px 0 rgba(0,0,0,1)",           /* bottom: deep shadow */
        "inset 1.5px 0 0 rgba(0,0,0,1)",            /* left: darkest shadow side */
        /* frame body depth — top shaded, bottom heavier */
        "inset 0 3px 14px rgba(0,0,0,0.58)",
        "inset 0 -4px 12px rgba(0,0,0,0.70)",
        /* side depth — left darker, right lighter (asymmetric) */
        "inset 4px 0 12px rgba(0,0,0,0.50)",
        "inset -2px 0 8px rgba(0,0,0,0.22)",
      ].join(", ")
  : [
        "0 0 0 1px rgba(0,0,0,0.85)",
        "0 20px 55px rgba(0,0,0,0.55)",
        "0 4px 14px rgba(0,0,0,0.4)",
        isPro ? "0 0 22px rgba(180,185,200,0.1)" : "",
      ].filter(Boolean).join(", ");

  /* Side button colour */
  const btnColor = isIphoneSE ? "#272727" : isIphoneAir ? "#1c1c1e" : isPro ? "#7e7e82" : "#555558";
  const btnBorder = isIphoneSE ? "1px solid rgba(255,255,255,0.16)" : isIphoneAir ? "1px solid rgba(255,255,255,0.14)" : "none";

  return (
    <div style={{ position:"relative", width:"100%", height:"100%", boxSizing:"border-box" }}>
      <style>{`
        @keyframes device-frame-in{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* ── Side buttons — sit OUTSIDE the phone body ── */}
      {isIphoneSE && (<>
        {/* Volume Up */}
        <div style={{ position:"absolute", left:-6, top:"20%", width:6, height:46, borderRadius:"3px 0 0 3px", background:`linear-gradient(90deg,#080808,${btnColor})`, zIndex:2, boxShadow:"-2px 0 6px rgba(0,0,0,0.8)", border:btnBorder, borderRight:"none" }} />
        {/* Volume Down */}
        <div style={{ position:"absolute", left:-6, top:"32%", width:6, height:46, borderRadius:"3px 0 0 3px", background:`linear-gradient(90deg,#080808,${btnColor})`, zIndex:2, boxShadow:"-2px 0 6px rgba(0,0,0,0.8)", border:btnBorder, borderRight:"none" }} />
        {/* Power/Sleep */}
        <div style={{ position:"absolute", right:-6, top:"25%", width:6, height:64, borderRadius:"0 3px 3px 0", background:`linear-gradient(270deg,#080808,${btnColor})`, zIndex:2, boxShadow:"2px 0 6px rgba(0,0,0,0.8)", border:btnBorder, borderLeft:"none" }} />
      </>)}
      {!isIphoneSE && isIphone && (<>
        {hasDI && <div style={{ position:"absolute", left: isIphoneAir?-2:-4, top:"17%", width: isIphoneAir?2:4, height:26, borderRadius:"1.5px 0 0 1.5px", background: isIphoneAir?"#111":(`linear-gradient(90deg,#1a1a1e,${btnColor})`), zIndex:2, boxShadow: isIphoneAir?"none":"-1px 0 4px rgba(0,0,0,0.5)", border: isIphoneAir?"0.5px solid rgba(255,255,255,0.10)":"none", borderRight:"none" }} />}
        <div style={{ position:"absolute", left: isIphoneAir?-2:-4, top: hasDI?"26%":"22%", width: isIphoneAir?2:4, height:52, borderRadius:"1.5px 0 0 1.5px", background: isIphoneAir?"#111":(`linear-gradient(90deg,#1a1a1e,${btnColor})`), zIndex:2, boxShadow: isIphoneAir?"none":"-1px 0 4px rgba(0,0,0,0.5)", border: isIphoneAir?"0.5px solid rgba(255,255,255,0.10)":"none", borderRight:"none" }} />
        <div style={{ position:"absolute", left: isIphoneAir?-2:-4, top: hasDI?"37%":"34%", width: isIphoneAir?2:4, height:52, borderRadius:"1.5px 0 0 1.5px", background: isIphoneAir?"#111":(`linear-gradient(90deg,#1a1a1e,${btnColor})`), zIndex:2, boxShadow: isIphoneAir?"none":"-1px 0 4px rgba(0,0,0,0.5)", border: isIphoneAir?"0.5px solid rgba(255,255,255,0.10)":"none", borderRight:"none" }} />
        <div style={{ position:"absolute", right: isIphoneAir?-2:-4, top:"28%", width: isIphoneAir?2:4, height:68, borderRadius:"0 1.5px 1.5px 0", background: isIphoneAir?"#111":(`linear-gradient(270deg,#1a1a1e,${btnColor})`), zIndex:2, boxShadow: isIphoneAir?"none":"1px 0 4px rgba(0,0,0,0.5)", border: isIphoneAir?"0.5px solid rgba(255,255,255,0.10)":"none", borderLeft:"none" }} />
      </>)}
      {isSamsung && (<>
        {/* Power button — right side, very subtle */}
        <div style={{ position:"absolute", right:-2, top:"24%", width:2, height:60, borderRadius:"0 1.5px 1.5px 0", background:"linear-gradient(90deg,#0a0a0e,#181820)", zIndex:2, boxShadow:"0.5px 0 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.8)" }} />
        {/* Volume Up — left side, very subtle */}
        <div style={{ position:"absolute", left:-2, top:"26%", width:2, height:46, borderRadius:"1.5px 0 0 1.5px", background:"linear-gradient(270deg,#0a0a0e,#181820)", zIndex:2, boxShadow:"-0.5px 0 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.8)" }} />
        {/* Volume Down — left side, very subtle */}
        <div style={{ position:"absolute", left:-2, top:"38%", width:2, height:46, borderRadius:"1.5px 0 0 1.5px", background:"linear-gradient(270deg,#0a0a0e,#181820)", zIndex:2, boxShadow:"-0.5px 0 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.8)" }} />
      </>)}

      {/* ── Phone body ── */}
      <div style={{
        position:"absolute", inset:0,
        borderRadius: outerR,
        background: isIphoneSE
          ? "linear-gradient(175deg, #181818 0%, #111111 28%, #0d0d0d 58%, #080808 100%)"
          : isIphoneAir
          ? "#0a0a0a"
          : isSamsung
          ? "linear-gradient(100deg, #060610 0%, #08080e 8%, #0a0a14 20%, #0c0c18 36%, #0e0e1c 50%, #111124 64%, #151528 78%, #1a1a2e 90%, #202036 100%)"
          : frameColor,
        backgroundColor: (isIphoneSE || isIphoneAir || isSamsung) ? undefined : frameColor,
        border: isIphoneAir ? `1px solid ${borderCol}` : isSamsung ? "none" : `1.5px solid ${borderCol}`,
        boxSizing:"border-box",
        overflow:"hidden",
        display:"flex",
        flexDirection:"column",
        boxShadow: shadow,
        animation:"device-frame-in 0.25s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* ── iPhone Air: Dynamic Island floats absolutely at screen top (real-iPhone behaviour) ── */}
        {isIphoneAir && hasDI && (
          <div style={{
            position:"absolute", top:11, left:"50%", transform:"translateX(-50%)",
            zIndex:10, width:"30%", height:12,
            background:"linear-gradient(180deg, #0d0d0d 0%, #000000 45%, #000000 100%)",
            borderRadius:999,
            border:"1px solid rgba(0,0,0,0.98)",
            boxShadow:[
              "0 1px 4px rgba(0,0,0,0.85)",
              "0 0 0 0.75px rgba(255,255,255,0.07)",
              "inset 0 1px 0 rgba(255,255,255,0.11)",
              "inset 0 -1px 3px rgba(0,0,0,1)",
            ].join(", "),
            overflow:"hidden",
            pointerEvents:"none",
          }}>
            {/* convex top-edge catch-light — like real glass hardware */}
            <div style={{ position:"absolute", top:0, left:"8%", right:"8%", height:2, background:"linear-gradient(180deg,rgba(255,255,255,0.08) 0%,transparent 100%)", borderRadius:"999px 999px 0 0", pointerEvents:"none" }} />
            {/* front camera lens — right side, matches Apple reference */}
            <div style={{ position:"absolute", right:"13%", top:"50%", transform:"translateY(-50%)", width:5, height:5, borderRadius:"50%", background:"radial-gradient(circle at 38% 38%,#1c2030,#040406)", border:"0.5px solid rgba(255,255,255,0.09)", boxShadow:"inset 0 0.5px 1px rgba(255,255,255,0.07)", pointerEvents:"none" }} />
            {/* lens specular glint */}
            <div style={{ position:"absolute", right:"calc(13% + 1px)", top:"calc(50% - 2px)", width:1.5, height:1.5, borderRadius:"50%", background:"rgba(255,255,255,0.22)", pointerEvents:"none" }} />
          </div>
        )}

        {/* ── Top bezel ── */}
        <div style={{ height:bezelTop, flexShrink:0, background: isSamsung ? "linear-gradient(180deg, #0e0e1e 0%, #0b0b18 55%, #07070e 100%)" : undefined, backgroundColor: isSamsung ? undefined : frameColor, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
          {hasDI && !isIphoneAir && (
            <div style={{ width:90, height:24, background:"#000", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", boxShadow:"0 1px 8px rgba(0,0,0,0.9)" }} />
          )}
          {isIphoneSE && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              {/* Front camera */}
              <div style={{ width:8, height:8, borderRadius:"50%", background:"radial-gradient(circle at 35% 35%,#1a2030,#0a0a10)", border:"1px solid rgba(255,255,255,0.08)", boxShadow:"0 0 0 1.5px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.05)" }} />
              {/* Speaker slot */}
              <div style={{ width:52, height:6, background:"rgba(0,0,0,0.7)", borderRadius:3, boxShadow:"inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.04)" }} />
            </div>
          )}
        </div>

        {/* ── Middle row: left bezel | screen | right bezel ── */}
        <div style={{ flex:1, display:"flex", minHeight:0, paddingTop: isIphoneSE ? 2 : 0 }}>
          <div style={{ width:bezelSide, flexShrink:0, background: isSamsung ? "linear-gradient(90deg, #040408 0%, #07070e 60%, #09091a 100%)" : undefined, backgroundColor: isSamsung ? undefined : frameColor }} />

          {/* Screen area */}
          <div style={{
            flex:1, minWidth:0, borderRadius:innerR, overflow:"hidden", position:"relative", backgroundColor:"#000",
            boxShadow: isIphoneSE
              ? [
                  "inset 0 0 0 1px rgba(0,0,0,0.6)",
                  "inset 0 2px 10px rgba(0,0,0,0.45)",
                  "inset 2px 0 8px rgba(0,0,0,0.25)",
                  "inset -2px 0 8px rgba(0,0,0,0.25)",
                  "inset 0 -2px 8px rgba(0,0,0,0.25)",
                ].join(", ")
              : isIphoneAir
              ? "inset 0 0 0 1px rgba(0,0,0,0.5)"
              : isSamsung
              ? [
                  "inset 0 0 0 1px rgba(0,0,0,0.98)",         /* tight dark seal ring */
                  "inset 0 4px 10px rgba(0,0,0,0.70)",        /* top shadow — glass recessed */
                  "inset 4px 0 10px rgba(0,0,0,0.52)",        /* left — deeper shadow */
                  "inset -2px 0 8px rgba(0,0,0,0.28)",        /* right — lighter */
                  "inset 0 -3px 8px rgba(0,0,0,0.50)",        /* bottom inner shadow */
                  "inset 0 0 0 2px rgba(255,255,255,0.025)",  /* faint inner glass rim */
                ].join(", ")
              : undefined,
          }}>
            {children}
            {/* Samsung S25 Ultra — punch-hole camera floats over screen (real hardware architecture) */}
            {isSamsung && (
              <div style={{
                position:"absolute", top:7, left:"50%", transform:"translateX(-50%)",
                zIndex:10, width:9, height:9, borderRadius:"50%",
                background:"radial-gradient(circle at 32% 32%, #0e0e18, #020204)",
                border:"0.5px solid rgba(255,255,255,0.08)",
                boxShadow:[
                  "0 0 0 0.5px rgba(0,0,0,1)",
                  "inset 0 1px 4px rgba(0,0,0,1)",
                  "inset 0 0 4px rgba(0,0,0,0.98)",
                ].join(", "),
                pointerEvents:"none",
              }}>
                <div style={{ position:"absolute", top:2, left:2, width:2, height:2, borderRadius:"50%", background:"rgba(255,255,255,0.20)" }} />
              </div>
            )}
            {/* Glass reflection overlay — iPhone SE */}
            {isIphoneSE && (
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:"38%",
                background:"linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0) 100%)",
                pointerEvents:"none", zIndex:5,
                borderRadius:`${innerR}px ${innerR}px 0 0`,
              }} />
            )}
            {/* Glass reflection overlay — iPhone Air (removed to avoid faded top effect) */}
            {/* Samsung S25 Ultra — diagonal glass reflection (2-streak Samsung product render) */}
            {isSamsung && (<>
              {/* Primary broad diagonal sweep — top-left to center */}
              <div style={{
                position:"absolute", top:0, left:0, right:0, bottom:0,
                background:"linear-gradient(148deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.055) 14%, rgba(255,255,255,0.025) 36%, transparent 55%)",
                pointerEvents:"none", zIndex:5,
                borderRadius:innerR,
              }} />
              {/* Secondary thin parallel streak — offset rightward */}
              <div style={{
                position:"absolute", top:0, left:"12%", right:0, bottom:0,
                background:"linear-gradient(148deg, transparent 8%, rgba(255,255,255,0.04) 12%, rgba(255,255,255,0.02) 22%, transparent 34%)",
                pointerEvents:"none", zIndex:5,
                borderRadius:innerR,
              }} />
            </>)}
            {/* Home indicator for non-SE iPhones */}
            {!isIphoneSE && (isIphone || hasPunchHole) && (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height: isIphone ? 22 : 18, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:10, background: isIphoneAir ? "transparent" : isSamsung ? "transparent" : "rgba(0,0,0,0.5)" }}>
                <div style={{ width: isIphone ? 118 : isSamsung ? 100 : 88, height: isSamsung ? 3 : 4, borderRadius:2, background: isIphone ? "rgba(220,220,220,0.38)" : isSamsung ? "rgba(255,255,255,0.18)" : "rgba(200,200,200,0.22)" }} />
              </div>
            )}
          </div>

          <div style={{ width:bezelSide, flexShrink:0, background: isSamsung ? "linear-gradient(90deg, #101020 0%, #141428 60%, #1a1a32 100%)" : undefined, backgroundColor: isSamsung ? undefined : frameColor }} />
        </div>

        {/* ── Bottom bezel ── */}
        <div style={{ height:bezelBottom, flexShrink:0, background: isSamsung ? "linear-gradient(0deg, #050508 0%, #08080e 40%, #0b0b16 100%)" : undefined, backgroundColor: isSamsung ? undefined : frameColor, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {isIphoneSE && (
            /* Realistic home button: outer groove → metallic ring → button face */
            <div style={{
              width:29, height:29, borderRadius:"50%",
              background:"linear-gradient(160deg,#1a1a1c 0%,#141416 100%)",
              border:"1.5px solid rgba(255,255,255,0.18)",
              boxShadow:"0 1px 5px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 3px rgba(0,0,0,0.6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              transform:"translateY(-4px)",
            }}>
              {/* Metallic ring */}
              <div style={{
                width:24, height:24, borderRadius:"50%",
                background:"linear-gradient(145deg,#313133,#222224)",
                border:"1px solid rgba(255,255,255,0.11)",
                boxShadow:"inset 0 1px 2px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {/* Button face */}
                <div style={{
                  width:17, height:17, borderRadius:"50%",
                  background:"linear-gradient(145deg,#2c2c2e,#1c1c1e)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  boxShadow:"inset 0 1px 3px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(255,255,255,0.04)",
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Samsung S25 Ultra: metallic edge highlight overlays (outside overflow:hidden) ── */}
      {isSamsung && (<>
        {/* Top edge — sharp bright titanium catch, peak slightly right of center (directional light) */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:1,
          borderRadius:`${outerR}px ${outerR}px 0 0`,
          background:"linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.30) 15%, rgba(255,255,255,0.62) 38%, rgba(255,255,255,0.70) 55%, rgba(255,255,255,0.48) 75%, rgba(255,255,255,0.10) 100%)",
          pointerEvents:"none", zIndex:32,
        }} />
        {/* Top edge — secondary wider soft bloom above the rim */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:3,
          borderRadius:`${outerR}px ${outerR}px 0 0`,
          background:"linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)",
          pointerEvents:"none", zIndex:31,
        }} />
        {/* Right edge — light side, fades toward bottom */}
        <div style={{
          position:"absolute", top:0, right:0, bottom:0, width:1,
          borderRadius:`0 ${outerR}px ${outerR}px 0`,
          background:"linear-gradient(180deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.28) 25%, rgba(255,255,255,0.14) 60%, rgba(255,255,255,0.04) 100%)",
          pointerEvents:"none", zIndex:32,
        }} />
        {/* Right edge — soft bloom inward */}
        <div style={{
          position:"absolute", top:0, right:0, bottom:0, width:4,
          borderRadius:`0 ${outerR}px ${outerR}px 0`,
          background:"linear-gradient(270deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
          pointerEvents:"none", zIndex:31,
        }} />
        {/* Bottom edge — deep shadow, curvature illusion */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:2,
          borderRadius:`0 0 ${outerR}px ${outerR}px`,
          background:"linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.70) 100%)",
          pointerEvents:"none", zIndex:32,
        }} />
        {/* Bottom inner shadow — soft curvature falloff */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:8,
          borderRadius:`0 0 ${outerR}px ${outerR}px`,
          background:"linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)",
          pointerEvents:"none", zIndex:31,
        }} />
        {/* Left edge — shadow side, very dark */}
        <div style={{
          position:"absolute", top:0, left:0, bottom:0, width:1,
          borderRadius:`${outerR}px 0 0 ${outerR}px`,
          background:"linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.92) 50%, rgba(0,0,0,1) 100%)",
          pointerEvents:"none", zIndex:32,
        }} />
        {/* Left edge — deep concave shadow inward */}
        <div style={{
          position:"absolute", top:0, left:0, bottom:0, width:5,
          borderRadius:`${outerR}px 0 0 ${outerR}px`,
          background:"linear-gradient(90deg, rgba(0,0,0,0.30) 0%, transparent 100%)",
          pointerEvents:"none", zIndex:31,
        }} />
        {/* Top depth line — subtle shadow just below top edge separates frame from glass */}
        <div style={{
          position:"absolute", top: bezelTop, left: bezelSide, right: bezelSide, height:3,
          background:"linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)",
          pointerEvents:"none", zIndex:29,
        }} />
        {/* Diagonal metallic sheen across frame face */}
        <div style={{
          position:"absolute", inset:0,
          borderRadius: outerR,
          background:"linear-gradient(130deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.020) 20%, transparent 42%, transparent 68%, rgba(0,0,0,0.18) 100%)",
          pointerEvents:"none", zIndex:26,
        }} />
        {/* Inner screen separation — dark seal ring + faint glass rim highlight */}
        <div style={{
          position:"absolute",
          top: bezelTop,
          left: bezelSide,
          right: bezelSide,
          bottom: bezelBottom,
          borderRadius: innerR + 1,
          boxShadow:"0 0 0 1px rgba(0,0,0,0.98), 0 0 0 2px rgba(255,255,255,0.035)",
          pointerEvents:"none", zIndex:28,
        }} />
      </>)}
    </div>
  );
}

function usePreviewGuard() {
  const lastReload = useRef(0);

  const safeReload = (reload: () => void) => {
    const now = Date.now();
    if (now - lastReload.current > RELOAD_DEBOUNCE_MS) {
      lastReload.current = now;
      reload();
    }
  };

  return { safeReload };
}

type DeviceType = "desktop" | "iphone" | "ipad" | "android";
type DevToolsTab = "console" | "elements" | "network";

interface ElementInfo {
  tag: string;
  id: string;
  classes: string[];
  rect: { width: number; height: number; top: number; left: number };
  styles: Record<string, string>;
  attributes: Record<string, string>;
}

export default function Preview() {
  const [, setLocation] = useLocation();
  const [gridMode, setGridMode] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const { executionState, executionClient, setExecutionState } = useAppState();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const touchStartX = useRef(0);
  const [currentUrl, setCurrentUrl] = useState("localhost:5000");
  const [publicUrl, setPublicUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [urlInput, setUrlInput] = useState("http://localhost:5000");
  const [errorExpanded, setErrorExpanded] = useState(false);
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [devToolsTab, setDevToolsTab] = useState<DevToolsTab>("console");
  const [autoReloadEnabled, setAutoReloadEnabled] = useState(true);
  const [crashReason, setCrashReason] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [lastReloadType, setLastReloadType] = useState<"hot" | "hard" | null>(null);
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);
  const lastPerfIndexRef = useRef<number>(0);
  const [devToolsMinimized, setDevToolsMinimized] = useState(false);
  const [devToolsHeight, setDevToolsHeight] = useState(280);
  const [networkMode, setNetworkMode] = useState<"normal" | "slow" | "offline">("normal");
  const [followSharedPreview, setFollowSharedPreview] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{type: string; message: string; time: string}>>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const dragTypeRef = useRef<"right" | "bottom" | "corner" | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartWRef = useRef(0);
  const dragStartHRef = useRef(0);
  const [domElements, setDomElements] = useState<string>("");
  const [networkRequests, setNetworkRequests] = useState<Array<{method: string; url: string; status: string; type: string; time: string}>>([]);
  const navigationHistoryRef = useRef<string[]>(["localhost:5000"]);
  const navigationIndexRef = useRef(0);
  const [inspectMode, setInspectMode] = useState(false);
  const [selectedElementInfo, setSelectedElementInfo] = useState<ElementInfo | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceKey>("iphone-se");
  const devicePopupRef = useRef<HTMLDivElement>(null);
  const [showDevicePopup, setShowDevicePopup] = useState(false);
  const [showDevUrlPopup, setShowDevUrlPopup] = useState(false);
  const [privateDevUrl, setPrivateDevUrl] = useState(false);
  const [copiedDevLink, setCopiedDevLink] = useState(false);
  const devUrlPopupRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then(reg => {
        if (reg.active) {
          reg.active.postMessage({ type: "SET_NET_MODE", mode: networkMode });
        }
      })
      .catch(() => {});
  }, [networkMode]);


  const publishPreviewState = async (partial?: Partial<{ url: string; deviceType: string; devToolsTab: string; gridMode: boolean; }>) => {
    try {
      const body = {
        url: partial?.url ?? currentUrl,
        deviceType: partial?.deviceType ?? deviceType,
        devToolsTab: partial?.devToolsTab ?? devToolsTab,
        gridMode: partial?.gridMode ?? gridMode,
      };
      await fetch("/api/preview-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {}
  };

  useEffect(() => {
    if (!followSharedPreview) return;
    const es = new EventSource("/sse/preview");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.url) {
          setCurrentUrl(data.url);
          setUrlInput(/^https?:\/\//.test(data.url) ? data.url : `http://${data.url}`);
        }
        if (data.deviceType) {
          setDeviceType(data.deviceType as any);
        }
        if (data.devToolsTab) {
          setDevToolsTab(data.devToolsTab as any);
        }
        if (typeof data.gridMode === "boolean") {
          setGridMode(data.gridMode);
        }
      } catch {}
    };
    es.onerror = () => {
      try { es.close(); } catch {}
    };
    return () => {
      try { es.close(); } catch {}
    };
  }, [followSharedPreview]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const win = iframeRef.current?.contentWindow as any;
        if (!win || !win.performance) return;
        const entries = win.performance.getEntriesByType("resource") || [];
        const start = lastPerfIndexRef.current;
        const fresh = entries.slice(start);
        if (fresh.length > 0) {
          lastPerfIndexRef.current = entries.length;
          const mapped = fresh.map((e: any) => ({
            name: e.name,
            initiatorType: e.initiatorType,
            duration: Math.round(e.duration),
            transferSize: e.transferSize || 0,
          }));
          setNetworkLogs((prev) => [...mapped, ...prev].slice(0, 200));
        }
      } catch {}
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/project-status");
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.running)) {
          setIsExecuting(data.running.length > 0);
        }
      } catch (e) {
        console.error("Status sync failed", e);
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    // Use Replit dev domain if available, otherwise use current host
    const replitDevDomain = import.meta.env.VITE_REPLIT_DEV_DOMAIN;
    const domain = replitDevDomain || window.location.host || "localhost:5000";
    setPublicUrl(domain);
  }, []);


  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/preview-sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const fetchTunnelInfo = async () => {
      try {
        const res = await fetch("/api/tunnel-info");
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.ok && data.url) {
          // Prefer full URL for iframe, but keep hostname:port style for display/navigation history
          try {
            const urlObj = new URL(data.url);
            const hostPortPath = `${urlObj.hostname}${urlObj.port ? ":" + urlObj.port : ""}${urlObj.pathname}`;
            setPublicUrl(hostPortPath);
          } catch {
            // Fallback: assume already host:port
            setPublicUrl(data.url);
          }
        }
      } catch (e) {
        console.error("Failed to load tunnel info", e);
      }
    };
    fetchTunnelInfo();
  }, []);


  useEffect(() => {
    if (!autoReloadEnabled) return;

    if (executionState.status === "completed" || executionState.status === "error") {
        setCrashReason("Last crash at " + new Date().toLocaleTimeString());
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      setLastReloadType("hot");
      }
    }
  }, [executionState.status, autoReloadEnabled]);

  // --- Inspect Element: listen for postMessage from injected iframe script ---
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "inspect-element-select") {
        const d = e.data.payload as ElementInfo;
        setSelectedElementInfo(d);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // --- Inspect Element: inject/remove highlight script into iframe ---
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const SCRIPT_ID = "__replit_inspect__";

    const inject = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        if (doc.getElementById(SCRIPT_ID)) return;

        const script = doc.createElement("script");
        script.id = SCRIPT_ID;
        script.textContent = `
(function() {
  var _hovered = null;
  var _prevOutline = null;
  var _prevOutlineOffset = null;

  function getStyles(el) {
    var cs = window.getComputedStyle(el);
    var keys = ["display","position","width","height","padding","margin","border","background","color","font-size","font-family","flex","grid","overflow","z-index","opacity","border-radius","box-shadow","line-height"];
    var result = {};
    keys.forEach(function(k){ result[k] = cs.getPropertyValue(k); });
    return result;
  }

  function getAttrs(el) {
    var out = {};
    for(var i = 0; i < el.attributes.length; i++){
      out[el.attributes[i].name] = el.attributes[i].value;
    }
    return out;
  }

  function onMouseOver(e) {
    if(_hovered && _hovered !== e.target) {
      _hovered.style.outline = _prevOutline;
      _hovered.style.outlineOffset = _prevOutlineOffset;
    }
    _hovered = e.target;
    _prevOutline = _hovered.style.outline;
    _prevOutlineOffset = _hovered.style.outlineOffset;
    _hovered.style.outline = '2px solid #6c8ef5';
    _hovered.style.outlineOffset = '1px';
    e.stopPropagation();
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    var el = e.target;
    var rect = el.getBoundingClientRect();
    var data = {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      classes: Array.from(el.classList),
      rect: { width: Math.round(rect.width), height: Math.round(rect.height), top: Math.round(rect.top), left: Math.round(rect.left) },
      styles: getStyles(el),
      attributes: getAttrs(el)
    };
    window.parent.postMessage({ type: 'inspect-element-select', payload: data }, '*');
  }

  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('click', onClick, true);

  window.__removeInspect__ = function() {
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('click', onClick, true);
    if(_hovered) { _hovered.style.outline = _prevOutline; _hovered.style.outlineOffset = _prevOutlineOffset; }
  };
})();
        `;
        doc.head.appendChild(script);
      } catch (_) {}
    };

    const remove = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const s = doc.getElementById(SCRIPT_ID);
        if (s) s.remove();
        const w = iframe.contentWindow as any;
        if (w?.__removeInspect__) w.__removeInspect__();
      } catch (_) {}
    };

    if (inspectMode) {
      inject();
    } else {
      remove();
      setSelectedElementInfo(null);
    }
  }, [inspectMode]);

  const handleSelectDevice = (key: DeviceKey) => {
    setSelectedDevice(key);
    setShowDevicePopup(false);
    const cfg = DEVICE_CONFIGS[key];
    if (key === "fullsize") {
      setDeviceType("desktop");
      setCustomWidth(null);
      setCustomHeight(null);
      setIsExecuting(true);
    } else if (cfg.frame === "tablet") {
      setDeviceType("desktop");
      setCustomWidth(null);
      setCustomHeight(null);
      setIsExecuting(true);
    } else if (cfg.frame === "phone") {
      setDeviceType("iphone");
      setCustomWidth(null);
      setCustomHeight(null);
    } else {
      setDeviceType("desktop");
      setCustomWidth(cfg.width ? parseInt(cfg.width) : null);
      setCustomHeight(cfg.height ? parseInt(cfg.height) : null);
    }
  };

  useEffect(() => {
    if (!showDevicePopup) return;
    const handler = (e: MouseEvent) => {
      if (devicePopupRef.current && !devicePopupRef.current.contains(e.target as Node)) {
        setShowDevicePopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDevicePopup]);

  useEffect(() => {
    if (!showDevUrlPopup) return;
    const handler = (e: MouseEvent) => {
      if (devUrlPopupRef.current && !devUrlPopupRef.current.contains(e.target as Node)) {
        setShowDevUrlPopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDevUrlPopup]);

  const handleIframeLoad = useCallback(() => {
    try {
      if (iframeRef.current?.contentWindow?.location) {
        const href = iframeRef.current.contentWindow.location.href;
        const url = new URL(href);
        const newUrl = `${url.hostname}${url.port ? ':' + url.port : ''}${url.pathname}`;
        setCurrentUrl(newUrl);
        
        // Track navigation history
        const currentIndex = navigationIndexRef.current;
        navigationHistoryRef.current = navigationHistoryRef.current.slice(0, currentIndex + 1);
        if (navigationHistoryRef.current[navigationHistoryRef.current.length - 1] !== newUrl) {
          navigationHistoryRef.current.push(newUrl);
          navigationIndexRef.current = navigationHistoryRef.current.length - 1;
        }
      }
    } catch (e) {
      // Cross-origin iframe - show domain-based URL
      setCurrentUrl(publicUrl);
    }
    // Hide loading overlay when page finishes loading
    setIsExecuting(false);
  }, [publicUrl]);
  useEffect(() => {
    const displayUrl = `http://${currentUrl || publicUrl || "localhost:5000"}`;
    setUrlInput(displayUrl);
  }, [currentUrl, publicUrl]);

  const handleUrlInputSubmit = (e: FormEvent) => {
    e.preventDefault();
    let value = urlInput.trim();
    if (!value) return;
    if (!/^https?:\/\//i.test(value)) {
      value = `http://${value}`;
    }
    try {
      const urlObj = new URL(value);
      const newUrl = `${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname}`;
      if (iframeRef.current) {
        iframeRef.current.src = value;
      }
      setCurrentUrl(newUrl);
      // Update navigation history when navigating via URL bar
      const currentIndex = navigationIndexRef.current;
      navigationHistoryRef.current = navigationHistoryRef.current.slice(0, currentIndex + 1);
      if (navigationHistoryRef.current[navigationHistoryRef.current.length - 1] !== newUrl) {
        navigationHistoryRef.current.push(newUrl);
        navigationIndexRef.current = navigationHistoryRef.current.length - 1;
      }
      setIsExecuting(true);
    } catch (err) {
      console.error('Invalid URL entered in preview bar', err);
    }
  };


  const handleNavigateBack = useCallback(() => {
    if (navigationIndexRef.current > 0) {
      navigationIndexRef.current--;
      const url = navigationHistoryRef.current[navigationIndexRef.current];
      if (iframeRef.current && url) {
        iframeRef.current.src = `http://${url}`;
      }
    }
  }, []);

  const handleNavigateForward = useCallback(() => {
    if (navigationIndexRef.current < navigationHistoryRef.current.length - 1) {
      navigationIndexRef.current++;
      const url = navigationHistoryRef.current[navigationIndexRef.current];
      if (iframeRef.current && url) {
        iframeRef.current.src = `http://${url}`;
      }
    }
  }, []);

  // Hard restart handler - calls backend restart API and reloads iframe
  const handleHardRestart = async () => {
    try {
      setIsExecuting(true);
      await fetch("/api/restart", { method: "POST" });
    } catch (e) {
      console.error("Failed to restart preview server", e);
    } finally {
      if (iframeRef.current) {
      setLastReloadType("hard");
        iframeRef.current.src = iframeRef.current.src;
      setLastReloadType("hot");
      }
      setIsExecuting(false);
    }
  };

const handleCopyUrl = () => {
    const urlToCopy = `http://${publicUrl || currentUrl || "localhost:5000"}`;
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPageIndex < 3) {
        setCurrentPageIndex(currentPageIndex + 1);
      } else if (diff < 0 && currentPageIndex > 0) {
        setCurrentPageIndex(currentPageIndex - 1);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchEndX = e.touches[0].clientX;
    const diff = Math.abs(touchStartX.current - touchEndX);
    
    if (diff < 20) {
      return;
    }
  };

  const handleDevToolsResizeMouseDown = (e: any) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = devToolsHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      let next = startHeight + delta;
      const minHeight = 160;
      const maxHeight = Math.max(200, window.innerHeight - 120);
      if (next < minHeight) next = minHeight;
      if (next > maxHeight) next = maxHeight;
      setDevToolsHeight(next);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };


  const handlePlayClick = () => {
    // Just toggle running state like Agent page does
    setIsExecuting(!isExecuting);
  };

  const getDeviceStyles = () => {
    const cfg = DEVICE_CONFIGS[selectedDevice];
    if (cfg && cfg.width && cfg.height && selectedDevice !== "fullsize" && selectedDevice !== "16:9") {
      return { width: cfg.width, height: cfg.height };
    }
    switch (deviceType) {
      case "iphone":
        return { width: "375px", height: "667px" };
      case "ipad":
        return { width: "768px", height: "1024px" };
      case "android":
        return { width: "360px", height: "640px" };
      default:
        return { width: "100%", height: "100%" };
    }
  };

  const handleResizeDragStart = (e: React.MouseEvent, type: "right" | "bottom" | "corner") => {
    e.preventDefault();
    const container = previewContainerRef.current;
    if (!container) return;
    dragTypeRef.current = type;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartWRef.current = customWidth ?? container.offsetWidth;
    dragStartHRef.current = customHeight ?? container.offsetHeight;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStartXRef.current;
      const dy = ev.clientY - dragStartYRef.current;
      if (dragTypeRef.current === "right" || dragTypeRef.current === "corner") {
        setCustomWidth(Math.max(280, dragStartWRef.current + dx));
      }
      if (dragTypeRef.current === "bottom" || dragTypeRef.current === "corner") {
        setCustomHeight(Math.max(200, dragStartHRef.current + dy));
      }
    };
    const onUp = () => {
      dragTypeRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  useEffect(() => {
    if (!iframeRef.current) return;
    
    const setupConsoleCapture = () => {
      try {
        const iframeWindow = iframeRef.current?.contentWindow as any;
        const iframeDoc = iframeRef.current?.contentDocument;
        
        if (!iframeWindow) return;
        
        const getTime = () => new Date().toLocaleTimeString();

        // Capture console methods
        if (iframeWindow?.console) {
          const originalLog = iframeWindow.console.log;
          const originalError = iframeWindow.console.error;
          const originalWarn = iframeWindow.console.warn;
          const originalInfo = iframeWindow.console.info;

          iframeWindow.console.log = function(...args: any[]) {
            originalLog?.apply(iframeWindow.console, args);
            const message = args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(" ");
            setConsoleLogs(prev => [...prev, { type: "log", message, time: getTime() }]);
          };

          iframeWindow.console.error = function(...args: any[]) {
            originalError?.apply(iframeWindow.console, args);
            const message = args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(" ");
            setConsoleLogs(prev => [...prev, { type: "error", message, time: getTime() }]);
          };

          iframeWindow.console.warn = function(...args: any[]) {
            originalWarn?.apply(iframeWindow.console, args);
            const message = args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(" ");
            setConsoleLogs(prev => [...prev, { type: "warn", message, time: getTime() }]);
          };

          iframeWindow.console.info = function(...args: any[]) {
            originalInfo?.apply(iframeWindow.console, args);
            const message = args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(" ");
            setConsoleLogs(prev => [...prev, { type: "info", message, time: getTime() }]);
          };
        }

        // Monitor DOM changes for Elements tab
        if (iframeDoc) {
          const observer = new MutationObserver(() => {
            const htmlStr = iframeDoc.documentElement.outerHTML.substring(0, 2500);
            setDomElements(htmlStr);
          });
          observer.observe(iframeDoc.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true
          });
          return () => observer.disconnect();
        }
      } catch (e) {
        console.error("Failed to setup console capture:", e);
      }
    };

    // Setup console capture immediately
    setupConsoleCapture();

    // Also setup on iframe load
    const handleLoad = () => {
      setupConsoleCapture();
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleLoad);
      return () => iframeRef.current?.removeEventListener('load', handleLoad);
    }
  }, []);

  // Separate effect for network monitoring
  useEffect(() => {
    if (!iframeRef.current) return;

    const setupNetworkCapture = () => {
      try {
        const iframeWindow = iframeRef.current?.contentWindow as any;
        if (!iframeWindow) return;

        const getTime = () => new Date().toLocaleTimeString();

        // Intercept fetch
        if (iframeWindow?.fetch) {
          const originalFetch = iframeWindow.fetch;
          iframeWindow.fetch = async function(url: any, options?: any) {
            const method = (options?.method || "GET").toUpperCase();
            const urlStr = typeof url === "string" ? url : url.toString();
            const time = getTime();
            
            try {
              const response = await originalFetch(url, options);
              const status = response.status;
              const contentType = response.headers.get("content-type") || "application/octet-stream";
              setNetworkRequests(prev => [...prev, {
                method,
                url: urlStr.split("?")[0],
                status: status.toString(),
                type: contentType,
                time
              }]);
              return response;
            } catch (e) {
              setNetworkRequests(prev => [...prev, {
                method,
                url: urlStr,
                status: "error",
                type: "failed",
                time
              }]);
              throw e;
            }
          };
        }

        // Intercept XMLHttpRequest
        if (iframeWindow?.XMLHttpRequest) {
          const OriginalXHR = iframeWindow.XMLHttpRequest;
          const newXHR = function() {
            const xhr = new OriginalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            let method = "", url = "";
            const time = getTime();

            xhr.open = function(meth: string, u: string, ...args: any) {
              method = meth;
              url = u;
              return originalOpen.apply(xhr, [meth, u, ...args]);
            };

            xhr.send = function(...args: any) {
              const onReadyStateChange = xhr.onreadystatechange;
              xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                  setNetworkRequests(prev => [...prev, {
                    method,
                    url: url.split("?")[0],
                    status: xhr.status.toString(),
                    type: xhr.getResponseHeader("content-type") || "application/octet-stream",
                    time
                  }]);
                }
                onReadyStateChange?.apply(xhr, arguments);
              };
              return originalSend.apply(xhr, args);
            };

            return xhr;
          };
          iframeWindow.XMLHttpRequest = newXHR;
        }
      } catch (e) {
        console.error("Failed to setup network capture:", e);
      }
    };

    setupNetworkCapture();

    const handleLoad = () => {
      setupNetworkCapture();
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleLoad);
      return () => iframeRef.current?.removeEventListener('load', handleLoad);
    }
  }, []);

  const renderGridModeContent = () => {
    if (currentPageIndex === 0) {
      return <GridConsolePage />;
    } else if (currentPageIndex === 1) {
      return <GridAgentPage />;
    } else if (currentPageIndex === 2) {
      return <GridPreviewPage />;
    } else if (currentPageIndex === 3) {
      return <GridPublishingPage />;
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-screen bg-[#0f1419] overflow-hidden transition-all duration-300 ease-in-out ${
      gridMode ? "translate-y-[-40px]" : "translate-y-0"
    }`}>
      {gridMode && <div className="fixed inset-0 bg-black/40 z-20 pointer-events-none" />}
      
      <div className={`flex-1 flex flex-col overflow-hidden ${gridMode ? "mx-2 sm:mx-4 my-4 rounded-t-2xl sm:rounded-t-3xl border-2 border-gray-700 bg-[#0f1419]" : ""}`} onTouchStart={gridMode ? handleTouchStart : undefined} onTouchEnd={gridMode ? handleTouchEnd : undefined} onTouchMove={gridMode ? handleTouchMove : undefined}>
        {!gridMode ? (
          <>
            {/* Header */}
            <header className="bg-[#1a1f2e] border-b border-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                {crashReason && (
                  <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {crashReason}
                  </span>
                )}
                {lastAction && (
                  <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                    {lastAction}
                  </span>
                )}
                {lastReloadType && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${lastReloadType === "hot" ? "bg-green-600 text-white" : "bg-yellow-500 text-black"}`}>
                    {lastReloadType === "hot" ? "Hot Reload" : "Server Restart"}
                  </span>
                )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg"
                    onClick={() => setLocation("/agent")}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-gray-400 text-xs font-medium">Publish</span>
                  </div>
                  <div className="w-0.5 h-4 bg-gray-600"></div>
                  <div className="flex items-center gap-1.5">
                    <Monitor className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-200 text-sm font-medium">Preview</span>
                  </div>
                </div>
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg"
                      data-testid="button-menu"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem data-testid="menu-settings">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-keyboard">
                      <Keyboard className="h-4 w-4 mr-2" />
                      <span>Keyboard Shortcuts</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem data-testid="menu-help">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      <span>Help & Support</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Browser Bar */}
            <div className="bg-[#1a1f2e] border-b border-gray-700 px-3 sm:px-4 py-2 flex-shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid="button-back-nav"
                  onClick={handleNavigateBack}
                  disabled={navigationIndexRef.current <= 0}
                  title="Go back"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid="button-forward-nav"
                  onClick={handleNavigateForward}
                  disabled={navigationIndexRef.current >= navigationHistoryRef.current.length - 1}
                  title="Go forward"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-transform hover:rotate-180 duration-300"
                  data-testid="button-refresh"
                  onClick={() => {
                    setIsExecuting(true);
                    setConsoleLogs([]);
                    setNetworkRequests([]);
                    if (iframeRef.current) {
                      iframeRef.current.src = iframeRef.current.src;
                      setLastReloadType("hot");
                    }
                  }}
                  title="Refresh preview"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>

                {/* Dev URL popup anchor */}
                <div className="relative" ref={devUrlPopupRef}>
                  <button
                    onClick={() => setShowDevUrlPopup(v => !v)}
                    className="flex items-center justify-center h-7 w-7 rounded text-base transition-all duration-150 hover:bg-gray-700 flex-shrink-0"
                    title="Dev URL settings"
                    data-testid="button-dev-url-chain"
                  >
                    ⛓️‍💥
                  </button>

                  {showDevUrlPopup && (() => {
                    const devUrl = publicUrl
                      ? `https://${publicUrl}`
                      : `http://localhost:5000`;
                    return (
                      <div
                        className="absolute left-0 top-full mt-1.5 z-50 rounded-lg overflow-hidden"
                        style={{
                          background: "#1a1d27",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
                          width: "260px",
                        }}
                      >
                        {/* Private Dev URL */}
                        <div className="px-3 pt-3 pb-2">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[11.5px] font-semibold text-white">Private Dev URL</p>
                            <button
                              onClick={() => setPrivateDevUrl(v => !v)}
                              className="relative flex-shrink-0 rounded-full transition-all duration-300"
                              style={{
                                minWidth: "32px", width: "32px", height: "18px",
                                background: privateDevUrl ? "#3b82f6" : "rgba(255,255,255,0.15)",
                              }}
                              data-testid="toggle-private-dev-url"
                            >
                              <span
                                className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all duration-300"
                                style={{ left: privateDevUrl ? "calc(100% - 16px)" : "1px", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                              />
                            </button>
                          </div>
                          <p className="text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.65)" }}>
                            {privateDevUrl
                              ? "Only authenticated editors can access the Dev URL."
                              : "Anyone with the Dev URL can access your app preview."}
                          </p>
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

                        {/* Port */}
                        <div className="px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10.5px] font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>Port:</span>
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" style={{ boxShadow: "0 0 4px rgba(59,130,246,0.8)" }} />
                            <span className="text-[11px] font-mono font-semibold text-white">:5000 → :80</span>
                          </div>
                          <button
                            className="p-0.5 rounded transition-colors hover:bg-gray-700"
                            style={{ color: "rgba(148,163,184,0.5)" }}
                            title="Port settings"
                            data-testid="button-port-settings"
                          >
                            <Settings className="h-3 w-3" />
                          </button>
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

                        {/* URL + copy */}
                        <div className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={devUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-[10px] font-mono truncate hover:underline"
                              style={{ color: "#4ade80" }}
                              data-testid="link-dev-url"
                            >
                              {devUrl}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(devUrl);
                                setCopiedDevLink(true);
                                setTimeout(() => setCopiedDevLink(false), 2000);
                              }}
                              className="flex-shrink-0 p-1 rounded transition-all duration-150 hover:bg-gray-700"
                              style={{ color: copiedDevLink ? "#4ade80" : "rgba(148,163,184,0.55)" }}
                              title="Copy URL"
                              data-testid="button-copy-dev-url"
                            >
                              {copiedDevLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <p className="text-[9.5px] mt-1" style={{ color: "rgba(100,116,139,0.6)" }}>
                            Temporary — sleeps when you leave.
                          </p>
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

                        {/* QR code */}
                        <div className="px-3 py-2">
                          <div className="p-1.5 rounded bg-white inline-block">
                            <QRCodeSVG value={devUrl} size={80} bgColor="#ffffff" fgColor="#000000" level="M" />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex-1 flex items-center bg-[#0f1419] rounded px-2.5 py-1 min-w-0 mx-1">
                  <form className="w-full" onSubmit={handleUrlInputSubmit}>
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full h-6 bg-transparent border-none px-0 text-[11px] text-gray-300 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                      data-testid="input-preview-url"
                      spellCheck={false}
                    />
                  </form>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`h-7 w-7 rounded ${devToolsOpen ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"}`}
                  onClick={() => setDevToolsOpen(!devToolsOpen)}
                  data-testid="button-devtools"
                  title="Developer tools"
                >
                  <Wrench className="h-3.5 w-3.5" />
                </Button>

                {/* Device selector */}
                <div className="relative" ref={devicePopupRef}>
                  <button
                    className="flex items-center gap-1 px-2 h-7 rounded cursor-pointer"
                    style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
                    data-testid="device-indicator"
                    title={DEVICE_CONFIGS[selectedDevice]?.label ?? "Device"}
                    onClick={() => setShowDevicePopup(v => !v)}
                  >
                    <Monitor className="h-3 w-3 text-blue-400" />
                  </button>

                  {showDevicePopup && (
                    <div
                      className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden py-1"
                      style={{ background: "#1a1d27", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: 180 }}
                    >
                      {DEVICE_GROUPS.map(group => (
                        <div key={group.groupLabel}>
                          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            {group.groupLabel}
                          </div>
                          {group.keys.map(key => (
                            <button
                              key={key}
                              className="w-full text-left px-3 py-1.5 text-[12px] flex items-center justify-between gap-2 hover:bg-white/5 transition-colors"
                              style={{ color: selectedDevice === key ? "#60a5fa" : "#d1d5db" }}
                              onClick={() => handleSelectDevice(key)}
                            >
                              <span>{DEVICE_CONFIGS[key].label}</span>
                              {DEVICE_CONFIGS[key].dims && (
                                <span className="text-[10px] text-gray-500">{DEVICE_CONFIGS[key].dims}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
                  data-testid="button-copy-url"
                  onClick={handleCopyUrl}
                  title="Copy preview URL"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>

                <Button variant="ghost" size="icon" onClick={() => window.open(`http://${publicUrl || currentUrl || "localhost:5000"}`, "_blank")} className="h-7 w-7 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" data-testid="button-open-external" title="Open in new tab">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <main className={`flex-1 overflow-hidden bg-[#0f1419] relative flex flex-col ${devToolsOpen ? "" : ""}`}>
              {DEVICE_CONFIGS[selectedDevice]?.frame === "phone" ? (
                /* flex-1 gives explicit height; relative+overflow-hidden so the abs inner can fill it */
                <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
                  {/* Absolute fill — gives the centering flex container a definite pixel height */}
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0d0f18]" style={{ padding: "28px 24px 16px" }}>
                    {/* Device container: aspect-ratio + height:100% now resolves correctly */}
                    <div
                      style={{
                        aspectRatio: `${parseInt(DEVICE_CONFIGS[selectedDevice].width!)} / ${parseInt(DEVICE_CONFIGS[selectedDevice].height!)}`,
                        height: "100%",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        position: "relative",
                        flexShrink: 0,
                        transition: "aspect-ratio 0.25s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      <DeviceFrame deviceKey={selectedDevice}>
                        <iframe
                          ref={iframeRef}
                          src="http://localhost:5000"
                          className="absolute inset-0 w-full h-full border-none"
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                          title="Preview"
                          onLoad={handleIframeLoad}
                        />
                      </DeviceFrame>
                    </div>
                  </div>
                </div>
              ) : DEVICE_CONFIGS[selectedDevice]?.frame === "tablet" ? (
                /* ── TABLET: landscape frame with bezel ── */
                <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background:"radial-gradient(ellipse at 40% 35%, #0d1829 0%, #060c18 45%, #020408 100%)", padding:"32px 40px 28px" }}>
                    <div style={{
                      aspectRatio:"16/9",
                      height:"100%",
                      maxWidth:"100%",
                      maxHeight:"100%",
                      position:"relative",
                      flexShrink:0,
                      transition:"aspect-ratio 0.25s cubic-bezier(0.22,1,0.36,1)",
                    }}>
                      <TabletFrame>
                        <iframe
                          ref={iframeRef}
                          src="http://localhost:5000"
                          className="absolute inset-0 w-full h-full border-none"
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                          title="Preview"
                          onLoad={handleIframeLoad}
                        />
                      </TabletFrame>
                    </div>
                  </div>
                </div>
              ) : selectedDevice === "fullsize" && !customWidth && !customHeight ? (
                /* ── FULLSIZE: fills entire area like a real browser ── */
                <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
                  <iframe
                    ref={iframeRef}
                    src="http://localhost:5000"
                    className="absolute inset-0 w-full h-full border-none bg-white"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                    title="Preview"
                    onLoad={handleIframeLoad}
                  />
                </div>
              ) : (
                /* ── DESKTOP / 16:9 layout ── */
                <div className={`flex-1 flex flex-col items-center justify-center overflow-auto gap-4 ${customWidth ? "bg-[#0d0f18] p-4" : ""}`}>
                  <div
                    ref={previewContainerRef}
                    className="relative flex-shrink-0"
                    style={{
                      overflow: "visible",
                      transition: "width 0.25s cubic-bezier(0.22,1,0.36,1), height 0.25s cubic-bezier(0.22,1,0.36,1)",
                      ...(selectedDevice === "16:9"
                        ? { width: "100%", aspectRatio: "16/9", maxHeight: "100%" }
                        : customWidth || customHeight
                        ? { width: customWidth ?? "100%", height: customHeight ?? 500 }
                        : { width: "100%", height: "100%" }),
                    }}
                  >
                    <iframe
                      ref={iframeRef}
                      src="http://localhost:5000"
                      className="w-full h-full border-none"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                      title="Preview"
                      onLoad={handleIframeLoad}
                    />

                    {/* Resize handles — desktop/16:9 only */}
                    {selectedDevice === "fullsize" && (
                      <>
                        <div onMouseDown={(e) => handleResizeDragStart(e, "right")} className="absolute top-0 right-0 w-2 h-full cursor-col-resize group z-10 flex items-center justify-center" title="Drag to resize width">
                          <div className="w-1 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(124,141,255,0.7)" }} />
                        </div>
                        <div onMouseDown={(e) => handleResizeDragStart(e, "bottom")} className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize group z-10 flex items-center justify-center" title="Drag to resize height">
                          <div className="h-1 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(124,141,255,0.7)" }} />
                        </div>
                        <div onMouseDown={(e) => handleResizeDragStart(e, "corner")} className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end p-0.5" title="Drag to resize">
                          <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.5 }}>
                            <path d="M9 1 L1 9 M9 5 L5 9 M9 9 L9 9" stroke="rgba(124,141,255,0.9)" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Size label for 16:9 / manual resize */}
                  {selectedDevice === "16:9" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: "rgba(148,163,184,0.7)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>16:9 · 1280 × 720</span>
                      <button onClick={() => handleSelectDevice("fullsize")} className="text-xs px-2 py-0.5 rounded transition-colors" style={{ color: "rgba(124,141,255,0.8)", background: "rgba(124,141,255,0.08)", border: "1px solid rgba(124,141,255,0.2)" }}>Reset</button>
                    </div>
                  )}
                  {selectedDevice === "fullsize" && (customWidth || customHeight) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: "rgba(148,163,184,0.7)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>{Math.round(customWidth ?? 0)} × {Math.round(customHeight ?? 0)}</span>
                      <button onClick={() => { setCustomWidth(null); setCustomHeight(null); }} className="text-xs px-2 py-0.5 rounded transition-colors" style={{ color: "rgba(124,141,255,0.8)", background: "rgba(124,141,255,0.08)", border: "1px solid rgba(124,141,255,0.2)" }}>Reset</button>
                    </div>
                  )}
                </div>
              )}

              {/* Device label bar (frame devices only) */}
              {DEVICE_CONFIGS[selectedDevice]?.frame === "phone" && (
                <div className="flex items-center justify-center gap-2 py-1.5 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: "rgba(148,163,184,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {DEVICE_CONFIGS[selectedDevice].label}{DEVICE_CONFIGS[selectedDevice].dims && ` · ${DEVICE_CONFIGS[selectedDevice].dims}`}
                  </span>
                  <button onClick={() => handleSelectDevice("fullsize")} className="text-xs px-2 py-0.5 rounded transition-colors" style={{ color: "rgba(124,141,255,0.8)", background: "rgba(124,141,255,0.08)", border: "1px solid rgba(124,141,255,0.2)" }}>Reset</button>
                </div>
              )}

              {/* Overlay - Show when not executing (desktop only, not phone/tablet/fullsize) */}
              {!isExecuting && DEVICE_CONFIGS[selectedDevice]?.frame !== "phone" && DEVICE_CONFIGS[selectedDevice]?.frame !== "tablet" && selectedDevice !== "fullsize" && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] bg-opacity-95">
                  <div className="text-center space-y-6">
                    <p className="text-gray-400 text-sm">Ready to preview</p>
                    <Button
                      onClick={handlePlayClick}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold px-8 py-3 text-base"
                      data-testid="button-start-now"
                    >
                      Start Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading overlay - Show when executing (desktop only, not phone/tablet/fullsize) */}
              {isExecuting && DEVICE_CONFIGS[selectedDevice]?.frame !== "phone" && DEVICE_CONFIGS[selectedDevice]?.frame !== "tablet" && selectedDevice !== "fullsize" && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] bg-opacity-90">
                  <div className="text-center space-y-4">
                    <p className="text-gray-300 text-sm font-medium">Running...</p>
                  </div>
                </div>
              )}

              {/* Error Panel - Show when errors exist */}
              {executionState.errors.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-950/95 border-t-2 border-red-600">
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-300">
                          Error ({currentErrorIndex + 1} of {executionState.errors.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                          onClick={() => setCurrentErrorIndex(Math.max(0, currentErrorIndex - 1))}
                          disabled={currentErrorIndex === 0}
                          data-testid="button-prev-error"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                          onClick={() => setCurrentErrorIndex(Math.min(executionState.errors.length - 1, currentErrorIndex + 1))}
                          disabled={currentErrorIndex === executionState.errors.length - 1}
                          data-testid="button-next-error"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                          onClick={() => setErrorExpanded(!errorExpanded)}
                          data-testid="button-expand-error"
                        >
                          <ChevronDown className={`h-3 w-3 transition-transform ${errorExpanded ? "rotate-180" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Error Details */}
                    <div className="text-xs text-red-200 space-y-1 max-h-24 overflow-y-auto">
                      <p className="font-mono">
                        {executionState.errors[currentErrorIndex]?.message || "Unknown error"}
                      </p>
                      {executionState.errors[currentErrorIndex]?.file && (
                        <p className="text-red-300">
                          {executionState.errors[currentErrorIndex].file}:{executionState.errors[currentErrorIndex].line}:{executionState.errors[currentErrorIndex].column}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Tools Panel - Bottom Overlay */}
              {devToolsOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#050816] border-t border-gray-800 shadow-2xl flex flex-col" style={{height: devToolsMinimized ? "auto" : `${devToolsHeight}px`}}>
                  <div
                    className="h-1.5 cursor-row-resize bg-gray-800/80 hover:bg-gray-700 flex-shrink-0"
                    onMouseDown={handleDevToolsResizeMouseDown}
                  />
                  {/* Dev Tools Header */}
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-700 bg-[#0f1419]">
                    <span className="text-xs text-gray-400 ml-3">Network:</span>
                    <select
                      className="bg-[#111827] border border-gray-700 text-xs rounded px-1 py-0.5 text-gray-200"
                      value={networkMode}
                      onChange={(e) => setNetworkMode(e.target.value as any)}
                    >
                      <option value="normal">Normal</option>
                      <option value="slow">Slow 3G</option>
                      <option value="offline">Offline</option>
                    </select>
                    <label className="ml-3 flex items-center gap-1 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={followSharedPreview}
                        onChange={() => setFollowSharedPreview(v => !v)}
                      />
                      Follow team session
                    </label>

                    <Button
                      variant={devToolsTab === "elements" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDevToolsTab("elements")}
                      data-testid="tab-elements"
                    >
                      <Crosshair className="h-3 w-3 mr-1" />
                      Elements
                    </Button>
                    <Button
                      variant={devToolsTab === "console" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDevToolsTab("console")}
                      data-testid="tab-webview-logs"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Webview Logs
                    </Button>
                    <Button
                      variant={devToolsTab === "network" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDevToolsTab("network")}
                      data-testid="tab-server-logs"
                    >
                      <Server className="h-3 w-3 mr-1" />
                      Server Logs
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-gray-200"
                      onClick={() => setDevToolsMinimized(!devToolsMinimized)}
                      data-testid="button-minimize-devtools"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${devToolsMinimized ? "rotate-180" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-gray-200"
                      onClick={() => setDevToolsOpen(false)}
                      data-testid="button-close-devtools"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {!devToolsMinimized && (
                    <>
                  {/* Elements / Inspect Tab */}
                  {devToolsTab === "elements" && (
                    <div className="flex-1 overflow-y-auto flex flex-col font-mono text-xs">
                      {/* Inspect toolbar */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 bg-[#0f1419]">
                        <span className="text-[11px] text-gray-400 font-sans">
                          {inspectMode ? "Hover and click any element in the preview" : "Enable inspect from the toolbar ⊕"}
                        </span>
                        {selectedElementInfo && (
                          <button
                            onClick={() => setSelectedElementInfo(null)}
                            className="ml-auto text-gray-500 hover:text-gray-300 text-xs font-sans"
                            data-testid="button-clear-inspect"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {!selectedElementInfo ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500 p-6">
                          <Crosshair className="h-8 w-8 opacity-30" />
                          <p className="text-center font-sans text-xs">
                            {inspectMode
                              ? "Hover and click any element in the preview"
                              : 'Click "Start Inspect" then click any element in the preview'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto p-3 space-y-4">
                          {/* Element tag line */}
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-sans">Element</p>
                            <div className="bg-[#0f1419] rounded p-2 text-[11px] leading-relaxed" style={{ color: "#a5b4fc" }}>
                              <span style={{ color: "#f87171" }}>&lt;{selectedElementInfo.tag}</span>
                              {selectedElementInfo.id && (
                                <span style={{ color: "#fbbf24" }}> id=&quot;{selectedElementInfo.id}&quot;</span>
                              )}
                              {selectedElementInfo.classes.length > 0 && (
                                <span style={{ color: "#34d399" }}> class=&quot;{selectedElementInfo.classes.join(" ")}&quot;</span>
                              )}
                              {Object.entries(selectedElementInfo.attributes)
                                .filter(([k]) => k !== "id" && k !== "class")
                                .slice(0, 4)
                                .map(([k, v]) => (
                                  <span key={k} style={{ color: "#94a3b8" }}> {k}=&quot;{v.length > 30 ? v.slice(0, 30) + "…" : v}&quot;</span>
                                ))}
                              <span style={{ color: "#f87171" }}>&gt;</span>
                            </div>
                          </div>

                          {/* Box model */}
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-sans">Box Model</p>
                            <div className="bg-[#0f1419] rounded p-2 space-y-1 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-gray-500">width</span>
                                <span className="text-blue-300">{selectedElementInfo.rect.width}px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">height</span>
                                <span className="text-blue-300">{selectedElementInfo.rect.height}px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">top</span>
                                <span className="text-gray-300">{selectedElementInfo.rect.top}px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">left</span>
                                <span className="text-gray-300">{selectedElementInfo.rect.left}px</span>
                              </div>
                            </div>
                          </div>

                          {/* Computed Styles */}
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-sans">Computed Styles</p>
                            <div className="bg-[#0f1419] rounded p-2 space-y-1 text-[11px]">
                              {Object.entries(selectedElementInfo.styles)
                                .filter(([, v]) => v && v !== "none" && v !== "normal" && v !== "auto" && v !== "0px" && v !== "")
                                .map(([k, v]) => (
                                  <div key={k} className="flex justify-between gap-2">
                                    <span className="text-[#94a3b8] shrink-0">{k}</span>
                                    <span className="text-[#a5b4fc] text-right break-all">{v.length > 40 ? v.slice(0, 40) + "…" : v}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Webview Logs Tab */}
                  {devToolsTab === "console" && (
                    <div className="flex-1 overflow-y-auto flex flex-col">
                      {consoleLogs.length > 0 && (
                        <div className="px-3 py-2 border-b border-gray-700 bg-[#0f1419] flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-gray-400 hover:text-gray-200"
                            onClick={() => setConsoleLogs([])}
                            data-testid="button-clear-console"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
                        {consoleLogs.length === 0 ? (
                          <p className="text-gray-500">No console logs yet...</p>
                        ) : (
                          consoleLogs.map((log, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-gray-600 flex-shrink-0">{log.time}</span>
                              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${
                                log.type === "error" ? "bg-red-900/50 text-red-300" :
                                log.type === "warn" ? "bg-yellow-900/50 text-yellow-300" :
                                log.type === "info" ? "bg-blue-900/50 text-blue-300" :
                                "bg-gray-900/50 text-gray-300"
                              }`}>
                                {log.type.toUpperCase()}
                              </span>
                              <span className={`flex-1 ${
                                log.type === "error"
                                  ? "text-red-300"
                                  : log.type === "warn"
                                  ? "text-yellow-300"
                                  : log.type === "info"
                                  ? "text-blue-300"
                                  : "text-gray-200"
                              }`}>
                                {log.message}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Server Logs Tab (Network) */}
                  {devToolsTab === "network" && (
                    <div className="flex-1 overflow-y-auto flex flex-col">
                      {networkRequests.length > 0 && (
                        <div className="px-3 py-2 border-b border-gray-700 bg-[#0f1419] flex justify-end gap-2">
                          <span className="text-xs text-gray-500">{networkRequests.length} requests</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-gray-400 hover:text-gray-200"
                            onClick={() => setNetworkRequests([])}
                            data-testid="button-clear-network"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                      <div className="flex-1 overflow-y-auto">
                        {networkRequests.length === 0 ? (
                          <div className="p-3 text-gray-500 text-xs">No network requests yet...</div>
                        ) : (
                          <div className="divide-y divide-gray-700">
                            {networkRequests.map((req, idx) => (
                              <div key={idx} className="p-3 text-xs hover:bg-gray-800 transition space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 flex-shrink-0 w-12">{req.time}</span>
                                  <span className={`px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                                    req.method === "GET" ? "bg-blue-900/50 text-blue-300" :
                                    req.method === "POST" ? "bg-green-900/50 text-green-300" :
                                    "bg-gray-900/50 text-gray-300"
                                  }`}>
                                    {req.method}
                                  </span>
                                  <span className="text-gray-300 flex-1 truncate font-mono">{req.url}</span>
                                  <span className={`px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                                    req.status === "200" ? "bg-green-900/50 text-green-300" :
                                    req.status === "error" ? "bg-red-900/50 text-red-300" :
                                    "bg-gray-900/50 text-gray-300"
                                  }`}>
                                    {req.status}
                                  </span>
                                </div>
                                <div className="text-gray-500 text-xs ml-12 truncate">
                                  {req.type.substring(0, 50)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </div>
              )}
            </main>

          </>
        ) : (
          renderGridModeContent()
        )}
      </div>

      {gridMode && (
        <div className="bg-[#1a1f2e] border-t border-gray-800">
          <div className="px-4 py-3">
            <div className="grid grid-cols-4 gap-3 mb-8">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 py-4 bg-gray-800/50 border border-gray-700 hover:bg-gray-700 text-white rounded-xl"
                data-testid="button-tool-secrets"
              >
                <Lock className="h-6 w-6" />
                <span className="font-medium text-sm">Secrets</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 py-4 bg-gray-800/50 border border-gray-700 hover:bg-gray-700 text-white rounded-xl"
                data-testid="button-tool-database"
              >
                <Database className="h-6 w-6" />
                <span className="font-medium text-sm">Database</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 py-4 bg-gray-800/50 border border-gray-700 hover:bg-gray-700 text-white rounded-xl"
                data-testid="button-tool-new-tab"
              >
                <Plus className="h-6 w-6" />
                <span className="font-medium text-sm">New Tab</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-800/50 border border-gray-700 hover:bg-gray-700 text-white rounded-xl flex-shrink-0"
                onClick={() => setShowFilesModal(true)}
                data-testid="button-tool-files"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </Button>

              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 py-3 bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm rounded-xl"
                  data-testid="input-search-tools"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  data-testid="button-search-icon"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              <Button 
                variant="ghost" 
                onClick={() => setGridMode(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700 h-11 w-11 rounded-xl flex-shrink-0 border border-gray-700 bg-gray-800/50"
                data-testid="button-close-tools"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <FilesModal isOpen={showFilesModal} onClose={() => setShowFilesModal(false)} />
      <URLSharingModal 
        isOpen={showUrlModal} 
        onClose={() => setShowUrlModal(false)} 
        publicUrl={publicUrl}
        currentPage="preview"
      />
    </div>
  );

  // AGENT PREVIEW AUTO REFRESH
  useEffect(() => {
    const es = new EventSource("/sse/console");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data && data.type === "done") {
          setIframeKey((k: number) => k + 1);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  // FILE EXPLORER AUTO RELOAD
  useEffect(() => {
    const handler = () => {
      setIframeKey((k: number) => k + 1);
    };
    window.addEventListener("file-refresh", handler);
    return () => window.removeEventListener("file-refresh", handler);
  }, []);
}
