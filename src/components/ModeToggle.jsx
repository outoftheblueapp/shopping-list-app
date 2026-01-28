// src/components/ModeToggle.jsx
import React from "react";
import clsx from "clsx";

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="relative inline-flex items-center rounded-full bg-white/60 p-1 shadow-sm" dir="rtl">
      <div
        className={clsx(
          "absolute inset-y-0 transition-all duration-300 ease-out rounded-full bg-gradient-to-b from-white to-slate-50",
          mode === "list" ? "right-0 w-1/2" : "left-0 w-1/2"
        )}
        style={{ boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }}
      />
      <button
        onClick={() => onChange("list")}
        className={clsx(
          "relative z-10 px-4 py-1.5 rounded-full text-sm font-medium",
          mode === "list" ? "text-slate-900" : "text-slate-500"
        )}
      >
        רשימה
      </button>
      <button
        onClick={() => onChange("shopping")}
        className={clsx(
          "relative z-10 px-4 py-1.5 rounded-full text-sm font-medium",
          mode === "shopping" ? "text-slate-900" : "text-slate-500"
        )}
      >
        קניות
      </button>
    </div>
  );
}
