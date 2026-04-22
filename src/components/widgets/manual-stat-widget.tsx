"use client";

import { useState, useEffect } from "react";
import { Pencil, Check } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { WidgetConfig } from "@/types/widget";

const STORAGE_PREFIX = "nh-manual-stat-";

export function ManualStatWidget({ config }: { config: WidgetConfig }) {
  const storageKey = STORAGE_PREFIX + config.id;
  const [value, setValue] = useState<number>(config.manualValue ?? 0);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      setValue(Number(saved));
    }
  }, [storageKey]);

  const handleSave = () => {
    const num = Number(inputVal);
    if (!isNaN(num)) {
      setValue(num);
      localStorage.setItem(storageKey, String(num));
    }
    setEditing(false);
  };

  const handleStartEdit = () => {
    setInputVal(String(value));
    setEditing(true);
  };

  return (
    <div className="flex flex-col justify-between h-full px-3 py-2">
      <div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              className="w-24 text-xl font-bold text-foreground bg-muted/50 border border-border rounded px-2 py-0.5 outline-none focus:border-primary"
            />
            <button
              onClick={handleSave}
              className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Check className="h-4 w-4 text-primary" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-foreground">{formatNumber(value)}</p>
            <button
              onClick={handleStartEdit}
              className="p-1 rounded hover:bg-muted transition-all"
              title="Edit value"
            >
              <Pencil className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        )}
      </div>
      <p className="text-[11px] text-primary/60 font-medium">Click pencil to edit</p>
    </div>
  );
}
