import { useEffect, useRef, useState } from "react";
import type { PengingatPanenInfo } from "../types";

/**
 * Hook untuk mengelola notifikasi browser / PWA Push saat panen lewat jadwal.
 * - Minta permission saat pertama kali dipanggil
 * - Tampilkan notifikasi satu kali per kebun per hari (persisted di localStorage)
 */
export function useHarvestNotification(pengingatList: PengingatPanenInfo[]) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const sentRef = useRef<Set<string>>(new Set());

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return "denied";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const sendNotification = (title: string, body: string, tag: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      new Notification(title, {
        body,
        tag,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        requireInteraction: false,
      });
    } catch (e) {
      console.warn("Notification error:", e);
    }
  };

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const today = new Date().toISOString().split("T")[0];
    const storageKey = `sawitku_notif_sent_${today}`;

    let alreadySentToday: Set<string>;
    try {
      const raw = localStorage.getItem(storageKey);
      alreadySentToday = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      alreadySentToday = new Set();
    }

    const overdueList = pengingatList.filter(
      (p) => p.status === "LEWAT_JADWAL" || p.status === "HARI_INI"
    );

    let changed = false;
    overdueList.forEach((p) => {
      const key = `${p.kebunId}_${today}`;
      if (!alreadySentToday.has(key) && !sentRef.current.has(key)) {
        const isOverdue = p.status === "LEWAT_JADWAL";
        const title = isOverdue
          ? `Panen Terlambat: ${p.namaKebun}`
          : `Jadwal Panen Hari Ini: ${p.namaKebun}`;
        const body = isOverdue
          ? `Blok ${p.namaKebun} sudah ${Math.abs(p.hariTersisa)} hari melewati jadwal panen rotasi ${p.rotasiHari} hari.`
          : `Blok ${p.namaKebun} dijadwalkan panen hari ini (rotasi ${p.rotasiHari} hari). Segera catat panen!`;

        sendNotification(title, body, `harvest_${p.kebunId}`);
        alreadySentToday.add(key);
        sentRef.current.add(key);
        changed = true;
      }
    });

    if (changed) {
      try {
        localStorage.setItem(storageKey, JSON.stringify([...alreadySentToday]));
      } catch {
        // ignore
      }
    }
  }, [pengingatList]);

  return { permission, requestPermission };
}
