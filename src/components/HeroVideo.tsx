'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type HeroVideoSource = { kind: 'youtube'; id: string } | { kind: 'file'; src: string };

type Props = {
  video: HeroVideoSource;
  labels: { pause: string; play: string; video: string };
};

/**
 * Muted background film for the home page, layered over the poster photograph
 * (rendered by the page underneath, so the first frame is always an image).
 *
 * - Starts only when motion is welcome: never with "reduce motion" or Save-Data;
 *   the visitor can still press play.
 * - A visible pause button (WCAG 2.2.2) and automatic pause when scrolled away.
 * - YouTube runs from youtube-nocookie.com and is loaded after the page itself.
 */
export default function HeroVideo({ video, labels }: Props) {
  const [mounted, setMounted] = useState(false); // player inserted
  const [visible, setVisible] = useState(false); // first frame is playing → fade in
  const [paused, setPaused] = useState(true);
  const userPaused = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const file = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const command = useCallback(
    (func: 'playVideo' | 'pauseVideo') => {
      if (video.kind === 'youtube') {
        frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
      } else if (file.current) {
        if (func === 'playVideo') file.current.play().catch(() => undefined);
        else file.current.pause();
      }
    },
    [video.kind],
  );

  // Decide whether to autoplay, after the page has loaded.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saveData) return;
    const start = () => {
      setMounted(true);
      setPaused(false);
    };
    if (document.readyState === 'complete') {
      const id = window.setTimeout(start, 300);
      return () => window.clearTimeout(id);
    }
    window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
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
      <button type="button" className="hero-video__toggle" onClick={toggle} aria-label={paused ? labels.play : labels.pause}>
        {paused ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M3 1.5v11l9-5.5z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M3 1.5h2.6v11H3zM8.4 1.5H11v11H8.4z" fill="currentColor" />
          </svg>
        )}
        <span className="hero-video__label">{paused ? labels.play : labels.pause}</span>
      </button>
    </>
  );
}
