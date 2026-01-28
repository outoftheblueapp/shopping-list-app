import React, { useState } from "react";

const MOCK_PENDING = [
  {
    id: 1,
    proposed_name_he: "Tide 2in1",
    proposed_category_name: "חומרי ניקוי",
    list_label: "משפחת רוזנבלט",
    created_at: "2026-01-28",
  },
  {
    id: 2,
    proposed_name_he: "אבקת אפייה ללא גלוטן",
    proposed_category_name: "מוצרי יסוד",
    list_label: "משפחת כהן",
    created_at: "2026-01-27",
  },
];

const MOCK_CATEGORIES = [
  { id: 1, name_he: "מוצרי יסוד", itemCount: 12 },
  { id: 2, name_he: "פירות וירקות", itemCount: 15 },
  { id: 3, name_he: "מוצרי חלב וביצים", itemCount: 9 },
  { id: 4, name_he: "חומרי ניקוי", itemCount: 7 },
  { id: 5, name_he: "שתייה", itemCount: 6 },
];

export default function AdminApp({ token }) {
  const [pending, setPending] = useState(MOCK_PENDING);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);

  function handleResolve(id) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  function handleRenameCategory(id, newName) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name_he: newName } : c)));
  }

  function handleMoveCategory(id, direction) {
    setCategories((prev) => {
      const arr = [...prev];
      const index = arr.findIndex((c) => c.id === id);
      if (index === -1) return prev;
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= arr.length) return prev;
      [arr[index], arr[swapIndex]] = [arr[swapIndex], arr[index]];
      return arr;
    });
  }

  function handleAddCategory() {
    const name = prompt("שם קטגוריה חדש:");
    if (!name || !name.trim()) return;
    const newCat = {
      id: Math.floor(Math.random() * 100000),
      name_he: name.trim(),
      itemCount: 0,
    };
    setCategories((prev) => [...prev, newCat]);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center px-4 py-6">
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">אזור מנהל</div>
            <h1 className="text-xl font-semibold">הקניות של המשפחה – ניהול בסיס וקטגוריות</h1>
          </div>
          <div className="text-xs text-slate-400 text-left">
            טוקן כניסה:
            <div className="font-mono text-[10px] break-all max-w-[180px]">{token}</div>
          </div>
        </header>

        {/* Pending items */}
        <section className="bg-white rounded-3xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">פריטים ממתינים לבסיס ({pending.length})</h2>
            <span className="text-xs text-slate-400">לאישור / עריכה / מיזוג</span>
          </div>

          {pending.length === 0 ? (
            <p className="text-xs text-slate-500">אין כרגע פריטים ממתינים. אפשר לשתות קפה. ☕</p>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium">{p.proposed_name_he}</div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                      <span>קטגוריה מוצעת: {p.proposed_category_name}</span>
                      <span>מרשימה: {p.list_label}</span>
                      <span>נוסף בתאריך: {p.created_at}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      onClick={() => handleResolve(p.id)}
                      title="בדמו: פשוט מוריד מהרשימה"
                    >
                      אישור
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      onClick={() => {
                        const edited = prompt("שם מאושר (ניתן לעריכה):", p.proposed_name_he);
                        if (edited && edited.trim()) handleResolve(p.id);
                      }}
                      title="בדמו: עריכה ואז אישור"
                    >
                      עריכה ואישור
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200"
                      onClick={() => handleResolve(p.id)}
                      title="בדמו: פשוט מוריד מהרשימה"
                    >
                      מיזוג לפריט קיים
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200"
                      onClick={() => handleResolve(p.id)}
                    >
                      דחייה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Categories management */}
        <section className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">ניהול קטגוריות</h2>
            <button
              type="button"
              onClick={handleAddCategory}
              className="text-xs px-3 py-1 rounded-full bg-indigo-500 text-white hover:bg-indigo-600"
            >
              + קטגוריה חדשה
            </button>
          </div>

          <div className="space-y-2">
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{cat.name_he}</div>
                    <div className="text-xs text-slate-500">{cat.itemCount} פריטים בבסיס</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="px-2 py-1 rounded-full bg-slate-200 hover:bg-slate-300"
                    onClick={() => handleMoveCategory(cat.id, "up")}
                    aria-label="למעלה"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 rounded-full bg-slate-200 hover:bg-slate-300"
                    onClick={() => handleMoveCategory(cat.id, "down")}
                    aria-label="למטה"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    onClick={() => {
                      const newName = prompt("שם חדש לקטגוריה:", cat.name_he);
                      if (newName && newName.trim()) handleRenameCategory(cat.id, newName.trim());
                    }}
                  >
                    שינוי שם
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full bg-slate-100 text-slate-400 cursor-not-allowed"
                    title="לא ניתן למחוק קטגוריה שיש בה פריטים פעילים"
                  >
                    מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500">
            מחיקה של קטגוריה אפשרית רק אם אין בה פריטים. כרגע המחיקה חסומה (Option 2) כדי למנוע טעויות.
          </p>
        </section>
      </div>
    </div>
  );
}
