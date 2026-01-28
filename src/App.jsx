import React from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import FamilyApp from "./screens/FamilyApp.jsx";
import AdminApp from "./screens/AdminApp.jsx";

function DefaultFamilyRedirect() {
  return <Navigate to="/family/rosa-family" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      <Routes>
        <Route path="/" element={<DefaultFamilyRedirect />} />
        <Route path="/family/:listId" element={<FamilyAppWrapper />} />
        <Route path="/admin/:token" element={<AdminAppWrapper />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function FamilyAppWrapper() {
  const { listId } = useParams();
  return <FamilyApp listId={listId} />;
}

function AdminAppWrapper() {
  const { token } = useParams();
  return <AdminApp token={token} />;
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen px-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">הדף לא נמצא</h1>
        <p className="text-slate-500">בדוק את הכתובת או חזור לרשימת המשפחה.</p>
      </div>
    </div>
  );
}
