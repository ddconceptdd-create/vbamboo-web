'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type HeroVideoSource = { kind: 'youtube'; id: string } | { kind: 'file'; src: string };

type Props = {
  video: HeroVideoSource;
  labels: { pause: string; play: string; video: string; soundOn: string; soundOff: string };
};

const VOLUME = 70; // target volume (0–100) after the fade-in
const FADE_MS = 2800;

/**
 * Muted background film for the home page, layered over the poster photograph
 * (rendered by the page underneath, so the first frame is always an image).
 *
 * - Starts only when motion is welcome: never with "reduce motion" or Save-Data;
 *   the visitor can still press play.
 * - Round play/pause and sound buttons (WCAG 2.2.2, 1.4.2); pauses when scrolled away.
 * - Sound: browsers refuse to autoplay audio, so the film starts muted and the
 *   sound fades in (≈3 s) on the visitor's first tap, click or key press while the
 *   film is on screen, or when they press the sound button.
 * - YouTube runs from youtube-nocookie.com and is loaded after the page itself.
 */
export default function HeroVideo({ video, labels }: Props) {
  const [mounted, setMounted] = useState(false); // player inserted
  const [visible, setVisible] = useState(false); // first frame is playing → fade in
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const userPaused = useRef(false);
  const userMuted = useRef(false);
  const onScreen = useRef(true);
  const fade = useRef(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const file = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const command = useCallback(
    (func: 'playVideo' | 'pauseVideo' | 'mute' | 'unMute' | 'setVolume', arg?: number) => {
      if (video.kind === 'youtube') {
        frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: arg == null ? [] : [arg] }), '*');
        return;
      }
      const v = file.current;
      if (!v) return;
      if (func === 'playVideo') v.play().catch(() => undefined);
      if (func === 'pauseVideo') v.pause();
      if (func === 'mute') v.muted = true;
      if (func === 'unMute') v.muted = false;
      if (func === 'setVolume' && arg != null) v.volume = arg / 100;
    },
    [video.kind],
  );

  /** Unmute and raise the volume gradually, so the sound never starts abruptly. */
  const soundUp = useCallback(() => {
    window.clearInterval(fade.current);
    command('setVolume', 0);
    command('unMute');
    setMuted(false);
    const t0 = performance.now();
    fade.current = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / FADE_MS);
      command('setVolume', Math.round(VOLUME * k * k));
      if (k >= 1) window.clearInterval(fade.current);
    }, 100);
  }, [command]);

  const soundOff = useCallback(() => {
    window.clearInterval(fade.current);
    command('mute');
    setMuted(true);
  }, [command]);

  // First tap / click / key press anywhere while the film is visible turns the sound on.
  useEffect(() => {
    if (!mounted) return;
    const first = () => {
      if (!userMuted.current && onScreen.current && !userPaused.current) soundUp();
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', first, true);
      window.removeEventListener('keydown', first, true);
    };
    window.addEventListener('pointerdown', first, true);
    window.addEventListener('keydown', first, true);
    return cleanup;
  }, [mounted, soundUp]);
  useEffect(() => () => window.clearInterval(fade.current), []);

  // Decide whether to autoplay.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saveData) return;
    // Start straight away (next frame): the poster is already on screen and the film fades in over it.
    const id = requestAnimationFrame(() => {
      setMounted(true);
      setPaused(false);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // YouTube reports its state through postMessage once we say we are listening.
  useEffect(() => {
    if (!mounted || video.kind !== 'youtube') return;
    const onMessage = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        const state = data?.info?.playerState;
        if (state === 1) setVisible(true);
      } catch {
        /* not a player message */
      }
    };
    window.addEventListener('message', onMessage);
    // Fallback: some browsers never report the state; reveal after a short wait.
    const id = window.setTimeout(() => setVisible(true), 4000);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(id);
    };
  }, [mounted, video.kind]);

  // Pause while the hero is off screen (saves battery), resume when back.
  useEffect(() => {
    const el = wrap.current;
    if (!el || !mounted) return;
    const io = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting;
      if (userPaused.current) return;
      command(entry.isIntersecting ? 'playVideo' : 'pauseVideo');
    });
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, command]);

  const toggle = () => {
    if (!mounted) {
      userPaused.current = false;
      setMounted(true);
      setPaused(false);
      return;
    }
    const next = !paused;
    userPaused.current = next;
    setPaused(next);
    command(next ? 'pauseVideo' : 'playVideo');
  };

  const onFrameLoad = () => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'vb-hero' }), '*');
  };

  const ytSrc =
    video.kind === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${video.id}?` +
        new URLSearchParams({
          autoplay: '1',
          mute: '1',
          loop: '1',
          playlist: video.id,
          controls: '0',
          playsinline: '1',
          rel: '0',
          disablekb: '1',
          iv_load_policy: '3',
          modestbranding: '1',
          enablejsapi: '1',
          origin: typeof window === 'undefined' ? '' : window.location.origin,
        })
      : '';

  return (
    <>
      <div ref={wrap} className="hero-video" data-visible={visible || undefined} aria-hidden="true">
        {mounted && video.kind === 'youtube' && (
          <iframe
            ref={frame}
            className="hero-video__frame"
            src={ytSrc}
            title={labels.video}
            tabIndex={-1}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={onFrameLoad}
          />
        )}
        {mounted && video.kind === 'file' && (
          <video
            ref={file}
            className="hero-video__file"
            src={video.src}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onPlaying={() => setVisible(true)}
          />
        )}
      </div>
      <div className="hero-controls">
        <button type="button" onClick={toggle} aria-label={paused ? labels.play : labels.pause} title={paused ? labels.play : labels.pause}>
          {paused ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3.5 1.5v11l9-5.5z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 1.5h2.6v11H3zM8.4 1.5H11v11H8.4z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (muted) {
              userMuted.current = false;
              if (!mounted) toggle();
              soundUp();
            } else {
              userMuted.current = true;
              soundOff();
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={muted ? labels.soundOn : labels.soundOff}
          title={muted ? labels.soundOn : labels.soundOff}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M2 6h2.5L8 3v10l-3.5-3H2z" fill="currentColor" stroke="none" />
            {muted ? <path d="M11 6l4 4M15 6l-4 4" strokeLinecap="round" /> : <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6.3 6.3 0 0 1 0 9" strokeLinecap="round" />}
          </svg>
        </button>
      </div>
    </>
  );
}
