import React, { useEffect, useMemo, useRef, useState } from "react";
import ModeToggle from "../components/ModeToggle.jsx";
import BottomSheet from "../components/BottomSheet.jsx";
import { supabase } from "../lib/supabaseClient.js";

/**
 * LIVE MODE (Supabase) + graceful fallback to DEMO MODE
 * - If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set → Live shared list
 * - Otherwise → Demo (local state only)
 *
 * No history: when you mark as bought, the row is DELETED.
 */

// Fallback categories/catalog for demo mode (or if DB empty)
const FALLBACK_CATEGORIES = [
  { id: 1, name_he: "מוצרי יסוד" },
  { id: 2, name_he: "פירות וירקות" },
  { id: 3, name_he: "מוצרי חלב וביצים" },
  { id: 4, name_he: "חומרי ניקוי" },
  { id: 5, name_he: "שתייה" },
];

const FALLBACK_CATALOG_ITEMS = [
  { id: 1, name_he: "קמח לבן", category_id: 1 },
  { id: 2, name_he: "סוכר", category_id: 1 },
  { id: 3, name_he: "חלב", category_id: 3 },
  { id: 4, name_he: "ביצים", category_id: 3 },
  { id: 5, name_he: "עגבניות", category_id: 2 },
  { id: 6, name_he: "מלפפונים", category_id: 2 },
  { id: 7, name_he: "נוזל כביסה", category_id: 4 },
];

export default function FamilyApp({ listId }) {
  const live = Boolean(supabase);

  const [mode, setMode] = useState("list"); // "list" | "shopping"
  const [search, setSearch] = useState("");

  // Categories + catalog
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [catalogItems, setCatalogItems] = useState(FALLBACK_CATALOG_ITEMS);

  // Live list UUID (from lists.slug)
  const [listUuid, setListUuid] = useState(null);

  // Active items on shopping list
  const [currentList, setCurrentList] = useState([]);

  // For bought animation
  const [animatingIds, setAnimatingIds] = useState(new Set());

  // Bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState("catalog"); // "catalog" | "manual"
  const [selectedItem, setSelectedItem] = useState(null);

  const [formName, setFormName] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formSuggestBase, setFormSuggestBase] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState(null);

  const mountedRef = useRef(true);

  // Build lookups
  const categoriesById = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.id] = c;
    return map;
  }, [categories]);

  const itemsInListSet = useMemo(() => {
    return new Set(
      currentList
        .filter((x) => x.from_catalog_id != null)
        .map((x) => x.from_catalog_id)
    );
  }, [currentList]);

  // --- LIVE MODE: initial load ---
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function loadLive() {
      if (!supabase) return;

      // 1) categories
      const { data: cats, error: catsErr } = await supabase
        .from("categories")
        .select("*")
        .order("ordering", { ascending: true });

      if (!mountedRef.current) return;

      if (!catsErr && Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      }

      // 2) ensure list exists (by slug)
      let listRow = null;
      const { data: existing, error: existingErr } = await supabase
        .from("lists")
        .select("id, slug, title")
        .eq("slug", listId)
        .maybeSingle();

      if (!existingErr && existing?.id) {
        listRow = existing;
      } else {
        // Create list automatically (makes sharing easy)
        const { data: inserted, error: insErr } = await supabase
          .from("lists")
          .insert([{ slug: listId, title: `משפחה: ${listId}` }])
          .select("id, slug, title")
          .single();

        if (!insErr && inserted?.id) listRow = inserted;
      }

      if (!mountedRef.current) return;

      if (!listRow?.id) {
        // fallback to demo if something went wrong
        setListUuid(null);
        return;
      }

      setListUuid(listRow.id);

      // 3) load active items (no history)
      const { data: items, error: itemsErr } = await supabase
        .from("items")
        .select("*")
        .eq("list_id", listRow.id)
        .order("created_at", { ascending: true });

      if (!mountedRef.current) return;

      if (!itemsErr && Array.isArray(items)) {
        setCurrentList(items);
      }
    }

    if (live) {
      loadLive();
    } else {
      // DEMO mode: show a couple of sample items so UI isn't empty
      setCurrentList([
        {
          id: "demo-1",
          name_he: "חלב",
          category_id: 3,
          qty_text: "2 ליטר",
          comment: 'אם יש במבצע 1+1 אז לקנות',
          from_catalog_id: 3,
          created_at: new Date().toISOString(),
        },
        {
          id: "demo-2",
          name_he: "עגבניות",
          category_id: 2,
          qty_text: "6",
          comment: "",
          from_catalog_id: 5,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, live]);

  // --- LIVE MODE: realtime subscribe to items changes ---
  useEffect(() => {
    if (!supabase || !listUuid) return;

    const channel = supabase
      .channel(`items:${listUuid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `list_id=eq.${listUuid}`,
        },
        (payload) => {
          const ev = payload.eventType;
          if (ev === "INSERT") {
            const row = payload.new;
            setCurrentList((prev) => {
              if (prev.some((x) => x.id === row.id)) return prev;
              return [...prev, row].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
            });
          } else if (ev === "UPDATE") {
            const row = payload.new;
            setCurrentList((prev) => prev.map((x) => (x.id === row.id ? row : x)));
          } else if (ev === "DELETE") {
            const oldRow = payload.old;
            setCurrentList((prev) => prev.filter((x) => x.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listUuid]);

  // --- Search filtering ---
  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalogItems;
    const s = search.trim();
    return catalogItems.filter((item) => item.name_he.includes(s));
  }, [search, catalogItems]);

  const filteredCurrentList = useMemo(() => {
    if (!search.trim()) return currentList;
    const s = search.trim();
    return currentList.filter((item) => item.name_he.includes(s));
  }, [search, currentList]);

  const groupedCurrentList = useMemo(() => {
    const groups = {};
    for (const item of filteredCurrentList) {
      const cat = categoriesById[item.category_id];
      const catName = cat ? cat.name_he : "אחר";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    }
    return groups;
  }, [filteredCurrentList, categoriesById]);

  // --- Sheet helpers ---
  function openCatalogSheet(item) {
    setSheetMode("catalog");
    setSelectedItem(item);
    setFormQty("");
    setFormComment("");
    setSheetOpen(true);
  }

  function openManualSheet() {
    setSheetMode("manual");
    setSelectedItem(null);
    setFormName("");
    setFormQty("");
    setFormComment("");
    setFormSuggestBase(false);
    setFormCategoryId(categories[0]?.id ?? null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  // --- Actions ---
  async function addItemRow(row) {
    if (!supabase || !listUuid) {
      // demo mode: local push
      setCurrentList((prev) => [...prev, { ...row, id: `demo-${Date.now()}` }]);
      return;
    }
    const { error } = await supabase.from("items").insert([row]);
    if (error) {
      console.error(error);
      alert("שגיאה בהוספה. נסה שוב.");
    }
  }

  async function deleteItemRow(itemId) {
    if (!supabase || !listUuid) {
      setCurrentList((prev) => prev.filter((x) => x.id !== itemId));
      return;
    }
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) {
      console.error(error);
      alert("שגיאה בעדכון. נסה שוב.");
    }
  }

  async function handleAddFromCatalog() {
    if (!selectedItem) return;

    // prevent duplicates (client-side); DB also has a unique index we provide in SQL
    if (itemsInListSet.has(selectedItem.id)) {
      closeSheet();
      return;
    }

    await addItemRow({
      list_id: listUuid,
      name_he: selectedItem.name_he,
      category_id: selectedItem.category_id,
      qty_text: formQty.trim() || null,
      comment: formComment.trim() || null,
      from_catalog_id: selectedItem.id,
    });

    closeSheet();
  }

  async function handleAddManual() {
    if (!formName.trim()) return;

    // if user asked to add to base list → send to pending queue for admin (future)
    if (supabase && listUuid && formSuggestBase) {
      const { error } = await supabase.from("pending_items").insert([
        {
          list_id: listUuid,
          name_he: formName.trim(),
          category_id: formCategoryId ?? null,
          qty_text: formQty.trim() || null,
          comment: formComment.trim() || null,
          suggested_by: null,
        },
      ]);
      if (error) console.warn("pending insert error", error);
    }

    await addItemRow({
      list_id: listUuid,
      name_he: formName.trim(),
      category_id: formCategoryId ?? null,
      qty_text: formQty.trim() || null,
      comment: formComment.trim() || null,
      from_catalog_id: null,
    });

    closeSheet();
  }

  function handleMarkBought(itemId) {
    // Animate then delete (no history)
    setAnimatingIds((prev) => {
      const clone = new Set(prev);
      clone.add(itemId);
      return clone;
    });

    setTimeout(async () => {
      await deleteItemRow(itemId);
      setAnimatingIds((prev) => {
        const clone = new Set(prev);
        clone.delete(itemId);
        return clone;
      });
    }, 420);
  }

  const allDone = currentList.length === 0;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-lg font-semibold shadow-sm">
              🛒
            </div>
            <div className="leading-tight">
              <div className="text-xs text-slate-500">
                {live ? "רשימת קניות (משותפת)" : "רשימת קניות (דמו)"}
              </div>
              <div className="text-sm font-semibold truncate">משפחה: {listId}</div>
            </div>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        <div className="max-w-md mx-auto px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              dir="rtl"
              className="w-full rounded-2xl bg-slate-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="חיפוש פריט או קטגוריה..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-lg">🔍</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 pt-2">
        {mode === "list" ? (
          <ListModeView
            categories={categories}
            catalogItems={filteredCatalog}
            currentList={currentList}
            itemsInListSet={itemsInListSet}
            onOpenSheet={openCatalogSheet}
          />
        ) : (
          <ShoppingModeView
            groupedCurrentList={groupedCurrentList}
            allDone={allDone}
            onMarkBought={handleMarkBought}
            animatingIds={animatingIds}
          />
        )}
      </main>

      {mode === "list" && (
        <button
          className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-[96%] mx-auto rounded-full bg-indigo-500 text-white py-3 text-base font-semibold shadow-lg flex items-center justify-center gap-2"
          onClick={openManualSheet}
        >
          <span className="text-xl leading-none">＋</span>
          <span>＋ הוספה מהירה</span>
        </button>
      )}

      <BottomSheet
        open={sheetOpen}
        title={sheetMode === "catalog" ? selectedItem?.name_he ?? "" : "פריט חדש"}
        onClose={closeSheet}
      >
        {sheetMode === "catalog" ? (
          <CatalogSheetContent
            formQty={formQty}
            setFormQty={setFormQty}
            formComment={formComment}
            setFormComment={setFormComment}
            onSubmit={handleAddFromCatalog}
          />
        ) : (
          <ManualSheetContent
            categories={categories}
            formName={formName}
            setFormName={setFormName}
            formQty={formQty}
            setFormQty={setFormQty}
            formComment={formComment}
            setFormComment={setFormComment}
            formSuggestBase={formSuggestBase}
            setFormSuggestBase={setFormSuggestBase}
            formCategoryId={formCategoryId}
            setFormCategoryId={setFormCategoryId}
            onSubmit={handleAddManual}
          />
        )}
      </BottomSheet>
    </div>
  );
}

function ListModeView({ categories, catalogItems, currentList, itemsInListSet, onOpenSheet }) {
  const itemsByCategory = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.id] = [];
    for (const item of catalogItems) {
      if (!map[item.category_id]) map[item.category_id] = [];
      map[item.category_id].push(item);
    }
    return map;
  }, [categories, catalogItems]);

  return (
    <div className="space-y-4">
      {currentList.length > 0 && (
        <section className="bg-white rounded-3xl shadow-sm p-3 mb-2 card">
          <h3 className="text-xs font-semibold text-slate-500 mb-1.5">כבר ברשימה ({currentList.length})</h3>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {currentList.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1"
              >
                <span>{item.name_he}</span>
                {item.qty_text && <span className="text-[10px] text-indigo-500">{item.qty_text}</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      {categories.map((cat) => {
        const items = itemsByCategory[cat.id] || [];
        if (items.length === 0) return null;
        return (
          <section key={cat.id} className="bg-white rounded-3xl shadow-sm p-3 card">
            <h3 className="text-sm font-semibold mb-2 flex items-center justify-between">
              <span>{cat.name_he}</span>
              <span className="text-xs text-slate-400">{items.length} פריטים</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => {
                const already = itemsInListSet.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onOpenSheet(item)}
                    disabled={already}
                    className={
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition shadow-sm chip " +
                      (already
                        ? "bg-slate-100 text-slate-400 border-slate-200"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700")
                    }
                  >
                    <span>{item.name_he}</span>
                    {!already && <span className="text-slate-400 text-sm">＋</span>}
                    {already && <span className="text-[10px] text-slate-400">ברשימה</span>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ShoppingModeView({ groupedCurrentList, allDone, onMarkBought, animatingIds }) {
  if (allDone) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl mb-1">🥳</div>
          <h2 className="text-lg font-semibold">סיימת את רשימת הקניות!</h2>
          <p className="text-sm text-slate-500">אין כרגע פריטים לקנייה. אפשר לחזור למצב רשימה ולהוסיף.</p>
        </div>
      </div>
    );
  }

  const categoryNames = Object.keys(groupedCurrentList).sort();

  return (
    <div className="space-y-4">
      {categoryNames.map((catName) => (
        <section key={catName} className="bg-white rounded-3xl shadow-sm p-3 card">
          <h3 className="text-sm font-semibold mb-2">{catName}</h3>
          <div className="space-y-2">
            {groupedCurrentList[catName].map((item) => (
              <button
                key={item.id}
                onClick={() => onMarkBought(item.id)}
                className={
                  "w-full flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm hover:bg-emerald-50 hover:border-emerald-200 transition " +
                  (animatingIds.has(item.id) ? "bought-anim" : "")
                }
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name_he}</div>
                  {(item.qty_text || item.comment) && (
                    <div className="mt-0.5 text-xs text-slate-500 space-y-0.5">
                      {item.qty_text && <div className="font-medium text-slate-600">{item.qty_text}</div>}
                      {item.comment && <div>{item.comment}</div>}
                    </div>
                  )}
                </div>
                <div className="h-6 w-6 rounded-full border border-emerald-400 flex items-center justify-center text-emerald-500 text-lg">
                  ✓
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CatalogSheetContent({ formQty, setFormQty, formComment, setFormComment, onSubmit }) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-1">
        <label className="text-sm font-medium">כמות (לא חובה)</label>
        <input
          type="text"
          dir="auto"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder='לדוגמה: "2 ליטר", "5", "2 ק״ג"'
          value={formQty}
          onChange={(e) => setFormQty(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">הערה (לא חובה)</label>
        <textarea
          dir="auto"
          rows={3}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          placeholder='לדוגמה: "לקנות רק אם יש במבצע"'
          value={formComment}
          onChange={(e) => setFormComment(e.target.value)}
        />
      </div>
      <button type="submit" className="w-full rounded-full btn-primary">
        הוספה לרשימה
      </button>
    </form>
  );
}

function ManualSheetContent({
  categories,
  formName,
  setFormName,
  formQty,
  setFormQty,
  formComment,
  setFormComment,
  formSuggestBase,
  setFormSuggestBase,
  formCategoryId,
  setFormCategoryId,
  onSubmit,
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-1">
        <label className="text-sm font-medium">שם הפריט</label>
        <input
          type="text"
          dir="auto"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder='לדוגמה: "Tide 2in1", "טורטיות"'
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">כמות (לא חובה)</label>
        <input
          type="text"
          dir="auto"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder='לדוגמה: "2 ליטר", "5", "2 ק״ג"'
          value={formQty}
          onChange={(e) => setFormQty(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">הערה (לא חובה)</label>
        <textarea
          dir="auto"
          rows={3}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          placeholder='לדוגמה: "לקנות רק אם על המדף Tide"'
          value={formComment}
          onChange={(e) => setFormComment(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
        <div>
          <div className="text-sm font-medium">להציע הוספה לבסיס הפריטים?</div>
          <div className="text-xs text-slate-500">המנהל יאשר לפני שזה יופיע ברשימה הקבועה.</div>
        </div>
        <button
          type="button"
          onClick={() => setFormSuggestBase((v) => !v)}
          className={
            "relative inline-flex h-6 w-11 rounded-full border transition " +
            (formSuggestBase ? "bg-indigo-500 border-indigo-500" : "bg-slate-200 border-slate-300")
          }
        >
          <span
            className={
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transform transition " +
              (formSuggestBase ? "right-0.5" : "right-[22px]")
            }
          />
        </button>
      </div>

      {formSuggestBase && (
        <div className="space-y-1">
          <label className="text-sm font-medium">קטגוריה</label>
          <select
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            value={formCategoryId ?? ""}
            onChange={(e) => setFormCategoryId(e.target.value ? Number(e.target.value) : null)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_he}
              </option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" className="w-full rounded-full btn-primary">
        הוספה לרשימה
      </button>
    </form>
  );
}
