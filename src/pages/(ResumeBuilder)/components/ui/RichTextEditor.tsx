import React, { useRef, useState, useEffect } from "react";
import { Bold, List, ListOrdered } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  rows = 6,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [, setActiveAction] = useState<string | null>(null);
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const normalizeValueToHtml = (val: string) => {
    if (!val) return '<div><br/></div>';
    if (/<>|<[^>]+>/g.test(val)) return val;
    return val
      .split('\n')
      .map((line) => (line === '' ? '<div><br/></div>' : `<div>${escapeHtml(line)}</div>`))
      .join('');
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = normalizeValueToHtml(value || '');
    const active = document.activeElement;
    const isFocused = active && el.contains(active);
    if (el.innerHTML !== html && !isFocused) {
      el.innerHTML = html;
    }
  }, [value]);

  const exec = (command: string) => {
    setActiveAction(command);
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const before = el.innerHTML;
    document.execCommand(command, false as any, null);
    if (el.innerHTML === before) {
      if (command === 'insertUnorderedList') {
        insertHtmlAtCursor('<ul><li><br></li></ul>');
      } else if (command === 'insertOrderedList') {
        insertHtmlAtCursor('<ol><li><br></li></ol>');
      } else if (command === 'bold') {
        wrapSelectionWithTag('strong');
      }
    }
    normalizeLists(el);
    onChange(el.innerHTML);
  };

  const insertHtmlAtCursor = (html: string) => {
    const sel = document.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node;
    let lastNode;
    while ((node = tmp.firstChild)) {
      lastNode = frag.appendChild(node);
    }
    range.deleteContents();
    range.insertNode(frag);
    if (lastNode) {
      const newRange = document.createRange();
      const li = (lastNode as HTMLElement).querySelector('li') || lastNode;
      newRange.setStart(li, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  };

  const wrapSelectionWithTag = (tagName: string) => {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const wrapper = document.createElement(tagName);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    sel.removeAllRanges();
    sel.addRange(newRange);
  };

  const handleBold = () => exec('bold');
  const handleBulletPoint = () => exec('insertUnorderedList');
  const handleNumberedList = () => exec('insertOrderedList');

  const onInput = () => {
    const el = editorRef.current;
    if (!el) return;
    normalizeLists(el);
    onChange(el.innerHTML);
  };

  const normalizeLists = (el: HTMLElement) => {
    const uls = el.querySelectorAll('ul');
    uls.forEach((u) => {
      const list = u as HTMLElement;
      list.style.listStyleType = list.style.listStyleType || 'disc';
      if (!list.style.paddingLeft) list.style.paddingLeft = '1.25rem';
      if (!list.style.marginTop) list.style.marginTop = '0.5rem';
      if (!list.style.marginBottom) list.style.marginBottom = '0.5rem';
    });
    const ols = el.querySelectorAll('ol');
    ols.forEach((o) => {
      const list = o as HTMLElement;
      list.style.listStyleType = list.style.listStyleType || 'decimal';
      if (!list.style.paddingLeft) list.style.paddingLeft = '1.25rem';
      if (!list.style.marginTop) list.style.marginTop = '0.5rem';
      if (!list.style.marginBottom) list.style.marginBottom = '0.5rem';
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    // Split into lines and wrap each line in a div
    const lines = text.split('\n');
    const fragments = lines
      .filter(line => line.trim().length > 0)
      .map(line => `<div>${escapeHtml(line)}</div>`)
      .join('');

    if (fragments) {
      insertHtmlAtCursor(fragments);
      const el = editorRef.current;
      if (el) {
        onChange(el.innerHTML);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-2 bg-gray-50 border border-gray-200 rounded-t-lg">
        <button
          type="button"
          onClick={handleBold}
          title="Make selected text bold (wrap with **)"
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900"
        >
          <Bold size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={handleBulletPoint}
          title="Add bullet point"
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900"
        >
          <List size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={handleNumberedList}
          title="Add numbered list item"
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900"
        >
          <ListOrdered size={18} strokeWidth={2} />
        </button>
      </div>

      <div
        ref={editorRef}
        onInput={onInput}
        onPaste={handlePaste}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={placeholder}
        style={{ minHeight: `${rows * 1.5}rem` }}
        className="w-full px-3 py-2 sm:py-2.5 border border-t-0 border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm resize-none overflow-auto"
      />
    </div>
  );
}
