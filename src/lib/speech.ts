"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Minimal typings for the Web Speech API (no dependency, no key) ───────── */
type RecognitionAlternative = { transcript: string; confidence: number };
type RecognitionResult = { isFinal: boolean; length: number; [index: number]: RecognitionAlternative };
type RecognitionResultList = { length: number; [index: number]: RecognitionResult };
type RecognitionEvent = { resultIndex: number; results: RecognitionResultList };
export type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function recognitionSupported() {
  if (typeof window === "undefined") return false;
  const w = window as SpeechWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function synthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice() {
  if (!synthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /en(-|_)GB/i.test(v.lang) && /female|samantha|serena|kate/i.test(v.name)) ||
    voices.find((v) => /en(-|_)US/i.test(v.lang) && /female|samantha|jenny|aria|zira/i.test(v.name)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0] || null
  );
}

/** Reads a question aloud using the browser engine (TTS placeholder fallback). */
export function speak(text: string, rate = 0.98) {
  if (!synthesisSupported()) return Promise.resolve(false);
  window.speechSynthesis.cancel();
  return new Promise<boolean>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (synthesisSupported()) window.speechSynthesis.cancel();
}

/** Microphone dictation with automatic silence detection. */
export function useDictation(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    if (!recognitionSupported()) {
      setError("Live microphone is not supported in this browser. Type your answer instead.");
      return;
    }
    setError("");
    setInterim("");
    const w = window as SpeechWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let draft = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) onFinalRef.current(result[0].transcript.trim());
        else draft += result[0].transcript;
      }
      setInterim(draft);
      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => stop(), 2600);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") setError("Microphone blocked. Allow access or type your answer.");
      else if (event.error !== "aborted" && event.error !== "no-speech") setError(`Microphone issue: ${event.error}`);
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setListening(false); }
  }, [stop]);

  useEffect(() => () => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    recognitionRef.current?.abort();
  }, []);

  return { listening, interim, error, start, stop, supported: recognitionSupported() };
}
