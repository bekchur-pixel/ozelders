"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { Lesson } from "@/lib/types";
import {
  tl,
  fmtDateTime,
  isToday,
  startOfToday,
  endOfWeek,
  toInputValue,
  whatsappLink,
} from "@/lib/utils";

function DerslerIcerik() {
  const { user } = useAuth();
  const params = useSearchParams();
  const initial = params.get("filtre") === "borc" ? "borc" : "hepsi";
  const [filtre, setFiltre] = useState(initial);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editDuration, setEditDuration] = useState("60");
  const [editFee, setEditFee] = useState("0");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "lessons"), orderBy("date", "desc"));
    const un = onSnapshot(q, (s) =>
      setLessons(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lesson, "id">) })))
    );
    return () => un();
  }, [user]);

  const filtered = useMemo(() => {
    let l = lessons;
    if (filtre === "bugun") l = l.filter((x) => isToday(x.date));
    if (filtre === "hafta")
      l = l.filter((x) => x.date >= startOfToday() && x.date <= endOfWeek());
    if (filtre === "borc")
      l = l.filter((x) => x.status === "done" && !x.paid);
    if (filtre === "gelecek")
      l = l.filter((x) => x.date >= startOfToday() && x.status === "planned");
    return l;
  }, [lessons, filtre]);

  function openEdit(l: Lesson) {
    setEditing(l);
    setEditDate(toInputValue(l.date));
    setEditDuration(String(l.durationMin || 60));
    setEditFee(String(l.fee || 0));
    setEditNote(l.note || "");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const ts = new Date(editDate).getTime();
    if (isNaN(ts)) {
      alert("Geçerli bir tarih seçin.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "lessons", editing.id), {
        date: ts,
        durationMin: Number(editDuration) || 60,
        fee: Number(editFee) || 0,
        note: editNote.trim(),
      });
      setEditing(null);
    } catch (err: unknown) {
      alert(`Kaydedilemedi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function cancelGroup(l: Lesson) {
    if (!l.groupId) return;
    const adet = lessons.filter((x) => x.groupId === l.groupId).length;
    if (!confirm(`${l.studentName} için ${adet} tekrarlı dersin tamamı iptal edilsin mi?`))
      return;
    try {
      await Promise.all(
        lessons
          .filter((x) => x.groupId === l.groupId && x.status !== "cancelled")
          .map((x) => updateDoc(doc(db, "lessons", x.id), { status: "cancelled" }))
      );
    } catch (err: unknown) {
      alert(`İptal edilemedi: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!user) return null;

  const pill = (k: string, label: string) => (
    <button
      key={k}
      onClick={() => setFiltre(k)}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
        filtre === k ? "bg-rose-800 text-white" : "bg-white text-stone-600 shadow-sm"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pill("hepsi", "Tümü")}
        {pill("bugun", "Bugün")}
        {pill("hafta", "Bu hafta")}
        {pill("gelecek", "Gelecek")}
        {pill("borc", "🔴 Borçlular")}
      </div>

      <Link
        href="/dersler/yeni"
        className="block rounded-2xl bg-rose-800 py-3 text-center font-bold text-white"
      >
        ＋ Yeni Randevu Oluştur
      </Link>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500 shadow-sm">
          Bu filtrede ders yok.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((l) => {
            const wa = whatsappLink(
              l.phone,
              `Merhaba, ${fmtDateTime(l.date)} piyano dersimiz hatırlatması 🎹 (${l.studentName})`
            );
            return (
              <li key={l.id} className="rounded-2xl bg-white p-3.5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{l.studentName}</p>
                    <p className="text-xs text-stone-500">
                      📅 {fmtDateTime(l.date)} • {l.durationMin} dk
                    </p>
                    <p className="mt-1 text-xs">
                      <span className="font-bold">{tl(l.fee)}</span>{" "}
                      <span
                        className={
                          l.paid ? "text-emerald-700" : "text-red-600 font-bold"
                        }
                      >
                        {l.paid ? "• ödendi" : "• ödenmedi"}
                      </span>{" "}
                      <span className="text-stone-400">
                        {l.status === "done"
                          ? "• yapıldı ✅"
                          : l.status === "cancelled"
                            ? "• iptal ❌"
                            : "• planlandı ⏳"}
                      </span>
                    </p>
                  </div>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      className="shrink-0 rounded-lg bg-green-500 px-2.5 py-2 text-xs font-bold text-white"
                    >
                      WA
                    </a>
                  )}
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  <button
                    onClick={() =>
                      updateDoc(doc(db, "lessons", l.id), { paid: !l.paid })
                    }
                    className={`flex-1 rounded-lg py-2 text-xs font-bold ${
                      l.paid
                        ? "bg-stone-100 text-stone-500"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {l.paid ? "Ödenmedi yap" : "💰 Ödendi işaretle"}
                  </button>
                  {l.status !== "done" && (
                    <button
                      onClick={() =>
                        updateDoc(doc(db, "lessons", l.id), { status: "done" })
                      }
                      className="flex-1 rounded-lg bg-emerald-100 py-2 text-xs font-bold text-emerald-800"
                    >
                      ✓ Yapıldı
                    </button>
                  )}
                  {l.status !== "cancelled" && (
                    <button
                      onClick={() =>
                        updateDoc(doc(db, "lessons", l.id), {
                          status: "cancelled",
                        })
                      }
                      className="rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-500"
                    >
                      İptal
                    </button>
                  )}
                  {l.groupId && (
                    <button
                      onClick={() => cancelGroup(l)}
                      className="rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-500"
                      title="Tekrarlı programın tamamını iptal et"
                    >
                      ⏹ Tümü
                    </button>
                  )}
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    onClick={() => openEdit(l)}
                    className="flex-1 rounded-lg bg-sky-100 py-2 text-xs font-bold text-sky-900"
                  >
                    📝 Tarih / Ücret Düzenle
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Ders silinsin mi?"))
                        deleteDoc(doc(db, "lessons", l.id));
                    }}
                    className="rounded-lg bg-stone-100 px-3 py-2 text-xs"
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-md space-y-2.5 rounded-t-3xl bg-white p-5 sm:rounded-3xl"
          >
            <h3 className="font-bold">
              📝 Dersi Düzenle — {editing.studentName}
            </h3>
            <label className="block">
              <span className="text-xs font-bold text-stone-500">GÜN + SAAT</span>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-bold text-stone-500">SÜRE (dk)</span>
                <select
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                >
                  <option value="30">30 dk</option>
                  <option value="45">45 dk</option>
                  <option value="60">60 dk</option>
                  <option value="90">90 dk</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-stone-500">ÜCRET (₺)</span>
                <input
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
                  inputMode="numeric"
                  value={editFee}
                  onChange={(e) => setEditFee(e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-stone-500">NOT</span>
              <input
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl bg-stone-100 py-3 font-bold text-stone-600"
              >
                Vazgeç
              </button>
              <button
                disabled={saving}
                className="flex-1 rounded-xl bg-rose-800 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DerslerPage() {
  return (
    <Suspense>
      <DerslerIcerik />
    </Suspense>
  );
}
