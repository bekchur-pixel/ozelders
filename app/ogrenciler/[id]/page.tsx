"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { StudentEditModal } from "@/components/StudentEditModal";
import type { Lesson, Student } from "@/lib/types";
import {
  tl,
  fmtDateTime,
  isToday,
  startOfToday,
  whatsappLink,
} from "@/lib/utils";

export default function OgrenciDetayPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    const unS = onSnapshot(
      doc(db, "students", id),
      (d) => setStudent(d.exists() ? ({ id: d.id, ...(d.data() as Omit<Student, "id">) }) : null),
      () => setErr("Öğrenci bilgisi okunamadı.")
    );
    const q = query(
      collection(db, "lessons"),
      where("studentId", "==", id)
    );
    const unL = onSnapshot(
      q,
      (s) =>
        setLessons(
          s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lesson, "id">) }))
        ),
      () => setErr("Ders listesi okunamadı.")
    );
    return () => {
      unS();
      unL();
    };
  }, [user, id]);

  const upcoming = useMemo(
    () =>
      lessons
        .filter((l) => l.date >= startOfToday() && l.status !== "cancelled")
        .sort((a, b) => a.date - b.date),
    [lessons]
  );
  const past = useMemo(
    () =>
      lessons
        .filter((l) => l.date < startOfToday() && l.status !== "cancelled")
        .sort((a, b) => b.date - a.date),
    [lessons]
  );
  const doneLessons = useMemo(
    () => lessons.filter((l) => l.status === "done"),
    [lessons]
  );
  const totalCollected = useMemo(
    () => doneLessons.filter((l) => l.paid).reduce((a, l) => a + (l.fee || 0), 0),
    [doneLessons]
  );
  const debt = useMemo(
    () => doneLessons.filter((l) => !l.paid).reduce((a, l) => a + (l.fee || 0), 0),
    [doneLessons]
  );

  if (!user) return null;
  if (!student && !err) return <p className="py-10 text-center">Yükleniyor…</p>;
  if (!student)
    return <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">⚠️ {err}</p>;

  const wa = whatsappLink(
    student.phone,
    `Merhaba ${student.parentName || ""}, ${student.name} için piyano ders programı hakkında yazıyorum 🎹`
  );

  return (
    <div className="space-y-3">
      <button
        onClick={() => router.push("/ogrenciler")}
        className="text-sm font-bold text-rose-700"
      >
        ← Öğrenciler
      </button>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xl font-bold text-rose-800">
            {student.name.charAt(0).toLocaleUpperCase("tr-TR")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{student.name}</p>
            <p className="text-xs text-stone-500">
              {student.parentName && `${student.parentName} • `}
              {student.phone || "telefon yok"}
              {student.note && ` • ${student.note}`}
            </p>
          </div>
          <Link
            href={`/dersler/yeni?ogrenci=${student.id}`}
            className="shrink-0 rounded-lg bg-rose-800 px-3 py-2 text-xs font-bold text-white"
          >
            + Ders Ekle
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
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-lg bg-sky-100 px-2.5 py-2 text-xs font-bold text-sky-900"
            title="Düzenle"
          >
            ✏️
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-600 p-4 text-white">
          <p className="text-xs opacity-80">Toplam Tahsilat</p>
          <p className="text-2xl font-extrabold">{tl(totalCollected)}</p>
          <p className="mt-1 text-[11px] opacity-80">
            {doneLessons.filter((l) => l.paid).length} ders ödendi
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Güncel Borç</p>
          <p className={`text-2xl font-extrabold ${debt > 0 ? "text-red-700" : "text-emerald-700"}`}>
            {tl(debt)}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">
            {doneLessons.filter((l) => !l.paid).length} ders ödenmedi
          </p>
          {debt > 0 && (
            (() => {
              const borcWa = whatsappLink(
                student.phone,
                `Merhaba ${student.parentName || ""}, ${student.name} için ${tl(
                  debt
                )} tutarında piyano ders ücreti borcu kaldı. Kolayca ödeyebilirsiniz, teşekkürler 🎹`
              );
              if (!borcWa) return null;
              return (
                <a
                  href={borcWa}
                  target="_blank"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white"
                >
                  💬 Borcu WhatsApp ile Hatırlat
                </a>
              );
            })()
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">📅 Gelecek Dersler ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Planlanmış ders yok.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {upcoming.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {isToday(l.date) ? "Bugün • " : ""}
                    {fmtDateTime(l.date)}
                  </p>
                  <p className="text-xs text-stone-500">
                    {l.durationMin} dk • {tl(l.fee)} •{" "}
                    {l.status === "planned" ? "planlandı ⏳" : "yapıldı ✅"}
                  </p>
                </div>
                {l.status === "planned" && (
                  <button
                    onClick={() =>
                      updateDoc(doc(db, "lessons", l.id), { status: "done" })
                    }
                    className="shrink-0 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800"
                  >
                    ✓ Yapıldı
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">🗓 Geçmiş Dersler ({past.length})</h2>
        {past.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Henüz geçmiş ders yok.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {past.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{fmtDateTime(l.date)}</p>
                  <p className="text-xs text-stone-500">
                    {l.durationMin} dk • {tl(l.fee)}{" "}
                    {l.status === "done" && (
                      <span className={l.paid ? "text-emerald-700" : "font-bold text-red-600"}>
                        • {l.paid ? "ödendi" : "ÖDENMEDİ"}
                      </span>
                    )}
                    {l.status === "cancelled" && (
                      <span className="text-stone-400">• iptal</span>
                    )}
                  </p>
                </div>
                {l.status === "planned" && (
                  <button
                    onClick={() =>
                      updateDoc(doc(db, "lessons", l.id), { status: "done" })
                    }
                    className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white"
                    title="Dersi borç bakiyesine ekler"
                  >
                    💸 Borca Ekle
                  </button>
                )}
                {l.status === "done" && (
                  <button
                    onClick={() =>
                      updateDoc(doc(db, "lessons", l.id), { paid: !l.paid })
                    }
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${
                      l.paid
                        ? "bg-stone-100 text-stone-500"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {l.paid ? "Ödenmedi" : "💰 Ödendi"}
                  </button>
                )}
                {l.status === "done" && !l.paid && (
                  <button
                    onClick={() =>
                      updateDoc(doc(db, "lessons", l.id), { status: "cancelled" })
                    }
                    className="shrink-0 rounded-lg bg-stone-100 px-2 py-2 text-xs text-stone-500"
                    title="Borçtan düş"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && student && (
        <StudentEditModal student={student} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}