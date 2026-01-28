// src/screens/FamilyApp.jsx
import React, { useMemo, useState } from "react";
import ModeToggle from "../components/ModeToggle";
import BottomSheet from "../components/BottomSheet";

const MOCK_CATEGORIES = [
  { id: 1, name_he: "מוצרי יסוד" },
  { id: 2, name_he: "פירות וירקות" },
  { id: 3, name_he: "מוצרי חלב וביצים" },
  { id: 4, name_he: "חומרי ניקוי" },
  { id: 5, name_he: "שתייה" },
];

const MOCK_BASE_ITEMS = [
  { id: 1, name_he: "קמח לבן", category_id: 1 },
  { id: 2, name_he: "סוכר", category_id: 1 },
  { id: 3, name_he: "חלב", category_id: 3 },
  { id: 4, name_he: "ביצים", category_id: 3 },
  { id: 5, name_he: "עגבניות", category_id: 2 },
  { id: 6, name_he: "מלפפונים", category_id: 2 },
  { id: 7, name_he: "נוזל כביסה", category_id: 4 },
];

let tempIdCounter = 1000;

export default function FamilyApp({ listId }) {
  const [mode, setMode] = useState("list"); // "list" | "shopping"
  const [search, setSearch] = useState("");

  const [currentList, setCurrentList] = useState([
    {
      id: 101,
      name_he: "חלב",
      category_id: 3,
      qty_text: "2 ליטר",
      comment: "אם יש במבצע 1+1 אז לקנות",
      fromCatalogId: 3,
    },
    {
      id: 102,
      name_he: "עגבניות",
      category_id: 2,
      qty_text: "6",
      comment: "",
      fromCatalogId: 5,
    },
  ]);

  // set of ids currently animating (bought)
  const [animatingIds, setAnimatingIds] = useState(new Set());

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState("catalog"); // "catalog" | "manual"
  const [selectedItem, setSelectedItem] = useState(null); // for catalog items
  const [formName, setFormName] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formSuggestBase, setFormSuggestBase] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState(null);

  const categoriesById = useMemo(
    () =>
      MOCK_CATEGORIES.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {}),
    []
  );

  const itemsInListSet = useMemo(
    () =>
      new Set(
        currentList
          .filter((x) => x.fromCatalogId != null)
          .map((x) => x.fromCatalogId)
      ),
    [currentList]
  );

  const filteredBaseItems = useMemo(() => {
    if (!search.trim()) return MOCK_BASE_ITEMS;
    const s = search.trim();
    return MOCK_BASE_ITEMS.filter((item) =>
      item.name_he.includes(s)
    );
  }, [search]);

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
    setFormCategoryId(MOCK_CATEGORIES[0]?.id ?? null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  function handleAddFromCatalog() {
    if (!selectedItem) return;
    // prevent duplicates of catalog items
    if (itemsInListSet.has(selectedItem.id)) {
      closeSheet();
      return;
    }

    const newItem = {
      id: ++tempIdCounter,
      name_he: selectedItem.name_he,
      category_id: selectedItem.category_id,
      qty_text: formQty.trim() || "",
      comment: formComment.trim() || "",
      fromCatalogId: selectedItem.id,
    };
    setCurrentList((prev) => [...prev, newItem]);
    closeSheet();
  }

  function handleAddManual() {
    if (!formName.trim()) return;
    const newItem = {
      id: ++tempIdCounter,
      name_he: formName.trim(),
      category_id: formCategoryId ?? null,
      qty_text: formQty.trim() || "",
      comment: formComment.trim() || "",
      fromCatalogId: null,
    };
    setCurrentList((prev) => [...prev, newItem]);

    // In real app: if formSuggestBase === true → send to pending queue
    closeSheet();
  }

  function handleMarkBought(id) {
    // trigger animation: add to animatingIds, then remove after 420ms
    setAnimatingIds(prev => {
      const clone = new Set(prev);
      clone.add(id);
      return clone;
    });
    setTimeout(() => {
      setCurrentList(prev => prev.filter(item => item.id !== id));
      setAnimatingIds(prev => {
        const clone = new Set(prev);
        clone.delete(id);
        return clone;
      });
    }, 420);
  }

  const allDone = currentList.length === 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-lg font-semibold shadow-sm">
              🛒
            </div>
            <div className="leading-tight">
                <div className="text-xs text-slate-500">רשימת קניות</div>
                <div className="text-sm font-semibold truncate">
                  משפחה: {listId}
                </div>
            </div>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        {/* Search */}
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
            <span className="absolute left-3 top-2.5 text-slate-400 text-lg">
              🔍
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 pt-2">
        {mode === "list" ? (
          <ListModeView
            categories={MOCK_CATEGORIES}
            baseItems={filteredBaseItems}
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

      {/* Floating add button (only in list mode) */}
      {mode === "list" && (
        <button
          className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-[96%] mx-auto rounded-full bg-indigo-500 text-white py-3 text-base font-semibold shadow-lg flex items-center justify-center gap-2"
          onClick={openManualSheet}
        >
          <span className="text-xl leading-none">＋</span>
          <span>＋ הוספה מהירה</span>
        </button>
      )}

      {/* Bottom sheet */}
      <BottomSheet
        open={sheetOpen}
        title={
          sheetMode === "catalog"
            ? selectedItem?.name_he ?? ""
            : "פריט חדש"
        }
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
            categories={MOCK_CATEGORIES}
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

/* ----- Subcomponents (kept inside file for convenience) ----- */

/* ... CatalogSheetContent and ManualSheetContent definitions omitted here to keep file concise for the patch; 
   the full file uploaded in the zip includes them as in the original app for completeness. */

