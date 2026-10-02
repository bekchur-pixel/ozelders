"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, logout } from "@/components/AuthProvider";
import type { Lesson, Student } from "@/lib/types";
import {
  tl,
  fmtTime,
  fmtDate,
  isToday,
  startOfToday,
  endOfWeek,
  ayBaslangici,
  aySonu,
  whatsappLink,
} from "@/lib/utils";

export default function Home() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!user) return;
    const q1 = query(collection(db, "lessons"), orderBy("date", "asc"));
    const un1 = onSnapshot(q1, (s) =>
      setLessons(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lesson, "id">) })))
    );
    const q2 = query(collection(db, "students"), orderBy("name", "asc"));
    const un2 = onSnapshot(q2, (s) =>
      setStudents(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) })))
    );
    return () => {
      un1();
      un2();
    };
  }, [user]);

  const today = useMemo(
    () => lessons.filter((l) => isToday(l.date) && l.status !== "cancelled"),
    [lessons]
  );
  const week = useMemo(
    () =>
      lessons.filter(
        (l) =>
          l.date >= startOfToday() &&
          l.date <= endOfWeek() &&
          l.status !== "cancelled"
      ),
    [lessons]
  );
  const unpaid = useMemo(
    () => lessons.filter((l) => l.status === "done" && !l.paid),
    [lessons]
  );
  const unpaidTotal = unpaid.reduce((a, l) => a + (l.fee || 0), 0);

  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setSimdi(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const ayIcinde = useMemo(
    () =>
      lessons.filter(
        (l) => l.date >= ayBaslangici(simdi) && l.date <= aySonu(simdi)
      ),
    [lessons, simdi]
  );
  const ayKazanc = useMemo(
    () =>
      ayIcinde
        .filter((l) => l.status === "done" && l.paid)
        .reduce((a, l) => a + (l.fee || 0), 0),
    [ayIcinde]
  );
  const ayDersSayisi = ayIcinde.filter((l) => l.status === "done").length;

  async function togglePaid(l: Lesson) {
    await updateDoc(doc(db, "lessons", l.id), { paid: !l.paid });
  }
  async function markDone(l: Lesson) {
    await updateDoc(doc(db, "lessons", l.id), { status: "done" });
  }

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-rose-900 p-4 text-white">
          <p className="text-xs opacity-80">Bugün</p>
          <p className="text-2xl font-extrabold">{today.length} ders</p>
          <p className="mt-1 text-[11px] opacity-80">
            {today.filter((t) => t.status === "done").length} tamamlandı
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Bekleyen ödeme</p>
          <p className="text-2xl font-extrabold text-red-700">
            {tl(unpaidTotal)}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">
            {unpaid.length} ders ödenmedi
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">🎹 Bugünkü Dersler</h2>
          <Link href="/dersler/yeni" className="text-sm font-bold text-rose-700">
            + Yeni
          </Link>
        </div>
        {today.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            Bugün ders yok. İyi dinlenmeler! ☕
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {today.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-rose-50 font-bold text-rose-900">
                  <span className="text-sm leading-none">{fmtTime(l.date)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{l.studentName}</p>
                  <p className="text-xs text-stone-500">
                    {l.durationMin} dk • {tl(l.fee)} •{" "}
                    {l.status === "done" ? "✅ yapıldı" : "⏳ planlandı"} •{" "}
                    {l.paid ? "💰 ödendi" : "🔴 ödenmedi"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {l.status !== "done" && (
                    <button
                      onClick={() => markDone(l)}
                      className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-bold text-emerald-800"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => togglePaid(l)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                      l.paid
                        ? "bg-stone-100 text-stone-500"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {l.paid ? "Ödendi" : "Öde"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">💰 Ödenmemiş Dersler</h2>
        {unpaid.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            Tüm ödemeler tamam. 🎉
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {unpaid.slice(0, 8).map((l) => {
              const wa = whatsappLink(
                l.phone,
                `Merhaba, ${fmtDate(l.date)} tarihli piyano ders ücreti ${tl(
                  l.fee
                )} hatırlatması. Teşekkürler 🎹`
              );
              return (
                <li
                  key={l.id}
                  className="flex items-center gap-2 rounded-xl bg-red-50/60 p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {l.studentName}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(l.date).toLocaleDateString("tr-TR")} •{" "}
                      {tl(l.fee)}{" "}
                      <span className="font-bold text-red-600">
                        • ÖDENMEDİ
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => togglePaid(l)}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    ✓ Ödendi Yap
                  </button>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      className="shrink-0 rounded-lg bg-green-500 px-3 py-2 text-xs font-bold text-white"
                    >
                      WA
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/dersler?filtre=borc"
          className="mt-3 block text-center text-sm font-bold text-rose-700"
        >
          Tümünü gör →
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">📅 Bu Hafta ({week.length})</h2>
        <ul className="mt-2 space-y-1.5">
          {week.slice(0, 6).map((l) => (
            <li key={l.id} className="text-sm">
              <span className="font-bold">{fmtTime(l.date)}</span>{" "}
              <span className="text-stone-500">
                {new Date(l.date).toLocaleDateString("tr-TR", {
                  weekday: "short",
                })}
              </span>{" "}
              — {l.studentName}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 p-3">
          <div>
            <p className="text-xs font-bold text-emerald-800">
              💰 Bu Ay Tahsilat
            </p>
            <p className="text-sm text-emerald-700">
              {ayDersSayisi} ders • {tl(ayKazanc)}
            </p>
          </div>
          <span className="text-lg">📈</span>
        </div>
        <p className="mt-3 text-[11px] text-stone-400">
          {students.length} öğrenci kayıtlı •{" "}
          <button onClick={logout} className="underline">
            Çıkış yap
          </button>
        </p>
      </div>
    </div>
  );
}
