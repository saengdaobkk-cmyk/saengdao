import { useEffect, useState } from "react";

// นับถอยหลังเวลาที่เหลือของ Hot Deal → "1 วัน 5 ชม. 40 นาที" / "1 ชม. 30 นาที" / "45 วินาที"
function fmtRemain(ms) {
  if (ms <= 0) return "";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d} วัน ${h} ชม. ${m} นาที`;
  if (h > 0) return `${h} ชม. ${m} นาที`;
  if (m > 0) return `${m} นาที ${sec} วิ`;
  return `${sec} วินาที`;
}

// แสดงเวลาที่เหลือแบบ live (รวมตัวคั่น " · " ในตัว) · คืน null ถ้าไม่มีวันสิ้นสุดหรือหมดเวลาแล้ว
export default function HotDealCountdown({ end, prefix = "เหลืออีก", separator = " · " }) {
  const endMs = end ? new Date(end).getTime() : null;
  const [now, setNow] = useState(Date.now());
  const remain = endMs ? endMs - now : 0;

  // ใกล้หมด (< 1 ชม.) เดินวินาที · ไกลกว่านั้นเดินทุก 30 วิ พอ
  useEffect(() => {
    if (!endMs || endMs - Date.now() <= 0) return;
    const step = endMs - Date.now() < 3600 * 1000 ? 1000 : 30000;
    const id = setInterval(() => setNow(Date.now()), step);
    return () => clearInterval(id);
  }, [endMs, remain > 0]);

  if (!endMs || remain <= 0) return null;

  return <span>{separator}{prefix} {fmtRemain(remain)}</span>;
}
