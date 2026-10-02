"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { Student } from "@/lib/types";
import { toInputValue } from "@/lib/utils";

function YeniDersForm() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const tarihParam = params.get("tarih");
  const ogrenciParam = params.get("ogrenci");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [dateStr, setDateStr] = useState(() => {
    if (tarihParam) {
      const t = Number(tarihParam);
      if (!isNaN(t) && t > 0) return toInputValue(t);
    }
    return toInputValue(Date.now() + 60 * 60 * 1000);
  });
  const [duration, setDuration] = useState("60");
  const [fee, setFee] = useState("750");
  const [repeat, setRepeat] = useState("0");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "students"), orderBy("name", "asc"));
    const un = onSnapshot(
      q,
      (s) => {
        const list = s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }));
        setStudents(list);
        if (ogrenciParam) {
          const secili = list.find((x) => x.id === ogrenciParam);
          if (secili) {
            setStudentId(secili.id);
            if (secili.fee) setFee(String(secili.fee));
          }
        }
      },
      () => setErr("Öğrenci listesi okunamadı. Firestore kurallarını kontrol edin.")
    );
    return () => un();
  }, [user, ogrenciParam]);

  function handleStudentChange(id: string) {
    setStudentId(id);
    const s = students.find((x) => x.id === id);
    if (s?.fee) setFee(String(s.fee));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) {
      alert("Önce öğrenci seçin (Öğrenci sekmesinden ekleyebilirsiniz).");
      return;
    }
    const s = students.find((x) => x.id === studentId);
    if (!s) return;
    const base = new Date(dateStr).getTime();
    if (isNaN(base)) {
      alert("Tarih seçin.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const count = Number(repeat) || 0;
      const groupId =
        count > 0 ? `g_${Date.now()}_${Math.random().toString(36).slice(2)}` : undefined;
      const total = count + 1;
      for (let i = 0; i < total; i++) {
        await addDoc(collection(db, "lessons"), {
          studentId: s.id,
          studentName: s.name,
          phone: s.phone || "",
          date: base + i * 7 * 24 * 60 * 60 * 1000,
          durationMin: Number(duration) || 60,
          fee: Number(fee) || 0,
          status: "planned",
          paid: false,
          groupId: groupId || null,
          note,
          createdAt: Date.now(),
        });
      }
      router.push("/dersler");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(
        /permission|insufficient/i.test(msg)
          ? "Kaydedilemedi: Firestore izin hatası. Database oluşturuldu mu, Rules yayınlandı mı kontrol edin."
          : `Kaydedilemedi: ${msg}`
      );
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">＋ Yeni Randevu</h2>
        <p className="text-xs text-stone-500">
          Tek ders veya haftalık tekrarlı oluştur
        </p>
      </div>

      <div className="space-y-2.5 rounded-2xl bg-white p-4 shadow-sm">
        <label className="block">
          <span className="text-xs font-bold text-stone-500">ÖĞRENCİ *</span>
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            value={studentId}
            onChange={(e) => handleStudentChange(e.target.value)}
            required
          >
            <option value="">Öğrenci seç…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-stone-500">GÜN + SAAT *</span>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-bold text-stone-500">SÜRE (dk)</span>
            <select
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
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
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-bold text-stone-500">
            TEKRAR (haftalık sabit program)
          </span>
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          >
            <option value="0">Tek seferlik</option>
            <option value="3">+3 hafta tekrarla (toplam 4 ders)</option>
            <option value="7">+7 hafta tekrarla (toplam 8 ders)</option>
            <option value="11">+11 hafta tekrarla (toplam 12 ders)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-stone-500">NOT</span>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            placeholder="örn. ilk ders, etüt…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      <button
        disabled={busy}
        className="w-full rounded-2xl bg-rose-800 py-3.5 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Kaydediliyor…" : "Randevuyu Kaydet"}
      </button>
      {err && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          ⚠️ {err}
        </p>
      )}
    </form>
  );
}

export default function YeniDersPage() {
  return (
    <Suspense>
      <YeniDersForm />
    </Suspense>
  );
}
