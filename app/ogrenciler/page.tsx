"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { StudentEditModal } from "@/components/StudentEditModal";
import type { Student } from "@/lib/types";
import { tl, whatsappLink } from "@/lib/utils";

export default function OgrencilerPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState("750");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "students"), orderBy("name", "asc"));
    const un = onSnapshot(
      q,
      (s) =>
        setList(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }))),
      () => setErr("Liste okunamadı. Firestore kurallarını kontrol edin.")
    );
    return () => un();
  }, [user]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await addDoc(collection(db, "students"), {
        name: name.trim(),
        parentName: parentName.trim(),
        phone: phone.trim(),
        fee: Number(fee) || 0,
        note: note.trim(),
        active: true,
        createdAt: Date.now(),
      });
      setName("");
      setParentName("");
      setPhone("");
      setNote("");
      setShowForm(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(
        /permission|insufficient/i.test(msg)
          ? "Kaydedilemedi: Firestore izin hatası. Database + Rules kontrol edin."
          : `Kaydedilemedi: ${msg}`
      );
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full rounded-2xl bg-rose-800 py-3 font-bold text-white"
      >
        {showForm ? "— Kapat" : "＋ Yeni Öğrenci Ekle"}
      </button>

      {showForm && (
        <form
          onSubmit={add}
          className="space-y-2.5 rounded-2xl bg-white p-4 shadow-sm"
        >
          <input
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            placeholder="Öğrenci adı * (örn. Zeynep Y.)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            placeholder="Veli adı"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            placeholder="Veli telefonu (05__ ___ __ __)"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="Ders ücreti ₺"
              inputMode="numeric"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="Not (seviye vs.)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button
            disabled={busy}
            className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {err && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              ⚠️ {err}
            </p>
          )}
        </form>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">🎹 Öğrenciler ({list.length})</h2>
        {list.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            Henüz öğrenci yok. Yukarıdan ekleyin.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {list.map((s) => {
              const wa = whatsappLink(
                s.phone,
                `Merhaba ${s.parentName || ""}, ${s.name} için piyano ders programı hakkında yazıyorum 🎹`
              );
              return (
                <li key={s.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/ogrenciler/${s.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-800">
                        {s.name.charAt(0).toLocaleUpperCase("tr-TR")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{s.name}</p>
                        <p className="truncate text-xs text-stone-500">
                          {s.parentName && `${s.parentName} • `}
                          {s.fee ? tl(s.fee) : "ücret yok"}
                          {s.note && ` • ${s.note}`}
                        </p>
                      </div>
                    </Link>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        className="shrink-0 rounded-lg bg-green-500 px-3 py-2 text-xs font-bold text-white"
                      >
                        WA
                      </a>
                    )}
                    <button
                      onClick={() => setEditing(s)}
                      className="shrink-0 rounded-lg bg-sky-100 px-2.5 py-2 text-xs font-bold text-sky-900"
                      title="Düzenle"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${s.name} silinsin mi?`))
                          deleteDoc(doc(db, "students", s.id));
                      }}
                      className="shrink-0 rounded-lg bg-stone-100 px-2.5 py-2 text-xs text-stone-500"
                      title="Sil"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <StudentEditModal
          student={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
