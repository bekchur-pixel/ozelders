"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { Lesson } from "@/lib/types";
import {
  tl,
  fmtTime,
  ayniGun,
  ayEtiketi,
  aydanOnce,
  aydanSonra,
  gunBaslangici,
  gunBitisi,
  isToday,
} from "@/lib/utils";

const HAFTANIN_GUNLERI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function TakvimPage() {
  const { user } = useAuth();
  const [ay, setAy] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  });
  const [seciliGun, setSeciliGun] = useState<number>(() => gunBaslangici(Date.now()));
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "lessons"), orderBy("date", "asc"));
    const un = onSnapshot(q, (s) =>
      setLessons(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lesson, "id">) })))
    );
    return () => un();
  }, [user]);

  const gunler = useMemo(() => {
    const d = new Date(ay);
    const yil = d.getFullYear();
    const ayNo = d.getMonth();
    const ilk = new Date(yil, ayNo, 1);
    const baslangicPazartesi = (ilk.getDay() + 6) % 7; // 0 = pazartesi
    const aySonu = new Date(yil, ayNo + 1, 0).getDate();
    const oncekiAySonu = new Date(yil, ayNo, 0).getDate();
    const hucreler: { ts: number; buAyMi: boolean }[] = [];
    for (let i = baslangicPazartesi - 1; i >= 0; i--) {
      hucreler.push({
        ts: new Date(yil, ayNo - 1, oncekiAySonu - i).getTime(),
        buAyMi: false,
      });
    }
    for (let g = 1; g <= aySonu; g++) {
      hucreler.push({ ts: new Date(yil, ayNo, g).getTime(), buAyMi: true });
    }
    while (hucreler.length % 7 !== 0) {
      const son = hucreler[hucreler.length - 1].ts;
      hucreler.push({ ts: son + 24 * 60 * 60 * 1000, buAyMi: false });
    }
    return hucreler;
  }, [ay]);

  const gunDersleri = useMemo(
    () => lessons.filter((l) => l.date >= gunBaslangici(seciliGun) && l.date <= gunBitisi(seciliGun)),
    [lessons, seciliGun]
  );
  const gunDersleriSirali = useMemo(() => [...gunDersleri].sort((a, b) => a.date - b.date), [gunDersleri]);

  const dersSayisi = useMemo(() => {
    const map = new Map<number, { toplam: number; odenmemis: number }>();
    for (const l of lessons) {
      const ts = gunBaslangici(l.date);
      const k = map.get(ts) ?? { toplam: 0, odenmemis: 0 };
      k.toplam++;
      if (l.status !== "cancelled" && !l.paid) k.odenmemis++;
      map.set(ts, k);
    }
    return map;
  }, [lessons]);

  if (!user) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            onClick={() => setAy(aydanOnce(ay))}
            className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-bold text-stone-600"
          >
            ‹ Önceki
          </button>
          <p className="text-base font-extrabold">{ayEtiketi(new Date(ay).getFullYear(), new Date(ay).getMonth())}</p>
          <button
            onClick={() => setAy(aydanSonra(ay))}
            className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-bold text-stone-600"
          >
            Sonraki ›
          </button>
        </div>

        <div className="grid grid-cols-7">
          {HAFTANIN_GUNLERI.map((g) => (
            <p key={g} className="py-1 text-center text-[11px] font-bold text-stone-400">
              {g}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {gunler.map(({ ts, buAyMi }) => {
            const k = dersSayisi.get(gunBaslangici(ts));
            const secili = ayniGun(ts, seciliGun);
            const bugun = isToday(ts);
            return (
              <button
                key={ts}
                onClick={() => setSeciliGun(gunBaslangici(ts))}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                  secili
                    ? "bg-rose-800 text-white"
                    : bugun
                      ? "bg-rose-100 text-rose-900"
                      : buAyMi
                        ? "bg-stone-50 text-stone-800"
                        : "bg-transparent text-stone-300"
                }`}
              >
                <span className={`font-bold ${secili ? "" : bugun ? "" : ""}`}>
                  {new Date(ts).getDate()}
                </span>
                {k && k.toplam > 0 && (
                  <span
                    className={`mt-0.5 flex items-center gap-0.5 text-[9px] font-bold ${
                      secili ? "text-white" : k.odenmemis > 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        secili
                          ? "bg-white"
                          : k.odenmemis > 0
                            ? "bg-red-500"
                            : "bg-emerald-500"
                      }`}
                    />
                    {k.toplam}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">
            📅{" "}
            {new Intl.DateTimeFormat("tr-TR", {
              day: "numeric",
              month: "long",
              weekday: "long",
            }).format(new Date(seciliGun))}
          </h2>
          <Link
            href={`/dersler/yeni?tarih=${seciliGun}`}
            className="rounded-xl bg-rose-800 px-3 py-2 text-xs font-bold text-white"
          >
            + Ders Ekle
          </Link>
        </div>

        {gunDersleriSirali.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Bu gün için ders yok.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {gunDersleriSirali.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-rose-50 font-bold text-rose-900">
                  <span className="text-sm leading-none">{fmtTime(l.date)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{l.studentName}</p>
                  <p className="text-xs text-stone-500">
                    {l.durationMin} dk • {tl(l.fee)} •{" "}
                    {l.status === "done"
                      ? "✅ yapıldı"
                      : l.status === "cancelled"
                        ? "❌ iptal"
                        : "⏳ planlı"}{" "}
                    {l.paid ? "• 💰 ödendi" : l.status !== "cancelled" ? "• 🔴 ödenmedi" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}