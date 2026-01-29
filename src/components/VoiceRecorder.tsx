"use client";

import { useState, useRef, useEffect } from "react";
import { theme } from "@/lib/theme";

interface VoiceRecorderProps {
  noteId: string;
  onRecordingComplete: () => void;
}

export default function VoiceRecorder({ noteId, onRecordingComplete }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to access microphone. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleRecordingStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const filename = `recording-${Date.now()}.webm`;

    setUploading(true);

    try {
      // Step 1: Get upload URL
      const uploadRes = await fetch(`/api/notes/${noteId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          contentType: "audio/webm",
          size: blob.size,
        }),
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl } = await uploadRes.json();

      // Step 2: Upload to R2
      const r2Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "audio/webm" },
        body: blob,
      });

      if (!r2Res.ok) {
        throw new Error("Failed to upload recording");
      }

      onRecordingComplete();
    } catch (error) {
      console.error("Error uploading recording:", error);
      alert("Failed to upload recording");
    } finally {
      setUploading(false);
      setDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: 8,
        padding: 16,
        background: "rgba(255,255,255,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Record button */}
        {!recording && !uploading && (
          <button
            onClick={startRecording}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#EF4444",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "white",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            title="Start recording"
          >
            🎤
          </button>
        )}

        {/* Stop button */}
        {recording && (
          <button
            onClick={stopRecording}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#3B82F6",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "white",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            title="Stop recording"
          >
            ⏹️
          </button>
        )}

        {/* Status */}
        <div style={{ flex: 1 }}>
          {uploading && (
            <div style={{ fontSize: 14, color: theme.colors.textMuted }}>Uploading recording...</div>
          )}
          {recording && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#EF4444",
                  animation: "pulse 1.5s infinite",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                Recording: {formatDuration(duration)}
              </span>
            </div>
          )}
          {!recording && !uploading && (
            <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
              Click to record voice memo
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
