import { useEffect, useRef, useState } from "react";
import {
  Check,
  Mic,
  Minimize2,
  Phone,
  PhoneOff,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import HelpMarkdown from "./HelpMarkdown";
import BrandMark from "./BrandMark";
import { startEcoLiveVoice } from "../../hooks/useEcoLiveVoice";
import { dispatchAgentDataRefresh } from "../../utils/agentDataRefresh";
import { triggerAgentFileDownload } from "../../utils/agentDownload";
import "./HelpChatWidget.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5057";
const FAB_SIZE = 60;
const FAB_POS_KEY = "ackit-help-fab-pos";
const DRAG_THRESHOLD = 6;
const VOICE_BAR_COUNT = 24;

function pickRecorderMime() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const t of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported?.(t)
    ) {
      return t;
    }
  }
  return "";
}

const SERVICE_UNAVAILABLE =
  "Currently the service is unavailable. Sorry for the inconvenience — please try again.";

function clientTimezonePayload() {
  return {
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

const WELCOME =
  "Hi! I'm Kit — your AC-Kit assistant. Ask about your devices, venues, team members, or how features work.";

function defaultFabPos() {
  const margin = 20;
  const mobileExtra =
    typeof window !== "undefined" && window.innerWidth <= 640 ? 56 : 0;
  return {
    x: window.innerWidth - FAB_SIZE - margin,
    y: window.innerHeight - FAB_SIZE - margin - mobileExtra,
  };
}

function clampFabPos(x, y) {
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - FAB_SIZE - pad);
  const maxY = Math.max(pad, window.innerHeight - FAB_SIZE - pad);
  return {
    x: Math.min(Math.max(pad, x), maxX),
    y: Math.min(Math.max(pad, y), maxY),
  };
}

function loadFabPos() {
  try {
    const raw = localStorage.getItem(FAB_POS_KEY);
    if (!raw) return defaultFabPos();
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed?.x) || !Number.isFinite(parsed?.y)) {
      return defaultFabPos();
    }
    return clampFabPos(parsed.x, parsed.y);
  } catch {
    return defaultFabPos();
  }
}

/** Only one Kit FAB + live voice session in the whole app. */
let helpWidgetMounted = false;

/**
 * Fiverr-style floating help chat.
 * FAB is draggable; panel always opens fixed bottom-right (approach A).
 */
export default function HelpChatWidget() {
  const [isPrimary] = useState(() => {
    if (typeof window === "undefined") return true;
    if (helpWidgetMounted) return false;
    helpWidgetMounted = true;
    return true;
  });
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { id: "welcome", role: "bot", text: WELCOME },
  ]);
  const [fabPos, setFabPos] = useState(() =>
    typeof window !== "undefined" ? loadFabPos() : { x: 0, y: 0 }
  );
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLevels, setVoiceLevels] = useState(() =>
    Array(VOICE_BAR_COUNT).fill(0)
  );
  const [micError, setMicError] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [liveVoice, setLiveVoice] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const [liveStarting, setLiveStarting] = useState(false);
  const [livePhase, setLivePhase] = useState("idle"); // idle|connecting|ready|active|speaking|needs_permission
  const [fabMicLevel, setFabMicLevel] = useState(0);
  const [liveConversationActive, setLiveConversationActive] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const dragRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const confirmLockRef = useRef(false);
  const liveSessionRef = useRef(null);
  const liveStartingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy, liveStatus]);

  const stopLiveVoice = () => {
    try {
      liveSessionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    liveSessionRef.current = null;
    liveStartingRef.current = false;
    setLiveVoice(false);
    setLiveStarting(false);
    setLiveStatus("");
    setLivePhase("idle");
    setFabMicLevel(0);
    setLiveConversationActive(false);
  };

  const appendLiveChatMessage = ({ role, text }) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `live-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: role === "user" ? "user" : "bot",
        text: trimmed,
        live: true,
      },
    ]);
  };

  const handleAgentRefresh = ({ scopes, hints } = {}) => {
    dispatchAgentDataRefresh(null, null, { scopes, hints });
  };

  const handleAgentDownload = ({ filename, content, mimeType } = {}) => {
    triggerAgentFileDownload({ filename, content, mimeType });
  };

  const startAlwaysOnLiveVoice = async ({ fromUserGesture = false } = {}) => {
    if (liveSessionRef.current || liveStartingRef.current) return false;
    if (!localStorage.getItem("iotify_token")) {
      setLivePhase("idle");
      setLiveStatus("");
      return false;
    }
    if (busy || listening || transcribing) {
      setLivePhase((p) => (p === "connecting" ? "idle" : p));
      return false;
    }

    stopVoiceSession();
    setMicError("");
    liveStartingRef.current = true;
    setLiveStarting(true);
    setLivePhase("connecting");
    setLiveStatus("Connecting…");

    try {
      const session = await startEcoLiveVoice({
        requireWakeWord: true,
        autoMode: true,
        onChatMessage: appendLiveChatMessage,
        onDataRefresh: handleAgentRefresh,
        onFileDownload: handleAgentDownload,
        onStatus: (s) => setLiveStatus(s || ""),
        onPhase: (p) => {
          setLivePhase(p || "ready");
          setLiveConversationActive(p === "active" || p === "speaking");
        },
        onMicLevel: (level) => setFabMicLevel(Number(level) || 0),
        onError: (msg) => {
          const m = String(msg || "");
          if (/permission|not allowed|denied/i.test(m) || !fromUserGesture) {
            setLivePhase("needs_permission");
            setMicError("Tap the Kit icon to enable microphone for Hey Kit.");
          } else {
            setMicError(m || SERVICE_UNAVAILABLE);
            setLivePhase("idle");
          }
          liveSessionRef.current = null;
          setLiveVoice(false);
          liveStartingRef.current = false;
          setLiveStarting(false);
          setLiveConversationActive(false);
        },
        onEnded: () => {
          liveSessionRef.current = null;
          setLiveVoice(false);
          liveStartingRef.current = false;
          setLiveStarting(false);
          setLiveStatus("");
          setLivePhase("idle");
          setFabMicLevel(0);
          setLiveConversationActive(false);
        },
      });
      liveSessionRef.current = session;
      setLiveVoice(true);
      liveStartingRef.current = false;
      setLiveStarting(false);
      setLivePhase((p) => (p === "connecting" ? "ready" : p));
      setMicError("");
      return true;
    } catch (err) {
      console.error("[HelpChat] live voice", err?.message || err);
      const m = String(err?.message || "");
      liveSessionRef.current = null;
      setLiveVoice(false);
      liveStartingRef.current = false;
      setLiveStarting(false);
      setLiveConversationActive(false);
      if (/permission|not allowed|denied|secure/i.test(m) || !fromUserGesture) {
        setLivePhase("needs_permission");
        setMicError(
          "Tap the Kit icon once to enable always-on voice (Hey Kit)."
        );
      } else {
        setLivePhase("idle");
        setMicError(m || SERVICE_UNAVAILABLE);
      }
      return false;
    }
  };

  // Release singleton slot when this primary instance unmounts (Strict Mode / route change).
  useEffect(() => {
    if (!isPrimary) return undefined;
    return () => {
      helpWidgetMounted = false;
    };
  }, [isPrimary]);

  // Always-on: connect on login/reload. Avoid stuck orange ring (React Strict Mode
  // remount used to cancel the timer after setting "connecting" permanently).
  useEffect(() => {
    if (!isPrimary) return undefined;
    if (!localStorage.getItem("iotify_token")) return undefined;
    let cancelled = false;

    setLivePhase("connecting");
    setLiveStatus("Connecting…");

    const startTimer = setTimeout(() => {
      if (cancelled) return;
      startAlwaysOnLiveVoice({ fromUserGesture: false });
    }, 350);

    // Safety: never leave orange spinner spinning forever
    const safetyTimer = setTimeout(() => {
      if (cancelled || liveSessionRef.current) return;
      liveStartingRef.current = false;
      setLiveStarting(false);
      setLivePhase((p) => {
        if (p !== "connecting") return p;
        return "needs_permission";
      });
      setLiveStatus("");
      setMicError("Tap the Kit icon once to enable always-on voice (Hey Kit).");
    }, 20000);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearTimeout(safetyTimer);
      stopLiveVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrimary]);

  useEffect(() => {
    if (open && !closing) {
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [open, closing]);

  useEffect(() => {
    const onResize = () => {
      setFabPos((prev) => clampFabPos(prev.x, prev.y));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const stopVisualizer = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        /* ignore */
      }
      audioCtxRef.current = null;
    }
    setVoiceLevels(Array(VOICE_BAR_COUNT).fill(0));
  };

  const stopMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const discardRecorder = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.ondataavailable = null;
        rec.onstop = null;
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  const stopRecorderAndGetBlob = () =>
    new Promise((resolve) => {
      const rec = mediaRecorderRef.current;
      if (!rec || rec.state === "inactive") {
        mediaRecorderRef.current = null;
        resolve(null);
        return;
      }
      rec.onstop = () => {
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        resolve(blob.size > 0 ? blob : null);
      };
      try {
        rec.stop();
      } catch {
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        resolve(null);
      }
    });

  const stopVoiceSession = () => {
    confirmLockRef.current = false;
    discardRecorder();
    stopVisualizer();
    stopMediaTracks();
    setListening(false);
    setTranscribing(false);
  };

  useEffect(
    () => () => {
      stopVoiceSession();
      try {
        liveSessionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
      liveSessionRef.current = null;
    },
    []
  );

  const tickVoiceLevels = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    // Quiet room ≈ 0; loud speech pushes toward 1
    const level = Math.min(1, Math.max(0, (rms - 0.015) * 9));

    const now = performance.now();
    const next = Array.from({ length: VOICE_BAR_COUNT }, (_, i) => {
      const t = i / (VOICE_BAR_COUNT - 1);
      const envelope = Math.sin(Math.PI * t); // taller in the middle
      const wobble =
        0.55 + 0.45 * Math.sin(now / 95 + i * 0.55) * (0.35 + level);
      return level * envelope * wobble;
    });
    setVoiceLevels(next);
    rafRef.current = requestAnimationFrame(tickVoiceLevels);
  };

  const startListening = async () => {
    if (busy || listening || transcribing || liveVoice || liveStarting) return;
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Same stream → two jobs: (1) live waves (2) record file for STT
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);
      analyserRef.current = analyser;

      chunksRef.current = [];
      const mime = pickRecorderMime();
      const rec = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      rec.start(250);

      setListening(true);
      rafRef.current = requestAnimationFrame(tickVoiceLevels);
    } catch (err) {
      console.error("[HelpChat] mic", err?.message || err);
      stopVoiceSession();
      setMicError("Microphone access is needed for voice input.");
    }
  };

  const cancelListening = () => {
    if (transcribing) return;
    stopVoiceSession();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmListening = async () => {
    if (confirmLockRef.current || transcribing || !listening) return;
    confirmLockRef.current = true;
    setMicError("");
    setTranscribing(true);
    stopVisualizer();

    const blob = await stopRecorderAndGetBlob();
    stopMediaTracks();
    setListening(false);

    if (!blob || blob.size < 250) {
      confirmLockRef.current = false;
      setTranscribing(false);
      setMicError("Could not hear anything clearly. Please try again.");
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    try {
      const form = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("audio", blob, `voice.${ext}`);

      const token = localStorage.getItem("iotify_token");
      const res = await fetch(`${API_BASE}/api/help/transcribe`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || SERVICE_UNAVAILABLE);
      }

      const text = String(data.text || "").trim();
      setTranscribing(false);
      confirmLockRef.current = false;

      if (!text) {
        setMicError(
          data.message ||
            "Could not hear anything clearly. Please try again."
        );
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      setInput(text);
      // Auto-send like Fiverr — voice becomes a normal chat message
      await sendMessage(text);
    } catch (err) {
      console.error("[HelpChat] transcribe", err?.message || err);
      confirmLockRef.current = false;
      setTranscribing(false);
      setMicError(SERVICE_UNAVAILABLE);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const openPanel = () => {
    setClosing(false);
    setOpen(true);
  };

  const closePanel = () => {
    // Minimize only — keep live speech-to-speech session alive
    stopVoiceSession();
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  };

  const resetChat = () => {
    stopVoiceSession();
    stopLiveVoice();
    setMessages([{ id: `welcome-${Date.now()}`, role: "bot", text: WELCOME }]);
    setInput("");
    setMicError("");
  };

  const toggleLiveVoice = async () => {
    if (liveVoice || liveStarting) {
      stopLiveVoice();
      return;
    }
    await startAlwaysOnLiveVoice({ fromUserGesture: true });
  };

  const appendBotToken = (botId, token) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === botId ? { ...m, text: (m.text || "") + token } : m
      )
    );
  };

  const onFabPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: fabPos.x,
      origY: fabPos.y,
      moved: false,
    };
    setDragging(true);
  };

  const onFabPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    setFabPos(clampFabPos(d.origX + dx, d.origY + dy));
  };

  const endFabPointer = (e) => {
    const d = dragRef.current;
    if (!d || (e.pointerId != null && d.pointerId !== e.pointerId)) return;
    const wasDrag = d.moved;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (wasDrag) {
      setFabPos((prev) => {
        const next = clampFabPos(prev.x, prev.y);
        try {
          localStorage.setItem(FAB_POS_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      return;
    }
    // First tap may be needed to grant mic for always-on Hey Kit
    if (livePhase === "needs_permission" || livePhase === "idle") {
      startAlwaysOnLiveVoice({ fromUserGesture: true });
    }
    openPanel();
  };

  const sendMessage = async (overrideText) => {
    const text = String(overrideText ?? input).trim();
    // Text chat stays available while Kit is only waiting for "Hey Kit"
    if (!text || busy || liveConversationActive) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    const historyPayload = [...messages, userMsg]
      .filter((m) => m.role === "user" || m.role === "bot")
      .filter((m) => m.id !== "welcome" && !String(m.id).startsWith("welcome-"))
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));

    const botId = `b-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: botId, role: "bot", text: "", streaming: true },
    ]);
    setInput("");
    setBusy(true);

    try {
      const token = localStorage.getItem("iotify_token");
      const res = await fetch(`${API_BASE}/api/help/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          ...clientTimezonePayload(),
        }),
      });

      if (!res.ok) {
        throw new Error(SERVICE_UNAVAILABLE);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error(SERVICE_UNAVAILABLE);

      const decoder = new TextDecoder();
      let buffer = "";
      let gotToken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));
          if (!line) continue;

          let event;
          try {
            event = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }

          if (event.type === "token" && event.text) {
            gotToken = true;
            appendBotToken(botId, event.text);
          } else if (event.type === "refresh" && event.scopes?.length) {
            handleAgentRefresh({
              scopes: event.scopes,
              hints: event.hints,
            });
          } else if (event.type === "download" && event.content) {
            handleAgentDownload(event);
          } else if (event.type === "error") {
            throw new Error(SERVICE_UNAVAILABLE);
          }
        }
      }

      // Last SSE frame (refresh/done) can sit in the leftover buffer.
      if (buffer.trim()) {
        const line = buffer
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.startsWith("data:"));
        if (line) {
          try {
            const event = JSON.parse(line.slice(5).trim());
            if (event.type === "token" && event.text) {
              gotToken = true;
              appendBotToken(botId, event.text);
            } else if (event.type === "refresh" && event.scopes?.length) {
              handleAgentRefresh({
                scopes: event.scopes,
                hints: event.hints,
              });
            } else if (event.type === "download" && event.content) {
              handleAgentDownload(event);
            }
          } catch {
            /* ignore incomplete frame */
          }
        }
      }

      if (!gotToken) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? {
                  ...m,
                  text: SERVICE_UNAVAILABLE,
                  streaming: false,
                }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, streaming: false } : m
          )
        );
      }
    } catch (err) {
      console.error("[HelpChat]", err?.message || err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                text: SERVICE_UNAVAILABLE,
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isPrimary) return null;

  return (
    <div className="eco-help-root" aria-live="polite">
      {(open || closing) && (
        <div
          className={`eco-help-panel ${closing ? "eco-help-panel--out" : "eco-help-panel--in"}`}
          role="dialog"
          aria-label="Kit Assistant"
        >
          <header className="eco-help-header">
            <div className="eco-help-header-left">
              <span className="eco-help-title">Kit Assistant</span>
              <BrandMark alt="" className="eco-help-header-logo" />
            </div>
            <div className="eco-help-header-actions">
              <button
                type="button"
                className={`eco-help-icon-btn ${
                  liveVoice || liveStarting ? "eco-help-icon-btn--live" : ""
                }`}
                title={
                  liveVoice || liveStarting
                    ? "Disconnect Kit always-on voice"
                    : "Connect Kit always-on voice"
                }
                aria-label={
                  liveVoice || liveStarting
                    ? "Disconnect Kit voice"
                    : "Connect Kit voice"
                }
                onClick={toggleLiveVoice}
                disabled={busy || listening || transcribing}
              >
                {liveVoice || liveStarting ? (
                  <PhoneOff size={16} strokeWidth={2} />
                ) : (
                  <Phone size={16} strokeWidth={2} />
                )}
              </button>
              <button
                type="button"
                className="eco-help-icon-btn"
                title="Reset chat"
                onClick={resetChat}
              >
                <RotateCcw size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="eco-help-icon-btn"
                title="Minimize"
                onClick={closePanel}
              >
                <Minimize2 size={16} strokeWidth={2} />
              </button>
            </div>
          </header>

          {liveVoice || liveStarting || livePhase === "needs_permission" ? (
            <div className="eco-help-live-bar" role="status">
              <span
                className={`eco-help-live-dot ${
                  livePhase === "connecting" ? "eco-help-live-dot--pulse" : ""
                }`}
                aria-hidden
              />
              <span className="eco-help-live-text">
                {livePhase === "connecting"
                  ? "Connecting Kit voice…"
                  : livePhase === "needs_permission"
                    ? "Tap Kit icon to enable mic"
                    : livePhase === "speaking"
                      ? "Kit is speaking…"
                      : livePhase === "active"
                        ? "Listening…"
                        : liveStatus || "Say Hey Kit"}
              </span>
              {liveVoice ? (
                <button
                  type="button"
                  className="eco-help-live-end"
                  onClick={stopLiveVoice}
                >
                  Disconnect
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="eco-help-messages" ref={listRef}>
            {messages.map((m) =>
              m.role === "bot" ? (
                <div key={m.id} className="eco-help-row eco-help-row--bot">
                  <BrandMark
                    alt=""
                    className="eco-help-avatar"
                  />
                  <div
                    className={`eco-help-bubble eco-help-bubble--bot ${
                      m.streaming ? "eco-help-bubble--streaming" : ""
                    }`}
                  >
                    {m.text?.trim() ? (
                      <HelpMarkdown text={m.text} />
                    ) : m.streaming ? (
                      <div className="eco-help-typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                    {m.streaming && m.text?.trim() ? (
                      <span className="eco-help-caret" aria-hidden />
                    ) : null}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="eco-help-row eco-help-row--user">
                  <div className="eco-help-bubble eco-help-bubble--user">
                    {m.text}
                  </div>
                </div>
              )
            )}
          </div>

          <footer className="eco-help-footer">
            {liveConversationActive ? (
              <div className="eco-help-live-footer" role="status">
                <p className="eco-help-live-hint">
                  Kit is in a voice conversation — say goodbye to sleep, or{" "}
                  <strong>Disconnect</strong>. Text chat unlocks after that.
                </p>
                <button
                  type="button"
                  className="eco-help-live-end-btn"
                  onClick={stopLiveVoice}
                >
                  <PhoneOff size={16} strokeWidth={2.25} />
                  Disconnect Kit voice
                </button>
              </div>
            ) : listening || transcribing ? (
              <div
                className="eco-help-voice-wrap"
                role="status"
                aria-label={transcribing ? "Transcribing" : "Listening"}
              >
                <button
                  type="button"
                  className="eco-help-voice-cancel"
                  title="Cancel"
                  aria-label="Cancel voice input"
                  onClick={cancelListening}
                  disabled={transcribing}
                >
                  <X size={16} strokeWidth={2.5} />
                </button>

                <div className="eco-help-voice-viz" aria-hidden>
                  {voiceLevels.map((level, i) => (
                    <span
                      key={i}
                      className="eco-help-voice-bar"
                      style={{
                        transform: `scaleY(${Math.max(0.08, level)})`,
                      }}
                    />
                  ))}
                </div>

                <span className="eco-help-voice-label">
                  {transcribing ? "Transcribing…" : "Listening"}
                </span>

                <button
                  type="button"
                  className="eco-help-voice-confirm"
                  title="Done"
                  aria-label="Confirm voice input"
                  onClick={confirmListening}
                  disabled={transcribing}
                >
                  <Check size={16} strokeWidth={2.75} />
                </button>
              </div>
            ) : (
              <div className="eco-help-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  className="eco-help-input"
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (micError) setMicError("");
                  }}
                  onKeyDown={onKeyDown}
                  disabled={busy}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="eco-help-mic"
                  title={
                    liveVoice
                      ? "Mic STT paused while Kit voice is connected — say Hey Kit"
                      : "Voice input"
                  }
                  aria-label="Start voice input"
                  onClick={startListening}
                  disabled={busy || liveVoice}
                >
                  <Mic size={18} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="eco-help-send"
                  title="Send"
                  onClick={() => sendMessage()}
                  disabled={busy || !input.trim()}
                >
                  <Send size={18} strokeWidth={2} />
                </button>
              </div>
            )}
            {micError ? (
              <p className="eco-help-mic-error">{micError}</p>
            ) : (
              <p className="eco-help-powered">Powered by Kit Assistant</p>
            )}
          </footer>
        </div>
      )}

      {!open && !closing && (
        <button
          type="button"
          className={[
            "eco-help-fab",
            dragging ? "eco-help-fab--dragging" : "eco-help-fab--enter",
            livePhase === "connecting" ? "eco-help-fab--connecting" : "",
            livePhase === "ready" ? "eco-help-fab--ready" : "",
            livePhase === "active" || livePhase === "speaking"
              ? "eco-help-fab--live"
              : "",
            livePhase === "speaking" ? "eco-help-fab--speaking" : "",
            livePhase === "needs_permission" ? "eco-help-fab--needs-mic" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            left: fabPos.x,
            top: fabPos.y,
            ["--eco-fab-level"]: String(Math.min(1, fabMicLevel || 0)),
          }}
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={endFabPointer}
          onPointerCancel={endFabPointer}
          aria-label={
            livePhase === "needs_permission"
              ? "Enable Kit voice microphone"
              : "Open Kit assistant (drag to move)"
          }
          title={
            livePhase === "connecting"
              ? "Connecting Kit voice…"
              : livePhase === "ready"
                ? "Say Hey Kit — or tap to open chat"
                : livePhase === "active" || livePhase === "speaking"
                  ? "Kit is listening — tap to open chat"
                  : livePhase === "needs_permission"
                    ? "Tap to enable microphone for Hey Kit"
                    : "Kit Assistant — drag to move"
          }
        >
          <span className="eco-help-fab-wave eco-help-fab-wave--a" aria-hidden />
          <span className="eco-help-fab-wave eco-help-fab-wave--b" aria-hidden />
          <span className="eco-help-fab-wave eco-help-fab-wave--c" aria-hidden />
          <span className="eco-help-fab-spinner" aria-hidden />
          <span className="eco-help-fab-ring" />
          <span className="eco-help-fab-inner">
            <BrandMark
              alt="Kit"
              className="eco-help-fab-logo"
            />
          </span>
        </button>
      )}
    </div>
  );
}
