/**
 * Kit Live Voice — Gemini Live (speech-to-speech).
 * Separate from mic → STT → /help/chat/stream.
 * OpenAI WebRTC kept as fallback when session.provider === "openai".
 */
import { GoogleGenAI, Modality } from "@google/genai";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5057";
const END_LIVE_SESSION_TOOL = "endLiveVoiceSession";
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

/** Simple browser console logs for voice → text debugging (DevTools). */
function voiceLog(...args) {
  console.log("[KitVoice]", ...args);
}

function looksLikeWakePhrase(text) {
  const t = String(text || "")
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return false;

  // Islamic greeting — Kit NOT required.
  // Covers STT variants: Asalam o Alaikum, Salam Alaikum, Assalamualaikum,
  // salaam, asalam, assalam, salam alekum, etc. (exact full phrase not required).
  const hasSalam =
    /\b(a+s+)?s+a+l+a+a*m\b/.test(t) ||
    /ass?a?l+a+m/.test(t) ||
    /sala+m\s*(?:[ou]|oo|wa)?\s*(alaikum|alikum|alekum|alaykum|ualaikum)/.test(
      t
    ) ||
    /ass?a?l+a+m\s*(?:[ou]|oo|wa)?\s*(alaikum|alikum|alekum|alaykum)/.test(t) ||
    /ass?a?lamualaikum|assalamu\s*alaikum|asalamualaikum/.test(t);

  if (hasSalam) return true;

  // Kit wake — primary: Kit / Hey Kit / Hi Kit (alone or with hey/hi/hello/…).
  if (/\bkit\b/.test(t)) return true;
  // Keep Eco as secondary wake for familiarity.
  if (/\beco\b/.test(t)) return true;

  return false;
}

function looksLikeEndCallIntent(text) {
  const t = String(text || "").toLowerCase();
  if (!t) return false;
  return (
    /\b(end|close|stop|hang\s*up)\b.{0,24}\b(call|session|conversation)\b/.test(t) ||
    /\b(call|session)\b.{0,16}\b(end|band|khatam)\b/.test(t) ||
    /\b(you can end|please end|go ahead and end)\b/.test(t) ||
    /\b(that'?s all|that is all|i'?m done|im done|nothing else)\b/.test(t) ||
    /\b(goodbye|good bye|bye bye)\b/.test(t) ||
    /\bthank(s| you).{0,80}\b(your time|for your time)\b/.test(t) ||
    /\b(shukriya|shukria).{0,40}\b(time|waqt|band|end|khatam)\b/.test(t) ||
    /\b(bas itna|bas itni|ab band|call band|session band|khatam karo)\b/.test(t)
  );
}
function playbackTailMs(spokenText) {
  const words = String(spokenText || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.min(14000, Math.max(3500, 2800 + words * 120));
}
function authHeaders() {
  const token = localStorage.getItem("iotify_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
function clientTimezonePayload() {
  return {
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
function parseToolArgs(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function notifyDataRefresh(opts, apiData) {
  const scopes = apiData?.refreshScopes;
  if (!scopes?.length) return;
  opts.onDataRefresh?.({
    scopes,
    hints: apiData?.refreshHints,
  });
}
function notifyFileDownload(opts, apiData) {
  const download = apiData?.download;
  if (!download?.content) return;
  opts.onFileDownload?.(download);
}
function floatTo16BitPCM(float32Array) {
  const out = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i += 1) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
function createPcmPlayer(sampleRate = OUTPUT_SAMPLE_RATE) {
  const ctx = new AudioContext({ sampleRate });
  let nextTime = 0;
  let playing = false;
  const enqueue = async (base64Pcm) => {
    if (!base64Pcm) return;
    if (ctx.state === "suspended") await ctx.resume();
    const int16 = new Int16Array(base64ToArrayBuffer(base64Pcm));
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i += 1) {
      float32[i] = int16[i] / 0x8000;
    }
    const buffer = ctx.createBuffer(1, float32.length, sampleRate);
    buffer.copyToChannel(float32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    const now = ctx.currentTime;
    if (nextTime < now) nextTime = now + 0.02;
    src.start(nextTime);
    nextTime += buffer.duration;
    playing = true;
    src.onended = () => {
      if (ctx.currentTime >= nextTime - 0.05) playing = false;
    };
  };
  const stop = () => {
    try {
      ctx.close();
    } catch {
      /* ignore */
    }
    nextTime = 0;
    playing = false;
  };
  const isPlaying = () => playing || ctx.currentTime < nextTime;
  return { enqueue, stop, isPlaying, ctx };
}
/**
 * @param {object} opts
 * @param {(msg: { role: 'user'|'bot', text: string, live?: boolean }) => void} opts.onChatMessage
 * @param {(status: string) => void} [opts.onStatus]
 * @param {(err: string) => void} [opts.onError]
 * @param {() => void} [opts.onEnded]
 * @param {(phase: 'connecting'|'ready'|'active'|'speaking') => void} [opts.onPhase]
 * @param {(level: number) => void} [opts.onMicLevel]
 * @param {boolean} [opts.requireWakeWord]
 * @param {boolean} [opts.autoMode]
 */
export async function startEcoLiveVoice(opts = {}) {
  const { onStatus } = opts;
  voiceLog("startEcoLiveVoice…");
  onStatus?.("Connecting…");
  opts.onPhase?.("connecting");
  const sessionRes = await fetch(`${API_BASE}/api/help/realtime/session`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: "{}",
  });
  const sessionData = await sessionRes.json().catch(() => ({}));
  if (!sessionRes.ok || !sessionData.success || !sessionData.clientSecret) {
    throw new Error(sessionData.message || "Could not start live voice session.");
  }
  voiceLog("session OK", {
    provider: sessionData.provider,
    model: sessionData.model,
    requireWakeWord: Boolean(opts.requireWakeWord),
  });
  if (sessionData.provider === "openai") {
    return startOpenAILiveVoice(sessionData, opts);
  }
  return startGeminiLiveVoice(sessionData, opts);
}
async function startGeminiLiveVoice(sessionData, opts) {
  const {
    onChatMessage,
    onStatus,
    onError,
    onEnded,
    onPhase,
    onMicLevel,
    requireWakeWord = false,
    autoMode = false,
  } = opts;
  const ephemeralKey = sessionData.clientSecret;
  const model = sessionData.model;
  const ai = new GoogleGenAI({
    apiKey: ephemeralKey,
    httpOptions: { apiVersion: "v1alpha" },
  });
  let player = createPcmPlayer(OUTPUT_SAMPLE_RATE);
  let liveSession = null;
  let mediaStream = null;
  let audioCtx = null;
  let processor = null;
  let source = null;
  let silentGain = null;
  let closed = false;
  let lastUserTranscript = "";
  let lastAssistantSpoken = "";
  let userBuf = "";
  let assistantBuf = "";
  let pendingEnd = false;
  let endStopTimer = null;
  let endHardCapTimer = null;
  let awakened = !requireWakeWord;
  const setPhase = (p) => onPhase?.(p);
  const clearEndTimers = () => {
    if (endStopTimer != null) clearTimeout(endStopTimer);
    if (endHardCapTimer != null) clearTimeout(endHardCapTimer);
    endStopTimer = null;
    endHardCapTimer = null;
  };
  const sleepSession = () => {
    if (closed) return;
    pendingEnd = false;
    awakened = !requireWakeWord ? true : false;
    clearEndTimers();
    assistantBuf = "";
    userBuf = "";
    try {
      player.stop();
    } catch {
      /* ignore */
    }
    player = createPcmPlayer(OUTPUT_SAMPLE_RATE);
    setPhase(requireWakeWord ? "ready" : "active");
    onStatus?.(requireWakeWord ? "Say Hey Kit" : "Listening…");
    onMicLevel?.(0);
  };
  const stop = () => {
    if (closed) return;
    closed = true;
    clearEndTimers();
    try {
      processor?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      source?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      audioCtx?.close();
    } catch {
      /* ignore */
    }
    mediaStream?.getTracks?.().forEach((t) => t.stop());
    try {
      liveSession?.close?.();
    } catch {
      /* ignore */
    }
    player.stop();
    onMicLevel?.(0);
    onStatus?.("");
    onEnded?.();
  };
  const armHardCap = () => {
    if (endHardCapTimer != null) return;
    endHardCapTimer = setTimeout(() => {
      if (autoMode) sleepSession();
      else stop();
    }, 20000);
  };
  const scheduleStopAfterPlayback = (spoken) => {
    if (closed || !pendingEnd) return;
    onStatus?.("Goodbye — finishing…");
    if (endStopTimer != null) clearTimeout(endStopTimer);
    endStopTimer = setTimeout(() => {
      if (autoMode) sleepSession();
      else stop();
    }, playbackTailMs(spoken || lastAssistantSpoken));
    armHardCap();
  };
  const markPendingEnd = (statusText) => {
    if (closed) return;
    pendingEnd = true;
    onStatus?.(statusText || "Wrapping up…");
    armHardCap();
  };
  const formatAndPushBot = async (spoken) => {
    const text = String(spoken || "").trim();
    if (!text) return;
    try {
      const res = await fetch(`${API_BASE}/api/help/realtime/format-chat`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({
          spokenText: text,
          userText: lastUserTranscript,
        }),
      });
      const data = await res.json().catch(() => ({}));
      const chatText =
        res.ok && data.success && data.text ? String(data.text).trim() : text;
      onChatMessage?.({ role: "bot", text: chatText, live: true });
    } catch {
      onChatMessage?.({ role: "bot", text, live: true });
    }
  };
  const runTools = async (functionCalls = []) => {
    const responses = [];
    let sawEnd = false;
    for (const fc of functionCalls) {
      const name = fc.name;
      const args = parseToolArgs(fc.args);
      if (name === END_LIVE_SESSION_TOOL) {
        sawEnd = true;
        responses.push({
          id: fc.id,
          name,
          response: {
            ok: true,
            endSession: true,
            message: "Client will end after goodbye audio finishes.",
          },
        });
        continue;
      }
      onStatus?.("Looking that up…");
      try {
        const res = await fetch(`${API_BASE}/api/help/realtime/tool`, {
          method: "POST",
          headers: authHeaders(),
          credentials: "include",
          body: JSON.stringify({
            name,
            arguments: args,
            ...clientTimezonePayload(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        const result = data.result ?? { error: data.message || "Tool failed" };
        notifyDataRefresh(opts, data);
        notifyFileDownload(opts, data);
        responses.push({
          id: fc.id,
          name,
          response: result && typeof result === "object" ? result : { result },
        });
      } catch (err) {
        responses.push({
          id: fc.id,
          name,
          response: { error: err?.message || "Tool failed" },
        });
      }
    }
    if (responses.length && liveSession) {
      liveSession.sendToolResponse({ functionResponses: responses });
    }
    if (sawEnd) {
      markPendingEnd("Ending call…");
      if (lastAssistantSpoken) scheduleStopAfterPlayback(lastAssistantSpoken);
    }
  };
  const handleUserUtterance = (t) => {
    if (!t) return;
    voiceLog("user utterance (final):", t);
    if (requireWakeWord && !awakened) {
      const wake = looksLikeWakePhrase(t);
      voiceLog("wake check:", { text: t, matched: wake, awakened });
      if (wake) {
        awakened = true;
        setPhase("active");
        onStatus?.("Listening…");
        lastUserTranscript = t;
        onChatMessage?.({ role: "user", text: t, live: true });
        voiceLog("WAKE OK → conversation active");
      } else {
        voiceLog("wake NOT matched — ignored (waiting for Hey Kit)");
      }
      // Before wake: ignore other speech in the chat UI
      return;
    }
    lastUserTranscript = t;
    onChatMessage?.({ role: "user", text: t, live: true });
    if (looksLikeEndCallIntent(t)) markPendingEnd("Wrapping up…");
  };
  const handleMessage = async (message) => {
    if (closed || !message) return;
    // Raw message shape (keys only) so we can see what Gemini sends first time
    try {
      voiceLog("raw msg keys:", Object.keys(message), {
        hasServerContent: Boolean(message.serverContent),
        hasToolCall: Boolean(message.toolCall),
        setupComplete: Boolean(message.setupComplete),
      });
    } catch {
      /* ignore */
    }
    if (message.toolCall?.functionCalls?.length) {
      voiceLog(
        "toolCall:",
        message.toolCall.functionCalls.map((fc) => fc.name)
      );
      if (!awakened && requireWakeWord) {
        // Ignore tool calls before wake
        const responses = message.toolCall.functionCalls.map((fc) => ({
          id: fc.id,
          name: fc.name,
          response: { ignored: true, reason: "Waiting for Hey Kit" },
        }));
        liveSession?.sendToolResponse?.({ functionResponses: responses });
        return;
      }
      await runTools(message.toolCall.functionCalls);
      return;
    }
    const sc = message.serverContent;
    if (!sc) {
      if (message.setupComplete) {
        voiceLog("setupComplete — waiting for speech");
        setPhase(requireWakeWord ? "ready" : "active");
        onStatus?.(requireWakeWord ? "Say Hey Kit" : "Listening…");
      }
      return;
    }
    if (sc.interrupted) {
      voiceLog("interrupted");
      try {
        player.stop();
      } catch {
        /* ignore */
      }
      player = createPcmPlayer(OUTPUT_SAMPLE_RATE);
    }
    if (sc.inputTranscription?.text) {
      const chunk = sc.inputTranscription.text;
      userBuf += chunk;
      voiceLog("STT delta:", JSON.stringify(chunk), "| buf:", JSON.stringify(userBuf));
      // Early wake detect while speaking
      if (requireWakeWord && !awakened && looksLikeWakePhrase(userBuf)) {
        awakened = true;
        setPhase("active");
        onStatus?.("Listening…");
        voiceLog("WAKE matched on partial buf:", userBuf);
      }
      if (sc.inputTranscription.finished === true || sc.turnComplete) {
        const t = userBuf.trim();
        userBuf = "";
        voiceLog("STT finished:", t, {
          finished: sc.inputTranscription.finished === true,
          turnComplete: Boolean(sc.turnComplete),
        });
        handleUserUtterance(t);
      }
    }
    if (sc.outputTranscription?.text) {
      if (awakened) {
        assistantBuf += sc.outputTranscription.text;
        voiceLog("assistant STT delta:", sc.outputTranscription.text);
      }
    }
    const parts = sc.modelTurn?.parts || [];
    for (const part of parts) {
      const data = part.inlineData?.data;
      const mime = String(part.inlineData?.mimeType || "");
      if (data && mime.includes("audio")) {
        if (!awakened && requireWakeWord) continue; // mute until wake
        setPhase("speaking");
        await player.enqueue(data);
      }
    }
    if (sc.generationComplete || sc.turnComplete) {
      const spoken = assistantBuf.trim();
      assistantBuf = "";
      if (spoken && awakened) {
        voiceLog("assistant spoken (final):", spoken);
        lastAssistantSpoken = spoken;
        await formatAndPushBot(spoken);
      }
      if (userBuf.trim()) {
        const t = userBuf.trim();
        userBuf = "";
        voiceLog("flush leftover userBuf on turnComplete:", t);
        handleUserUtterance(t);
      }
      if (pendingEnd) {
        scheduleStopAfterPlayback(spoken || lastAssistantSpoken);
      } else if (awakened) {
        setPhase("active");
        onStatus?.("Listening…");
      } else {
        setPhase("ready");
        onStatus?.("Say Hey Kit");
      }
    }
  };
  liveSession = await ai.live.connect({
    model,
    config: {
      ...(sessionData.liveConfig || {}),
      responseModalities: [Modality.AUDIO],
    },
    callbacks: {
      onopen: () => {
        voiceLog("Gemini Live connected");
        onStatus?.("Connected — say Hey Kit");
      },
      onmessage: (msg) => {
        handleMessage(msg).catch((err) =>
          console.error("[KitLiveVoice:gemini]", err)
        );
      },
      onerror: (e) => {
        console.error("[KitLiveVoice:gemini]", e);
        voiceLog("onerror", e?.message || e);
        onError?.(e?.message || "Live voice error. Please try again.");
      },
      onclose: () => {
        voiceLog("Gemini Live closed");
        if (!closed) stop();
      },
    },
  });
  voiceLog("mic start — getUserMedia");
  // Mic → PCM 16k → Gemini
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      channelCount: 1,
    },
  });
  voiceLog("mic OK tracks:", mediaStream.getAudioTracks().map((t) => t.label || t.kind));
  audioCtx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
  if (audioCtx.state === "suspended") await audioCtx.resume();
  source = audioCtx.createMediaStreamSource(mediaStream);
  processor = audioCtx.createScriptProcessor(4096, 1, 1);
  silentGain = audioCtx.createGain();
  silentGain.gain.value = 0;
  processor.onaudioprocess = (event) => {
    if (closed || !liveSession) return;
    const input = event.inputBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < input.length; i += 1) sum += input[i] * input[i];
    const rms = Math.sqrt(sum / input.length);
    const level = Math.min(1, Math.max(0, (rms - 0.01) * 10));
    onMicLevel?.(level);
    const pcm = floatTo16BitPCM(input);
    const b64 = arrayBufferToBase64(pcm.buffer);
    try {
      liveSession.sendRealtimeInput({
        audio: {
          data: b64,
          mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
        },
      });
    } catch {
      /* ignore send errors while closing */
    }
  };
  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(audioCtx.destination);
  setPhase(requireWakeWord ? "ready" : "active");
  onStatus?.(requireWakeWord ? "Say Hey Kit" : "Listening…");
  return {
    stop,
    sleep: sleepSession,
    interrupt: () => {},
    provider: "gemini",
    isAwakened: () => awakened,
  };
}
/** Legacy OpenAI WebRTC path (only if backend returns provider=openai). */
async function startOpenAILiveVoice(sessionData, opts) {
  const { onChatMessage, onStatus, onError, onEnded } = opts;
  const ephemeralKey = sessionData.clientSecret;
  const pc = new RTCPeerConnection();
  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  audioEl.setAttribute("playsinline", "true");
  const remoteStream = new MediaStream();
  pc.ontrack = (e) => {
    e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
    audioEl.srcObject = remoteStream;
  };
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
  const dc = pc.createDataChannel("oai-events");
  const pendingCalls = new Map();
  let lastUserTranscript = "";
  let lastAssistantSpoken = "";
  let assistantTranscriptBuf = "";
  let closed = false;
  let pendingEnd = false;
  let endStopTimer = null;
  let endHardCapTimer = null;
  const sendEvent = (payload) => {
    if (dc.readyState === "open") dc.send(JSON.stringify(payload));
  };
  const clearEndTimers = () => {
    if (endStopTimer != null) clearTimeout(endStopTimer);
    if (endHardCapTimer != null) clearTimeout(endHardCapTimer);
    endStopTimer = null;
    endHardCapTimer = null;
  };
  const stop = () => {
    if (closed) return;
    closed = true;
    clearEndTimers();
    try {
      sendEvent({ type: "response.cancel" });
    } catch {
      /* ignore */
    }
    try {
      dc.close();
    } catch {
      /* ignore */
    }
    try {
      pc.close();
    } catch {
      /* ignore */
    }
    localStream.getTracks().forEach((t) => t.stop());
    remoteStream.getTracks().forEach((t) => t.stop());
    audioEl.srcObject = null;
    audioEl.remove();
    onStatus?.("");
    onEnded?.();
  };
  const armHardCap = () => {
    if (endHardCapTimer != null) return;
    endHardCapTimer = setTimeout(() => stop(), 20000);
  };
  const scheduleStopAfterPlayback = (spoken) => {
    if (closed || !pendingEnd) return;
    onStatus?.("Goodbye — finishing…");
    if (endStopTimer != null) clearTimeout(endStopTimer);
    endStopTimer = setTimeout(() => stop(), playbackTailMs(spoken || lastAssistantSpoken));
    armHardCap();
  };
  const markPendingEnd = (statusText) => {
    if (closed) return;
    pendingEnd = true;
    onStatus?.(statusText || "Wrapping up…");
    armHardCap();
  };
  const formatAndPushBot = async (spoken) => {
    const text = String(spoken || "").trim();
    if (!text) return;
    try {
      const res = await fetch(`${API_BASE}/api/help/realtime/format-chat`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ spokenText: text, userText: lastUserTranscript }),
      });
      const data = await res.json().catch(() => ({}));
      const chatText =
        res.ok && data.success && data.text ? String(data.text).trim() : text;
      onChatMessage?.({ role: "bot", text: chatText, live: true });
    } catch {
      onChatMessage?.({ role: "bot", text, live: true });
    }
  };
  const runToolAndReply = async (callId, name, argsJson) => {
    if (name === END_LIVE_SESSION_TOOL) {
      markPendingEnd("Ending call…");
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({ ok: true, endSession: true }),
        },
      });
      if (lastAssistantSpoken) scheduleStopAfterPlayback(lastAssistantSpoken);
      else sendEvent({ type: "response.create" });
      return;
    }
    onStatus?.("Looking that up…");
    try {
      const res = await fetch(`${API_BASE}/api/help/realtime/tool`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({
          name,
          arguments: parseToolArgs(argsJson),
          ...clientTimezonePayload(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const result = data.result ?? { error: data.message || "Tool failed" };
      notifyDataRefresh(opts, data);
      notifyFileDownload(opts, data);
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      });
      sendEvent({ type: "response.create" });
    } catch (err) {
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({ error: err?.message || "Tool failed" }),
        },
      });
      sendEvent({ type: "response.create" });
    }
  };
  dc.addEventListener("open", () => onStatus?.("Connected — say Hey Kit"));
  dc.addEventListener("message", (e) => {
    let event;
    try {
      event = JSON.parse(e.data);
    } catch {
      return;
    }
    if (!event?.type || closed) return;
    if (event.type === "conversation.item.input_audio_transcription.completed") {
      const t = String(event.transcript || "").trim();
      voiceLog("OpenAI STT final:", t);
      if (t) {
        lastUserTranscript = t;
        onChatMessage?.({ role: "user", text: t, live: true });
        if (looksLikeEndCallIntent(t)) markPendingEnd("Wrapping up…");
      }
    } else if (event.type === "response.output_audio_transcript.delta") {
      assistantTranscriptBuf += event.delta || "";
    } else if (event.type === "response.output_audio_transcript.done") {
      const spoken = String(event.transcript || assistantTranscriptBuf || "").trim();
      voiceLog("OpenAI assistant spoken:", spoken);
      assistantTranscriptBuf = "";
      if (spoken) {
        lastAssistantSpoken = spoken;
        formatAndPushBot(spoken);
      }
      if (pendingEnd) scheduleStopAfterPlayback(spoken);
      else onStatus?.("Listening — say Hey Kit");
    } else if (event.type === "response.done") {
      const calls = (event.response?.output || []).filter(
        (o) => o?.type === "function_call" && o.call_id
      );
      if (calls.length) {
        pendingCalls.clear();
        calls.forEach((call) =>
          runToolAndReply(call.call_id, call.name, call.arguments)
        );
      }
    } else if (event.type === "error") {
      onError?.(event.error?.message || "Live voice error. Please try again.");
    }
  });
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
      "Content-Type": "application/sdp",
    },
    body: offer.sdp,
  });
  if (!sdpRes.ok) {
    const errText = await sdpRes.text().catch(() => "");
    throw new Error(errText || "WebRTC handshake failed.");
  }
  await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
  return { stop, interrupt: () => sendEvent({ type: "response.cancel" }), provider: "openai" };
}