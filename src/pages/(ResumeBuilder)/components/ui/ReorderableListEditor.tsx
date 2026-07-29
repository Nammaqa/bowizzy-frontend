import React, { useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

interface ReorderableListEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MAX_ITEM_LENGTH = 200;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const cleanListText = (value: string) =>
  value
    .replace(/^\s*([*-]|\u2022|\d+[.)])\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_ITEM_LENGTH);

const parseListItems = (value: string): string[] => {
  if (!value) return [""];

  if (typeof document === "undefined") {
    return value
      .split(/\r?\n/)
      .map(cleanListText)
      .filter(Boolean);
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = value;

  const listItems = Array.from(wrapper.querySelectorAll("li"))
    .map((item) => cleanListText(item.textContent || ""))
    .filter(Boolean);

  if (listItems.length) return listItems;

  const blockItems = Array.from(wrapper.querySelectorAll("div, p"))
    .map((item) => cleanListText(item.textContent || ""))
    .filter(Boolean);

  if (blockItems.length) return blockItems;

  const textItems = wrapper.textContent || value;
  const parsed = textItems
    .split(/\r?\n/)
    .map(cleanListText)
    .filter(Boolean);

  return parsed.length ? parsed : [""];
};

const serializeListItems = (items: string[]) => {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  if (!cleaned.length) return "";

  return `<ul style="list-style-type: disc; padding-left: 1.25rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">${cleaned
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
};

export default function ReorderableListEditor({
  value,
  onChange,
  placeholder = "Add list item",
}: ReorderableListEditorProps) {
  const parsedValue = useMemo(() => parseListItems(value), [value]);
  const [items, setItems] = useState<string[]>(parsedValue);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const textareaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);

  useEffect(() => {
    const currentHtml = serializeListItems(items);
    if (currentHtml !== value) {
      setItems(parsedValue);
    }
  }, [value, parsedValue]);

  useEffect(() => {
    textareaRefs.current.forEach((textarea) => {
      if (!textarea) return;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [items]);

  const commitItems = (nextItems: string[]) => {
    const normalized = nextItems.length
      ? nextItems.map((item) => item.slice(0, MAX_ITEM_LENGTH))
      : [""];
    setItems(normalized);
    onChange(serializeListItems(normalized));
  };

  const updateItem = (index: number, nextValue: string) => {
    const nextItems = items.map((item, itemIndex) =>
      itemIndex === index ? nextValue.slice(0, MAX_ITEM_LENGTH) : item
    );
    commitItems(nextItems);
  };

  const addItem = (index?: number) => {
    const insertAt = typeof index === "number" ? index + 1 : items.length;
    const nextItems = [...items];
    nextItems.splice(insertAt, 0, "");
    commitItems(nextItems);
  };

  const removeItem = (index: number) => {
    commitItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    commitItems(nextItems);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null) return;
    moveItem(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  return (
    <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-gray-50 border-b border-gray-200 px-3 py-2">
        <span className="text-xs font-semibold text-gray-600"></span>
        <button
          type="button"
          onClick={() => addItem()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      <div className="p-3 space-y-2">
        {items.map((item, index) => (
          <div
            key={`${index}-${items.length}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => setDraggedIndex(null)}
            className={`flex items-start gap-2 rounded-lg border bg-white p-2 transition-colors ${
              draggedIndex === index ? "border-orange-300 bg-orange-50" : "border-gray-200"
            }`}
          >
            <button
              type="button"
              title="Drag to reorder"
              draggable
              onDragStart={() => setDraggedIndex(index)}
              className="mt-2 text-gray-400 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <textarea
              ref={(element) => {
                textareaRefs.current[index] = element;
              }}
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              onInput={(event) => {
                const textarea = event.currentTarget;
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
              }}
              placeholder={placeholder}
              maxLength={MAX_ITEM_LENGTH}
              rows={1}
              className="min-h-10 flex-1 resize-none overflow-hidden rounded-md border border-gray-200 px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />

            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => removeItem(index)}
                title="Remove"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
