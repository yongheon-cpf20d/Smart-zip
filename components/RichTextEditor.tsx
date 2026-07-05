// components/RichTextEditor.tsx
// ✅ 정책 게시판 관리자 글쓰기용 리치 텍스트 에디터
// Tiptap 기반 — 볼드체, 글자색, 줄바꿈, 번호매기기/글머리기호를 버튼으로 바로 적용
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {TextStyle} from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold, List, ListOrdered, Undo, Redo, Palette,
} from "lucide-react";
import { useState } from "react";

const COLORS = [
  { label: "기본", value: "" },
  { label: "빨강", value: "#dc2626" },
  { label: "주황", value: "#ea580c" },
  { label: "초록", value: "#16a34a" },
  { label: "파랑", value: "#2563eb" },
  { label: "회색", value: "#64748b" },
];

type Props = {
  content: string;
  onChange: (html: string) => void;
};

export default function RichTextEditor({ content, onChange }: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content,
    immediatelyRender: false, // Next.js SSR 이슈 방지
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose-editor-content",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* 툴바 */}
      <div className="flex items-center gap-1 flex-wrap bg-slate-50 border-b border-slate-200 px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("bold") ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
          }`}
          title="굵게"
        >
          <Bold size={15} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("bulletList") ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
          }`}
          title="글머리 기호"
        >
          <List size={15} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("orderedList") ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
          }`}
          title="번호 매기기"
        >
          <ListOrdered size={15} strokeWidth={2.2} />
        </button>

        {/* 글자색 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker((v) => !v)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            title="글자색"
          >
            <Palette size={15} strokeWidth={2.2} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex gap-1.5 z-20">
              {COLORS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    if (c.value) {
                      editor.chain().focus().setColor(c.value).run();
                    } else {
                      editor.chain().focus().unsetColor().run();
                    }
                    setShowColorPicker(false);
                  }}
                  title={c.label}
                  className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition"
                  style={{ background: c.value || "#0f172a" }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
          title="되돌리기"
        >
          <Undo size={15} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
          title="다시실행"
        >
          <Redo size={15} strokeWidth={2.2} />
        </button>
      </div>

      {/* 에디터 본문 */}
      <div className="px-4 py-3 min-h-[200px] text-sm">
        <EditorContent editor={editor} />
      </div>

      {/* ✅ Tiptap 기본 스타일 보정 (굵게/리스트가 실제로 보이게) */}
      <style jsx global>{`
        .prose-editor-content {
          outline: none;
        }
        .prose-editor-content p {
          margin: 0 0 8px 0;
          line-height: 1.6;
        }
        .prose-editor-content strong {
          font-weight: 700;
        }
        .prose-editor-content ul {
          list-style: disc;
          padding-left: 20px;
          margin: 4px 0 8px 0;
        }
        .prose-editor-content ol {
          list-style: decimal;
          padding-left: 20px;
          margin: 4px 0 8px 0;
        }
        .prose-editor-content li {
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
}