"use client";

import { useState, useRef } from "react";
import { theme } from "@/lib/theme";

interface AttachmentUploaderProps {
  noteId: string;
  onUploadComplete: () => void;
}

const ALLOWED_TYPES = {
  "image/jpeg": "Image",
  "image/png": "Image",
  "image/gif": "Image",
  "image/webp": "Image",
  "audio/mpeg": "Audio",
  "audio/mp3": "Audio",
  "audio/wav": "Audio",
  "audio/ogg": "Audio",
  "audio/webm": "Audio",
  "audio/m4a": "Audio",
  "video/mp4": "Video",
  "video/quicktime": "Video",
  "video/webm": "Video",
  "application/pdf": "Document",
  "text/plain": "Document",
  "application/msword": "Document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Document",
};

export default function AttachmentUploader({ noteId, onUploadComplete }: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus(`Uploading ${i + 1} of ${totalFiles}: ${file.name}`);
      setUploadProgress(0);

      // Validate type
      if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
        alert(`File type ${file.type} not allowed`);
        continue;
      }

      // Validate size (100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 100MB)`);
        continue;
      }

      try {
        // Step 1: Get upload URL
        const uploadRes = await fetch(`/api/notes/${noteId}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl } = await uploadRes.json();

        // Step 2: Upload to R2 with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
              const totalMB = (e.total / (1024 * 1024)).toFixed(1);
              setUploadProgress(percentComplete);
              setUploadStatus(
                `Uploading ${i + 1} of ${totalFiles}: ${file.name} - ${loadedMB}MB / ${totalMB}MB (${Math.round(percentComplete)}%)`
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        console.log(`✓ Uploaded: ${file.name}`);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploadStatus("Upload complete!");
    setTimeout(() => {
      setUploadStatus("");
      setUploadProgress(0);
      setUploading(false);
      onUploadComplete();
    }, 1000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={Object.keys(ALLOWED_TYPES).join(",")}
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? theme.colors.primary : "rgba(0,0,0,0.2)"}`,
          borderRadius: 8,
          padding: 24,
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          background: dragActive ? theme.colors.primaryBg : "rgba(255,255,255,0.5)",
          transition: "all 0.2s",
        }}
      >
        {uploading ? (
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <div style={{ color: theme.colors.primary, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              {uploadStatus}
            </div>
            {/* Progress bar */}
            <div style={{ 
              width: "100%", 
              height: 6, 
              background: "rgba(0,0,0,0.1)", 
              borderRadius: 3,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: "100%",
                background: theme.colors.primary,
                transition: "width 0.2s ease",
              }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
            <div style={{ fontSize: 14, color: theme.colors.textPrimary, marginBottom: 4 }}>
              Click or drag files here
            </div>
            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
              Images, audio, video, documents (max 100MB)
            </div>
          </>
        )}
      </div>
    </div>
  );
}
