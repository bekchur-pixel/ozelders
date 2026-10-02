"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student } from "@/lib/types";

interface Props {
  student: Student;
  onClose: () => void;
  onSaved?: () => void;
}

export function StudentEditModal({ student, onClose, onSaved }: Props) {
  const [name, setName] = useState(student.name);
  const [parentName, setParentName] = useState(student.parentName || "");
  const [phone, setPhone] = useState(student.phone || "");
  const [fee, setFee] = useState(String(student.fee || ""));
  const [note, setNote] = useState(student.note || "");
  const [active, setActive] = useState(student.active !== false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await updateDoc(doc(db, "students", student.id), {
        name: name.trim(),
        parentName: parentName.trim(),
        phone: phone.trim(),
        fee: Number(fee) || 0,
        note: note.trim(),
        active,
      });
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(
        /permission|insufficient/i.test(msg)
          ? "Kaydedilemedi: Firestore izin hatası."
          : `Kaydedilemedi: ${msg}`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <form
        onSubmit={save}
        className="w-full max-w-md space-y-2.5 rounded-t-3xl bg-white p-5 sm:rounded-3xl"
      >
        <h3 className="font-bold">✏️ Öğrenciyi Düzenle</h3>
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
        <div className="grid grid-cols-2 gap-2">
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
          type="button"
          onClick={() => setActive(!active)}
          className={`w-full rounded-xl border py-2.5 text-sm font-bold ${
            active
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-stone-300 bg-stone-50 text-stone-500"
          }`}
        >
          {active ? "✅ Aktif öğrenci" : "⏸ Pasif öğrenci (listede soluk görünür)"}
        </button>
        {err && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">⚠️ {err}</p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-stone-100 py-3 font-bold text-stone-600"
          >
            Vazgeç
          </button>
          <button
            disabled={busy}
            className="flex-1 rounded-xl bg-rose-800 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}