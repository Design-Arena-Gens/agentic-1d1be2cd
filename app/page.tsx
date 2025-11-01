"use client";

import { useCallback, useMemo, useRef, useState } from 'react';
import VideoPlayer from "../components/VideoPlayer";
import VideoRecorder from "../components/VideoRecorder";

const SAMPLE = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'player' | 'recorder'>('player');
  const [sourceUrl, setSourceUrl] = useState<string>(SAMPLE);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subInputRef = useRef<HTMLInputElement | null>(null);

  const onPickFile = useCallback(() => fileInputRef.current?.click(), []);
  const onPickSubs = useCallback(() => subInputRef.current?.click(), []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setSourceUrl(url);
  }, []);

  const onSubsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setSubtitleUrl(url);
  }, []);

  const onUrlSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const url = String(data.get('url') || '').trim();
    if (!url) return;
    setSourceUrl(url);
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1 style={{ margin: 0 }}>Agentic Video</h1>
        <div className="tabs" role="tablist" aria-label="Modes">
          <button className={activeTab === 'player' ? 'active' : ''} onClick={() => setActiveTab('player')} role="tab" aria-selected={activeTab==='player'}>Player</button>
          <button className={activeTab === 'recorder' ? 'active' : ''} onClick={() => setActiveTab('recorder')} role="tab" aria-selected={activeTab==='recorder'}>Recorder</button>
        </div>
      </div>

      {activeTab === 'player' ? (
        <div className="card" style={{ padding: 16 }}>
          <div className="controls-row" style={{ marginBottom: 12 }}>
            <button className="btn" onClick={() => setSourceUrl(SAMPLE)}>Load sample</button>
            <button className="btn" onClick={onPickFile}>Open file</button>
            <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onFileChange} />

            <button className="btn" onClick={onPickSubs}>Add subtitles (.vtt)</button>
            <input ref={subInputRef} type="file" accept="text/vtt,.vtt" style={{ display: 'none' }} onChange={onSubsChange} />

            <form onSubmit={onUrlSubmit} className="controls-row" style={{ marginLeft: 'auto' }}>
              <input className="input" style={{ width: 320 }} name="url" placeholder="Paste video URL (mp4/webm/m3u8)" />
              <button className="btn" type="submit">Load</button>
            </form>
          </div>

          <VideoPlayer src={sourceUrl} subtitleSrc={subtitleUrl ?? undefined} onClearSubtitles={() => setSubtitleUrl(null)} />
        </div>
      ) : (
        <div className="card" style={{ padding: 16 }}>
          <VideoRecorder onReady={(blobUrl) => {
            setActiveTab('player');
            setSourceUrl(blobUrl);
          }} />
        </div>
      )}

      <p style={{ color: 'var(--muted)', marginTop: 16 }}>
        Tip: Use keyboard shortcuts ? Space (Play/Pause), ?/? (Seek), M (Mute), F (Fullscreen), P (PiP), L (Loop), [ / ] (Speed), K/J (?10s).
      </p>
    </div>
  );
}
