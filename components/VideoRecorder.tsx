"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  onReady: (blobUrl: string) => void;
};

export default function VideoRecorder({ onReady }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        setError('Camera or microphone permission denied.');
      }
    })();
    return () => {
      setStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });
    };
  }, []);

  const start = useCallback(() => {
    if (!stream) return;
    setDownloadUrl(u => { if (u) URL.revokeObjectURL(u); return null; });
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      onReady(url);
    };
    rec.start(250);
    setRecorder(rec);
    setRecording(true);
  }, [stream, onReady]);

  const stop = useCallback(() => {
    recorder?.stop();
    setRecording(false);
  }, [recorder]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="video-wrap">
        <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', display: 'block' }} />
      </div>
      {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
      <div className="controls-row">
        {!recording ? (
          <button className="btn" onClick={start} disabled={!stream}>Start recording</button>
        ) : (
          <button className="btn" onClick={stop}>Stop</button>
        )}
        {downloadUrl && (
          <a className="btn" href={downloadUrl} download={`recording-${Date.now()}.webm`}>Download</a>
        )}
      </div>
    </div>
  );
}
