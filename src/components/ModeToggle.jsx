import React from "react";
import clsx from "clsx";

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm">
      <button
        className={clsx(
          "px-4 py-1 rounded-full transition",
          mode === "list"
            ? "bg-white shadow text-slate-900"
            : "text-slate-500 hover:text-slate-700"
        )}
        onClick={() => onChange("list")}
        type="button"
      >
        רשימה
      </button>
      <button
        className={clsx(
          "px-4 py-1 rounded-full transition",
          mode === "shopping"
            ? "bg-white shadow text-slate-900"
            : "text-slate-500 hover:text-slate-700"
        )}
        onClick={() => onChange("shopping")}
        type="button"
      >
        קניות
      </button>
    </div>
  );
}
