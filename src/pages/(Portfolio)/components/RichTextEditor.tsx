import React, { useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link, Eraser } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here...",
  minHeight = "80px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Only update innerHTML if it's different to prevent resetting selection/cursor position
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg: string = "") => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-violet-400/20 focus-within:border-violet-500 transition-all flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-gray-50 border-b border-gray-150 shrink-0 flex-wrap select-none">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // Prevents editor from losing focus
            executeCommand("bold");
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer animate-none"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("italic");
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer animate-none"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("underline");
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer animate-none"
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3 bg-gray-200 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("insertUnorderedList");
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer animate-none"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("insertOrderedList");
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer animate-none"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3 bg-gray-200 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Enter link URL:");
            if (url) executeCommand("createLink", url);
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer animate-none"
          title="Insert Link"
        >
          <Link className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3 bg-gray-200 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            if (editorRef.current) {
              editorRef.current.innerHTML = "";
            }
            onChange("");
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer ml-auto animate-none"
          title="Clear"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Input field */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full text-xs p-2.5 focus:outline-none overflow-y-auto rich-text-content"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
      <style>{`
        .rich-text-content {
          outline: none;
        }
        .rich-text-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rich-text-content ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .rich-text-content ol {
          list-style-type: decimal !important;
          padding-left: 1.25rem !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .rich-text-content a {
          color: #4f46e5 !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
}
