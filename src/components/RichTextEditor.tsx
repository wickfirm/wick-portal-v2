"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { useCallback, useEffect, useState, useRef } from "react";

interface AttachmentPreview {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video" | "file";
  uploading?: boolean;
  progress?: number;
}

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  minHeight?: number;
  onFileUpload?: (file: File) => Promise<string | null>;
  attachments?: AttachmentPreview[];
  onAttachmentsChange?: (attachments: AttachmentPreview[]) => void;
  showAttachButton?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Type your comment here...",
  onSubmit,
  disabled = false,
  minHeight = 120,
  onFileUpload,
  attachments = [],
  onAttachmentsChange,
  showAttachButton = true,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
        style: `min-height: ${minHeight}px; padding: 16px;`,
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          onSubmit?.();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  // Helper to detect if file is a video by extension (browser file.type can be wrong)
  const isVideoFile = (filename: string, mimeType: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const videoExtensions = ['mp4', 'mov', 'webm', 'avi', 'mkv', '3gp', 'm4v'];
    return mimeType.startsWith('video/') || videoExtensions.includes(ext);
  };

  // Helper to detect if file is an image by extension
  const isImageFile = (filename: string, mimeType: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    // Only treat as image if NOT a video (video takes priority)
    if (isVideoFile(filename, mimeType)) return false;
    return mimeType.startsWith('image/') || imageExtensions.includes(ext);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentPreview[] = [];

    for (const file of Array.from(files)) {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let type: "image" | "video" | "file" = "file";
      let preview = "";

      // Check video first (takes priority over image detection)
      if (isVideoFile(file.name, file.type)) {
        type = "video";
        preview = URL.createObjectURL(file);
        console.log(`File detected as VIDEO: ${file.name}, browser type: ${file.type}`);
      } else if (isImageFile(file.name, file.type)) {
        type = "image";
        preview = URL.createObjectURL(file);
        console.log(`File detected as IMAGE: ${file.name}, browser type: ${file.type}`);
      } else {
        console.log(`File detected as OTHER: ${file.name}, browser type: ${file.type}`);
      }

      newAttachments.push({
        id,
        file,
        preview,
        type,
        uploading: false,
      });
    }

    onAttachmentsChange?.([...attachments, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    const attachment = attachments.find(a => a.id === id);
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    onAttachmentsChange?.(attachments.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive = false,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        background: isActive ? "#e5e7eb" : "none",
        border: "none",
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: 14,
        color: isActive ? "#111" : "#6b7280",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "#f3f4f6";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "none";
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", position: "relative" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "8px 12px",
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          flexWrap: "wrap",
        }}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <span style={{ fontWeight: 700 }}>B</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <span style={{ fontStyle: "italic" }}>I</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <span style={{ textDecoration: "line-through" }}>S</span>
        </ToolbarButton>

        <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "0 4px" }} />

        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            setLinkUrl(previousUrl || "");
            setShowLinkInput(true);
          }}
          isActive={editor.isActive("link")}
          title="Link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          title="Highlight"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          </svg>
        </ToolbarButton>

        <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "0 4px" }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading"
        >
          <span style={{ fontWeight: 600 }}>H</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>―</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{"</>"}</span>
        </ToolbarButton>

        <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "0 4px" }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </ToolbarButton>

        {showAttachButton && (
          <>
            <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "0 4px" }} />
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              title="Attach Files"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </ToolbarButton>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </>
        )}

        <div style={{ flex: 1 }} />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </svg>
        </ToolbarButton>

        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Link Input Modal */}
      {showLinkInput && (
        <div
          style={{
            padding: "12px",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
              }
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
            }}
            autoFocus
          />
          <button
            onClick={setLink}
            style={{
              padding: "8px 16px",
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Link
          </button>
          <button
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              setShowLinkInput(false);
            }}
            style={{
              padding: "8px 16px",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Unlink
          </button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}>
          {attachments.map((att) => (
            <div
              key={att.id}
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            >
              {att.type === "image" && (
                <div style={{ width: 150, height: 100 }}>
                  <img
                    src={att.preview}
                    alt={att.file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
              {att.type === "video" && (
                <div style={{ width: 150, height: 100 }}>
                  <video
                    src={att.preview}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
              {att.type === "file" && (
                <div style={{
                  width: 150,
                  height: 100,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 8,
                }}>
                  <span style={{ fontSize: 28, marginBottom: 4 }}>📄</span>
                  <span style={{
                    fontSize: 11,
                    color: "#6b7280",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                  }}>
                    {att.file.name}
                  </span>
                </div>
              )}
              <div style={{
                padding: "6px 8px",
                background: "white",
                borderTop: "1px solid #e5e7eb",
                fontSize: 11,
                color: "#6b7280",
                textAlign: "center",
              }}>
                {att.file.name.length > 18 ? att.file.name.slice(0, 15) + "..." : att.file.name}
                <div style={{ fontSize: 10, color: "#9ca3af" }}>
                  {formatFileSize(att.file.size)}
                </div>
              </div>
              {/* Remove button */}
              <button
                onClick={() => removeAttachment(att.id)}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                }}
              >
                ×
              </button>
              {/* Upload progress */}
              {att.uploading && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "#e5e7eb",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${att.progress || 0}%`,
                    background: "#3b82f6",
                    transition: "width 0.2s",
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          font-weight: 600;
          margin: 0.75em 0 0.5em;
        }
        .ProseMirror h1 { font-size: 1.5em; }
        .ProseMirror h2 { font-size: 1.3em; }
        .ProseMirror h3 { font-size: 1.1em; }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror li {
          margin: 0.25em 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1em;
          margin: 0.5em 0;
          color: #6b7280;
          font-style: italic;
        }
        .ProseMirror code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .ProseMirror pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 12px 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.9em;
          margin: 0.5em 0;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1em 0;
        }
        .ProseMirror a {
          color: #7c3aed;
          text-decoration: underline;
        }
        .ProseMirror mark {
          background: #fef08a;
          padding: 1px 4px;
          border-radius: 2px;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
}
