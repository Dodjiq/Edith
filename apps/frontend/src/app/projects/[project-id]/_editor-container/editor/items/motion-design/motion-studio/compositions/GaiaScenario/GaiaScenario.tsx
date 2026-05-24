"use client";
import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useDesignFrame } from "../../use-design-frame";
import { computeWindows, contentProgress, type StateWindow } from "./timing";
import type {
  BotMessageState,
  LoadingState,
  Scenario,
  ScenarioState,
  ThinkingState,
  ToolCallsState,
  UserMessageState,
} from "./types";

// chat-ui's getToolCategoryIcon expects keys exactly as they appear in
// the GAIA shared icon config. Our scenario data uses friendlier keys
// (e.g. "google_calendar") that don't normalize cleanly to chat-ui's
// internal name ("googlecalendar"). Map at the boundary.
const TOOL_CATEGORY_ALIASES: Record<string, string> = {
  google_calendar: "googlecalendar",
  google_docs: "googledocs",
  google_sheets: "googlesheets",
  google_tasks: "googletasks",
  google_meet: "googlemeet",
  calendar: "googlecalendar",
};

function resolveCategoryKey(key: string | undefined): string {
  const k = (key ?? "general").trim();
  return TOOL_CATEGORY_ALIASES[k] ?? k;
}

export type GaiaScenarioProps = {
  scenarioJson: string;
  // Top-level overrides — every individual setting is a primitive field
  // in the right sidebar. The full state machine lives in scenarioJson
  // under the "Advanced options" section.
  title?: string;
  theme?: "dark" | "light";
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  /**
   * Visual scale for the chat content. chat-ui ships at native mobile
   * pixel sizes (~16px base font); for video output at 1080×1920 we
   * scale up so messages read at MessageBubbles-equivalent size.
   * Default 2.5.
   */
  scale?: number;
  /** Override the user avatar shown on right-side bubbles. */
  userAvatarUrl?: string;
  /** Override the bot/GAIA logo shown on left-side bubbles. */
  botAvatarUrl?: string;
  /**
   * Whether tool_calls accordion sections render expanded by default.
   * chat-ui's ToolCallsSection collapses by default; for video where there's
   * no user interaction, expanded is the better default.
   *
   * Accepts boolean OR the strings "true" / "false" — the right-sidebar
   * select control serializes as a string, the JSON form stores it as a
   * boolean.
   */
  toolCallsExpanded?: boolean | string;
};

const FALLBACK_SCENARIO: Scenario = {
  id: "fallback",
  title: "Invalid scenario JSON",
  viewport: { width: 390, height: 844 },
  settings: { theme: "dark" },
  states: [],
};

function safeParseScenario(json: string): Scenario {
  try {
    const parsed = JSON.parse(json) as Partial<Scenario>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.states)
    ) {
      return FALLBACK_SCENARIO;
    }
    return {
      id: parsed.id ?? "untitled",
      title: parsed.title ?? "Untitled",
      viewport: parsed.viewport ?? FALLBACK_SCENARIO.viewport,
      settings: parsed.settings ?? { theme: "dark" },
      states: parsed.states as ScenarioState[],
    };
  } catch {
    return FALLBACK_SCENARIO;
  }
}

/**
 * Slice text by progress 0..1, simulating a typing/streaming effect.
 */
function progressiveText(text: string, progress: number): string {
  if (progress <= 0) return "";
  if (progress >= 1) return text;
  const chars = Math.max(
    0,
    Math.min(text.length, Math.floor(text.length * progress)),
  );
  return text.slice(0, chars);
}

export const GaiaScenario: React.FC<GaiaScenarioProps> = ({
  scenarioJson,
  title,
  theme,
  backgroundColor,
  padding = 32,
  borderRadius = 0,
  scale = 2.5,
  userAvatarUrl,
  botAvatarUrl,
  toolCallsExpanded: toolCallsExpandedProp = "true",
}) => {
  // Select fields serialize booleans as strings — coerce.
  const toolCallsExpanded =
    typeof toolCallsExpandedProp === "string"
      ? toolCallsExpandedProp === "true"
      : toolCallsExpandedProp;
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();

  const scenario = useMemo(
    () => safeParseScenario(scenarioJson),
    [scenarioJson],
  );
  const windows = useMemo(() => computeWindows(scenario, fps), [scenario, fps]);

  // Visible windows: any state whose startFrame has been reached.
  const visible = windows.filter((w) => frame >= w.startFrame);

  // The currently-active loading window (if any). We hide loading once the
  // *next* state has started, regardless of pauseAfter overlap.
  const activeLoading = visible.find((w, i) => {
    if (w.type !== "loading") return false;
    const next = windows[i + 1];
    return !next || frame < next.startFrame;
  });

  // Same idea for thinking.
  const activeThinking = visible.find((w, i) => {
    if (w.type !== "thinking") return false;
    const next = windows[i + 1];
    return !next || frame < next.startFrame;
  });

  const resolvedTheme = theme ?? scenario.settings.theme ?? "dark";
  const isDark = resolvedTheme !== "light";
  const bg = backgroundColor || (isDark ? "#0f1014" : "#ffffff");
  const fg = isDark ? "#f5f5f7" : "#0f1014";
  const headerLabel = title ?? scenario.title;

  return (
    <AbsoluteFill
      className="gaia-scenario-root"
      style={{
        background: bg,
        color: fg,
        borderRadius,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
      }}
    >
      {headerLabel && (
        <div
          style={{
            padding: `${Math.round(padding * 0.6)}px ${padding}px`,
            fontSize: 14,
            fontWeight: 500,
            opacity: 0.6,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {headerLabel}
        </div>
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "bottom center",
            width: `${100 / scale}%`,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          {renderVisible(
            visible,
            frame,
            activeLoading?.index ?? null,
            activeThinking?.index ?? null,
            toolCallsExpanded,
            { botAvatarUrl, userAvatarUrl, isDark },
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Render the visible windows, bundling ALL tool_calls states into a SINGLE
 * ToolCallsSection that says "Used N tools" — even when separated by
 * loading / thinking / pause states. The real GAIA UI attaches every tool
 * result a bot used during one turn to one accordion; we mirror that.
 *
 * Flush only happens on user_message / bot_message boundaries (i.e. when
 * a new chat turn starts), so loading→tool_calls→loading→tool_calls
 * collapses into one block.
 */
function renderVisible(
  visible: StateWindow[],
  frame: number,
  activeLoadingIdx: number | null,
  activeThinkingIdx: number | null,
  toolCallsExpanded: boolean,
  visualContext: GaiaVisualContext,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let toolCallsBuf: ScenarioToolEntry[] = [];
  let toolCallsKey: number | null = null;
  // Loading + thinking are scheduled BEFORE the bot bubble in the
  // scenario, but the rendered chat reads better with them anchored
  // at the bottom (after bubble + follow-up actions). Hold them and
  // append at the end of the output.
  let pendingLoading: React.ReactNode = null;
  let pendingThinking: React.ReactNode = null;

  const flushToolCalls = () => {
    if (toolCallsBuf.length > 0 && toolCallsKey !== null) {
      out.push(
        <ToolCallsView
          key={`tc-${toolCallsKey}`}
          entries={toolCallsBuf}
          toolCallsExpanded={toolCallsExpanded}
          isDark={visualContext.isDark}
        />,
      );
      toolCallsBuf = [];
      toolCallsKey = null;
    }
  };

  for (const window of visible) {
    if (window.state.type === "tool_calls") {
      if (toolCallsKey === null) toolCallsKey = window.index;
      for (const entry of window.state.entries) {
        for (const d of entry.data) toolCallsBuf.push(d);
      }
      continue;
    }

    const progress = contentProgress(window, frame);
    switch (window.state.type) {
      case "user_message":
        flushToolCalls();
        // New turn — drop any pending loading/thinking from before.
        pendingLoading = null;
        pendingThinking = null;
        out.push(
          <UserMessageView
            key={window.index}
            state={window.state}
            progress={progress}
            index={window.index}
            userAvatarUrl={visualContext.userAvatarUrl}
          />,
        );
        break;
      case "bot_message":
        flushToolCalls();
        // Once the bot has started replying, the prior loading is
        // stale — but per spec, keep loading visible if it's *still*
        // marked active (mid-stream agentic step).
        out.push(
          <BotMessageView
            key={window.index}
            state={window.state}
            progress={progress}
            index={window.index}
            botAvatarUrl={visualContext.botAvatarUrl}
            isDark={visualContext.isDark}
          />,
        );
        break;
      case "loading":
        if (activeLoadingIdx === window.index) {
          pendingLoading = (
            <LoadingView
              key={window.index}
              state={window.state}
              index={window.index}
              isDark={visualContext.isDark}
            />
          );
        }
        break;
      case "thinking":
        if (activeThinkingIdx === window.index) {
          pendingThinking = <ThinkingView key={window.index} state={window.state} isDark={visualContext.isDark} />;
        }
        break;
      case "todo_data":
      case "image":
      case "pause":
        break;
    }
  }
  flushToolCalls();
  // Loading / thinking always trail at the very bottom, after any
  // already-rendered bot bubble + follow-up actions.
  if (pendingThinking) out.push(pendingThinking);
  if (pendingLoading) out.push(pendingLoading);
  return out;
}

type ScenarioToolEntry = ToolCallsState["entries"][number]["data"][number];

type GaiaVisualContext = {
  userAvatarUrl?: string;
  botAvatarUrl?: string;
  isDark: boolean;
};

const avatarStyle = (src: string | undefined, fallback: string): React.CSSProperties => ({
  width: 26,
  height: 26,
  borderRadius: 999,
  flex: "0 0 auto",
  background: src ? `url("${src}") center / cover` : fallback,
});

const bubbleBase = (isDark: boolean): React.CSSProperties => ({
  maxWidth: "76%",
  borderRadius: 18,
  padding: "10px 14px",
  fontSize: 15,
  lineHeight: 1.35,
  boxShadow: isDark ? "0 12px 30px rgba(0,0,0,0.25)" : "0 12px 30px rgba(15,23,42,0.08)",
});

function UserMessageView({
  state,
  progress,
  index,
  userAvatarUrl,
}: {
  state: UserMessageState;
  progress: number;
  index: number;
  userAvatarUrl?: string;
}) {
  const text = progressiveText(state.text, progress);
  if (!text) return null;
  return (
    <div key={`user-${index}`} style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}>
      <div
        style={{
          ...bubbleBase(false),
          color: "#ffffff",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          borderBottomRightRadius: 6,
        }}
      >
        {text}
      </div>
      <div style={avatarStyle(userAvatarUrl, "linear-gradient(135deg, #60a5fa, #a78bfa)")} />
    </div>
  );
}

function BotMessageView({
  state,
  progress,
  index,
  botAvatarUrl,
  isDark,
}: {
  state: BotMessageState;
  progress: number;
  index: number;
  botAvatarUrl?: string;
  isDark: boolean;
}) {
  const text = progressiveText(state.text, progress);
  if (!text) return null;
  return (
    <div key={`bot-${index}`} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
      <div style={avatarStyle(botAvatarUrl, "linear-gradient(135deg, #111827, #3b82f6)")} />
      <div
        style={{
          ...bubbleBase(isDark),
          color: isDark ? "#f8fafc" : "#111827",
          background: isDark ? "rgba(255,255,255,0.09)" : "#f8fafc",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
          borderBottomLeftRadius: 6,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function LoadingView({ state, index, isDark }: { state: LoadingState; index: number; isDark: boolean }) {
  return (
    <div
      key={`loading-${index}`}
      style={{
        marginLeft: 35,
        alignSelf: "flex-start",
        borderRadius: 999,
        padding: "7px 12px",
        fontSize: 13,
        color: isDark ? "#cbd5e1" : "#475569",
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)",
      }}
    >
      {state.text || "Working..."}
    </div>
  );
}

function ThinkingView({ state, isDark }: { state: ThinkingState; isDark: boolean }) {
  return (
    <div
      style={{
        marginLeft: 35,
        alignSelf: "flex-start",
        borderRadius: 14,
        padding: "8px 12px",
        fontSize: 13,
        color: isDark ? "#dbeafe" : "#1d4ed8",
        background: isDark ? "rgba(59,130,246,0.16)" : "rgba(59,130,246,0.1)",
      }}
    >
      {state.content || "Thinking..."}
    </div>
  );
}

function ToolCallsView({
  entries,
  toolCallsExpanded,
  isDark,
}: {
  entries: ScenarioToolEntry[];
  toolCallsExpanded: boolean;
  isDark: boolean;
}) {
  const visibleEntries = toolCallsExpanded ? entries : entries.slice(0, 1);
  return (
    <div
      style={{
        marginLeft: 35,
        borderRadius: 16,
        padding: 12,
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
      }}
    >
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, opacity: 0.72 }}>
        Used {entries.length} tool{entries.length === 1 ? "" : "s"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {visibleEntries.map((entry, index) => (
          <div key={`${entry.tool_name}-${index}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#60a5fa",
                boxShadow: "0 0 18px rgba(96,165,250,0.75)",
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.9 }}>
              {entry.tool_name || resolveCategoryKey(entry.tool_category) || "tool"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
