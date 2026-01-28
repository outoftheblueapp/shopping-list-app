import React from "react";
import clsx from "clsx";

export default function BottomSheet({ open, title, children, onClose }) {
  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 bg-black/30 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-xl transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="px-4 pt-3 pb-2 border-b border-slate-100">
          <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-slate-200" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              className="text-slate-400 hover:text-slate-600 text-xl px-2"
              onClick={onClose}
              type="button"
              aria-label="סגירה"
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
