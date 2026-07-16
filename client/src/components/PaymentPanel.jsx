import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSettings } from "../api/settings";
import { formatPrice } from "../lib/format";

export default function PaymentPanel({ order }) {
  const { paymentStatus, paymentMethod, id } = order;

  // ชำระ/รอตรวจแล้ว
  if (paymentStatus === "PAID")
    return (
      <Banner tone="green" title="ชำระเงินเรียบร้อย" desc="ขอบคุณครับ ร้านกำลังจัดเตรียมสินค้าให้คุณ" />
    );

  if (paymentStatus === "PENDING_REVIEW")
    return (
      <div className="mt-6">
        <Banner tone="amber" title="ได้รับสลิปแล้ว กำลังตรวจสอบ" desc="ร้านจะยืนยันการชำระเงินภายใน 24 ชม." />
        {order.slipImage && (
          <a href={order.slipImage} target="_blank" rel="noreferrer" className="mt-3 block">
            <img src={order.slipImage} alt="สลิป" className="mx-auto max-h-64 rounded-xl border border-line" />
          </a>
        )}
      </div>
    );

  // ยังไม่จ่าย → แสดงวิธีจ่ายตามช่องทาง
  return (
    <div className="mt-8">
      {paymentMethod === "PROMPTPAY" && <PromptPayBox orderId={id} />}
      {paymentMethod === "TRANSFER" && <BankBox total={order.total} />}
      {paymentMethod === "CARD" && (
        <Banner tone="mist" title="บัตรเครดิต/เดบิต" desc="ช่องทางบัตรจะเปิดใช้งานเร็วๆ นี้ — ระหว่างนี้เลือกพร้อมเพย์หรือโอนเงินได้" />
      )}
      {(paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") && <SlipUpload orderId={id} />}
    </div>
  );
}

// ---- PromptPay QR ----
function PromptPayBox({ orderId }) {
  const cardRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["promptpay", orderId],
    queryFn: async () => (await api.get(`/orders/${orderId}/promptpay`)).data,
  });

  // วาดการ์ดชำระเงินลง canvas เอง (พื้นขาวเป๊ะ + ใช้ฟอนต์ที่โหลดในหน้าจริง + QR ชัวร์)
  const drawCard = async () => {
    const qr = new Image();
    qr.src = data.qr;
    await (qr.decode?.() ?? new Promise((r) => { qr.onload = r; qr.onerror = r; })).catch(() => {});

    // บังคับโหลดฟอนต์ IBM Plex Sans Thai ทุกน้ำหนัก+ตัวอักษรที่ใช้ ก่อนวาด (มือถือมักยังไม่พร้อม)
    const face = '"IBM Plex Sans Thai"';
    const sample = "สแกนจ่ายด้วยพร้อมเพย์บจ.สำนักพิมพ์แสงดาว฿0123456789";
    try {
      await Promise.all(
        ["400", "500", "600", "700"].map((w) => document.fonts.load(`${w} 30px ${face}`, sample))
      );
    } catch { /* เครื่องไม่รองรับ → ใช้ fallback */ }
    await document.fonts?.ready;

    const FONT = '"IBM Plex Sans Thai", "Leelawadee UI", system-ui, sans-serif';
    const W = 620, H = 760, cx = W / 2, scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "alphabetic";

    // วัดความกว้างจาก DOM (สะท้อนฟอนต์จริง) — canvas.measureText บน iOS คืนค่าผิดหลังโหลดฟอนต์
    const measureWidth = (text, fontShort) => {
      const s = document.createElement("span");
      s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${fontShort}`;
      s.textContent = text;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return w;
    };
    const centered = (text, y, fontShort, color) => {
      ctx.font = fontShort;
      ctx.fillStyle = color;
      ctx.fillText(text, cx - measureWidth(text, fontShort) / 2, y);
    };

    centered("สแกนจ่ายด้วยพร้อมเพย์", 66, `600 30px ${FONT}`, "#1d1d1f");

    const qs = 380;
    if (qr.width) ctx.drawImage(qr, cx - qs / 2, 100, qs, qs);

    let y = 100 + qs + 52;
    if (data.promptpayName) {
      centered(data.promptpayName, y, `500 26px ${FONT}`, "#1d1d1f");
      y += 42;
    }
    centered(`พร้อมเพย์ · ${data.promptpayId}`, y, `400 22px ${FONT}`, "#86868b");
    y += 60;
    centered(formatPrice(data.amount), y, `700 42px ${FONT}`, "#1d1d1f");

    return new Promise((res) => canvas.toBlob(res, "image/png"));
  };

  // มือถือ → share sheet (มีปุ่ม "บันทึกรูปภาพ") · เดสก์ท็อป → ดาวน์โหลด
  const saveCard = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const blob = await drawCard();
      if (!blob) throw new Error("no blob");

      const name = `saengdao-promptpay-${data.amount}.png`;
      const file = new File([blob], name, { type: "image/png" });

      // เดสก์ท็อป = มีเมาส์/ทัชแพด (any-pointer: fine) → ดาวน์โหลด
      // มือถือ/แท็บเล็ต (ไม่มีเมาส์ หรือ UA เป็นมือถือ/iPad) → share sheet เพื่อเซฟลงคลังรูป
      const ua = navigator.userAgent || "";
      const hasMouse = window.matchMedia?.("(any-pointer: fine)")?.matches;
      const isMobile =
        /Android|iPhone|iPod|Mobile/i.test(ua) ||
        (/Macintosh|iPad/.test(ua) && navigator.maxTouchPoints > 1) || // iPadOS
        hasMouse === false;
      if (isMobile && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "ชำระเงิน SAENGDAO" });
          return;
        } catch (e) {
          if (e.name === "AbortError") return; // ผู้ใช้กดยกเลิก
          // แชร์ไม่ได้ → ตกไปดาวน์โหลด
        }
      }

      // เดสก์ท็อป (หรือ fallback): ดาวน์โหลดไฟล์
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback สุดท้าย: เปิด QR ให้กดค้างเซฟเอง
      window.open(data.qr, "_blank");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line p-6 text-center">
      {isLoading && <p className="py-8 text-[16px] text-sub">กำลังสร้าง QR...</p>}
      {isError && <p className="py-8 text-[16px] text-red-500">สร้าง QR ไม่สำเร็จ (ร้านอาจยังไม่ตั้งค่าพร้อมเพย์)</p>}
      {data && (
        <>
          {/* ส่วนที่ถูกบันทึกเป็นรูป */}
          <div ref={cardRef} className="bg-white px-4 pb-4 pt-2">
            <h3 className="text-[18px] font-semibold text-ink">สแกนจ่ายด้วยพร้อมเพย์</h3>
            <img src={data.qr} alt="PromptPay QR" className="mx-auto my-4 h-56 w-56" />
            {data.promptpayName && <p className="text-[17px] text-ink">{data.promptpayName}</p>}
            <p className="text-[16px] text-sub">พร้อมเพย์ · {data.promptpayId}</p>
            <p className="mt-2 text-[21px] font-semibold text-ink">{formatPrice(data.amount)}</p>
          </div>

          <button
            type="button"
            onClick={saveCard}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[17px] font-medium text-ink transition hover:bg-mist disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" strokeLinecap="round" />
            </svg>
            {saving ? "กำลังบันทึก..." : "บันทึกรูปการชำระเงิน"}
          </button>
          <p className="mt-2 text-[14px] text-sub">เซฟรูปแล้วเปิดในแอปธนาคาร → สแกนจากรูปได้เลย</p>
        </>
      )}
    </div>
  );
}

// ---- โอนเงินผ่านธนาคาร ----
function BankBox({ total }) {
  const s = useSettings();
  return (
    <div className="rounded-2xl border border-line p-6">
      <h3 className="mb-4 text-[18px] font-semibold text-ink">โอนเงินเข้าบัญชี</h3>
      {s.bankAccountNo ? (
        <dl className="space-y-2 text-[17px]">
          <Line label="ธนาคาร" value={s.bankName} />
          <Line label="เลขบัญชี" value={s.bankAccountNo} copy />
          <Line label="ชื่อบัญชี" value={s.bankAccountName} />
          <Line label="ยอดโอน" value={formatPrice(total)} strong />
        </dl>
      ) : (
        <p className="text-[16px] text-sub">ร้านยังไม่ได้ตั้งค่าบัญชีธนาคาร</p>
      )}
    </div>
  );
}

function Line({ label, value, copy, strong }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sub">{label}</dt>
      <dd className={`flex items-center gap-2 text-right ${strong ? "text-[19px] font-semibold text-ink" : "text-ink"}`}>
        {value}
        {copy && value && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(value.replace(/[-\s]/g, ""));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-full bg-mist px-2 py-0.5 text-[14px] text-sub hover:text-ink"
          >
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </button>
        )}
      </dd>
    </div>
  );
}

// ---- อัปโหลดสลิป ----
function SlipUpload({ orderId }) {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const upload = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("slip", file);
      return (await api.post(`/orders/${orderId}/slip`, fd)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", orderId] }),
    onError: (err) => setError(err.response?.data?.error || "อัปโหลดไม่สำเร็จ"),
  });

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="mt-4 rounded-2xl border border-line p-6">
      <h3 className="text-[18px] font-semibold text-ink">แนบสลิปการโอน</h3>
      <p className="mt-1 text-[15px] text-sub">อัปโหลดรูปสลิปเพื่อยืนยันการชำระเงิน</p>

      {preview && <img src={preview} alt="ตัวอย่างสลิป" className="mx-auto mt-4 max-h-56 rounded-xl border border-line" />}

      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-full border border-dashed border-line py-3 text-[17px] text-sub transition hover:border-ink/30 hover:text-ink">
        {file ? file.name : "เลือกรูปสลิป"}
        <input type="file" accept="image/*" onChange={pick} className="hidden" />
      </label>

      {error && <p className="mt-2 text-[15px] text-red-500">{error}</p>}

      <button
        onClick={() => upload.mutate()}
        disabled={!file || upload.isPending}
        className="mt-4 w-full rounded-full bg-accent py-3 text-[18px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-40"
      >
        {upload.isPending ? "กำลังส่งสลิป..." : "ส่งสลิปยืนยัน"}
      </button>
    </div>
  );
}

function Banner({ tone, title, desc }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    mist: "bg-mist text-ink",
  };
  return (
    <div className={`rounded-2xl px-5 py-4 text-center ${tones[tone]}`}>
      <p className="text-[18px] font-semibold">{title}</p>
      <p className="mt-1 text-[16px] opacity-90">{desc}</p>
    </div>
  );
}
