// src/components/BottomSheet.jsx
import React from "react";
import clsx from "clsx";

export default function BottomSheet({ open, title, children, onClose }) {
  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{
          backdropFilter: open ? "blur(6px) saturate(1.05)" : "none",
          background: open ? "rgba(2,6,23,0.35)" : "transparent"
        }}
        onClick={onClose}
      />
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-xl",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ transition: "transform .32s cubic-bezier(.22,.9,.3,1)" }}
      >
        <div className="px-4 pt-3 pb-2 border-b border-slate-100">
          <div className="sheet-drag" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              className="text-slate-400 hover:text-slate-600 text-xl px-2"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
