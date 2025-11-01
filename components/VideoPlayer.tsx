"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  src: string;
  subtitleSrc?: string;
  onClearSubtitles?: () => void;
};

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00';
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const m = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
  const h = Math.floor(seconds / 3600);
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export default function VideoPlayer({ src, subtitleSrc, onClearSubtitles }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef<HTMLInputElement | null>(null);

  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('vp_speed') : null;
    return saved ? Number(saved) : 1;
  });
  const [loop, setLoop] = useState(false);

  useEffect(() => {
    window.localStorage.setItem('vp_speed', String(speed));
  }, [speed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setDuration(v.duration || 0);
    const onTime = () => setCurrent(v.currentTime || 0);
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);

    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);

    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.loop = loop;
  }, [loop]);

  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      try { await v.play(); } catch {}
    } else {
      v.pause();
    }
  }, []);

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const value = Number(e.target.value);
    v.currentTime = (value / 1000) * (v.duration || 0);
  }, []);

  const onWheelSeek = useCallback((e: React.WheelEvent) => {
    const v = videoRef.current; if (!v) return;
    const delta = Math.sign(e.deltaY) * 2; // seconds
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  }, []);

  const step = useCallback((amount: number) => {
    const v = videoRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + amount));
  }, []);

  const onKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
    switch (e.key.toLowerCase()) {
      case ' ': e.preventDefault(); togglePlay(); break;
      case 'arrowleft': step(-5); break;
      case 'arrowright': step(5); break;
      case 'j': step(-10); break;
      case 'k': togglePlay(); break;
      case 'l': setLoop(v => !v); break;
      case 'm': setMuted(v => !v); break;
      case '[': setSpeed(s => Math.max(0.25, Number((s - 0.25).toFixed(2)))); break;
      case ']': setSpeed(s => Math.min(3, Number((s + 0.25).toFixed(2)))); break;
      case 'f': {
        const el = videoRef.current; if (!el) break;
        if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen().catch(() => {});
        break;
      }
      case 'p': {
        const el = videoRef.current as any; if (!el) break;
        if (document.pictureInPictureElement) {
          (document as any).exitPictureInPicture?.();
        } else {
          el.requestPictureInPicture?.().catch(() => {});
        }
        break;
      }
    }
  }, [step, togglePlay]);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    v.muted = muted;
    v.volume = volume;
  }, [muted, volume]);

  const progressValue = useMemo(() => {
    if (!duration) return 0;
    return Math.round((current / duration) * 1000);
  }, [current, duration]);

  return (
    <div className="video-player" onKeyDown={onKey} tabIndex={0} style={{ outline: 'none' }}>
      <div className="video-wrap" onWheel={onWheelSeek}>
        <video
          ref={videoRef}
          src={src}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          playsInline
          controls={false}
          preload="metadata"
          crossOrigin="anonymous"
        >
          {subtitleSrc && (
            <track kind="subtitles" srcLang="en" label="Subtitles" src={subtitleSrc} default />
          )}
        </video>
      </div>

      <div style={{ padding: 12, display: 'grid', gap: 10 }}>
        <input
          className="range"
          ref={progressRef}
          type="range"
          min={0}
          max={1000}
          value={progressValue}
          aria-label="Seek"
          onChange={onSeek}
        />
        <div className="controls-row">
          <button className="btn" onClick={togglePlay}>{paused ? 'Play' : 'Pause'}</button>
          <button className="btn" onClick={() => step(-10)}>?10s</button>
          <button className="btn" onClick={() => step(-5)}>?5s</button>
          <button className="btn" onClick={() => step(5)}>+5s</button>
          <button className="btn" onClick={() => step(10)}>+10s</button>

          <span className="time" aria-live="polite">{formatTime(current)} / {formatTime(duration)}</span>

          <label style={{ marginLeft: 'auto' }}>
            <span className="time" style={{ marginRight: 8 }}>Vol</span>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} />
          </label>

          <button className="btn" onClick={() => setMuted(v => !v)}>{muted ? 'Unmute' : 'Mute'}</button>

          <label>
            <span className="time" style={{ marginRight: 8 }}>Speed</span>
            <select className="input" value={speed} onChange={e => setSpeed(Number(e.target.value))}>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3].map(s => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </label>

          <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} /> Loop
          </label>

          {subtitleSrc && (
            <button className="btn" onClick={onClearSubtitles}>Remove subs</button>
          )}

          <button className="btn" onClick={() => {
            const el = videoRef.current; if (!el) return;
            if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen().catch(() => {});
          }}>Fullscreen</button>

          <button className="btn" onClick={() => {
            const el = videoRef.current as any; if (!el) return;
            if (document.pictureInPictureElement) {
              (document as any).exitPictureInPicture?.();
            } else {
              el.requestPictureInPicture?.().catch(() => {});
            }
          }}>PiP</button>
        </div>
      </div>
    </div>
  );
}
