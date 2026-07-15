import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSettings } from "../api/settings";
import { formatPrice } from "../lib/format";
import { TrackingCard } from "./OrderConfirm";

const PAYMENT_LABEL = {
  PROMPTPAY: "พร้อมเพย์ (PromptPay)",
  TRANSFER: "โอนเงินผ่านธนาคาร",
  CARD: "บัตรเครดิต/เดบิต",
};

const PAYMENT_STATUS_LABEL = {
  UNPAID: "รอชำระเงิน",
  PENDING_REVIEW: "รอตรวจสอบสลิป",
  PAID: "ชำระเงินแล้ว",
  FAILED: "ชำระเงินไม่สำเร็จ",
};

const ORDER_STATUS_LABEL = {
  PENDING: "กำลังดำเนินการ",
  PAID: "กำลังดำเนินการ",
  SHIPPED: "จัดส่งแล้ว",
  COMPLETED: "จัดส่งสำเร็จ",
  CANCELLED: "ยกเลิก",
};

function displayStatus(o) {
  if (o.paymentStatus === "PAID") return ORDER_STATUS_LABEL[o.status] || "กำลังดำเนินการ";
  return PAYMENT_STATUS_LABEL[o.paymentStatus] || o.paymentStatus;
}

const STATUS_TONE = {
  UNPAID: "bg-amber-50 text-amber-700",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-600",
};

export default function OrderTrack() {
  const [params] = useSearchParams();
  const contact = useSettings();
  const [code, setCode] = useState(params.get("code") || "");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null); // { order, promptpay }

  const lookup = useMutation({
    mutationFn: async () => (await api.post("/orders/track", { code, phone })).data,
    onSuccess: (data) => setResult(data),
    onError: () => setResult(null),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim() || !phone.trim()) return;
    lookup.mutate();
  };

  // เจอคำสั่งซื้อแล้ว → สลับมาแสดงหน้าคำสั่งซื้อแทนฟอร์ม
  const back = () => {
    setResult(null);
    lookup.reset();
  };

  return (
    <div className="mx-auto max-w-page px-5">
      {/* หัวเพจ */}
      <div className="border-b border-line py-10 text-center sm:py-14">
        <p className="text-[14px] text-sub">
          <Link to="/" className="hover:text-ink">หน้าแรก</Link> › ติดตามคำสั่งซื้อ
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tightest text-ink sm:text-3xl">
          ติดตามคำสั่งซื้อ / แนบสลิป
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-sub">
          {result
            ? "รายละเอียดและสถานะคำสั่งซื้อของคุณ"
            : "กรอกเลขคำสั่งซื้อและเบอร์โทรที่ใช้ตอนสั่งซื้อ เพื่อดูสถานะหรือแนบสลิปการชำระเงิน"}
        </p>
      </div>

      <div className="mx-auto max-w-md py-12">
        {result ? (
          <>
            <button
              onClick={back}
              className="mb-5 inline-flex items-center gap-1.5 text-[15px] text-sub transition hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              ค้นหาคำสั่งซื้ออื่น
            </button>
            <OrderResult data={result} code={code} phone={phone} onUpdated={setResult} />
            <TrackingCard order={result.order} />
          </>
        ) : (
          <div className="rounded-2xl border border-line p-6">
            <h3 className="text-[16px] font-semibold text-ink">ค้นหาคำสั่งซื้อของคุณ</h3>
            {lookup.isError && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-600">
                {lookup.error?.response?.data?.error || "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง"}
              </div>
            )}
            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-[14px] font-medium text-ink">เลขคำสั่งซื้อ *</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น 0DCCAE98"
                  required
                  className="mt-1.5 w-full rounded-xl border border-line px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-[14px] font-medium text-ink">เบอร์โทรศัพท์ *</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เบอร์ที่ใช้ตอนสั่งซื้อ"
                  required
                  className="mt-1.5 w-full rounded-xl border border-line px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-accent"
                />
              </label>
              <button
                type="submit"
                disabled={lookup.isPending}
                className="w-full rounded-full bg-accent py-3 text-[16px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
              >
                {lookup.isPending ? "กำลังค้นหา..." : "ดูคำสั่งซื้อ"}
              </button>
            </form>
            {contact.contactLine && (
              <p className="mt-4 text-center text-[13px] text-sub">
                หาเลขคำสั่งซื้อไม่เจอ? ทักหาเราทาง LINE {contact.contactLine}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderResult({ data, code, phone, onUpdated }) {
  const { order, promptpay } = data;
  const s = useSettings();
  const showPay = order.paymentStatus === "UNPAID";

  return (
    <div className="mt-8 rounded-2xl border border-line p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] text-sub">เลขคำสั่งซื้อ</p>
        <span className="font-mono text-[15px] font-semibold text-ink">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[14px] text-sub">สถานะ</p>
        <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${STATUS_TONE[order.paymentStatus] || "bg-mist text-ink"}`}>
          {displayStatus(order)}
        </span>
      </div>

      {/* รายการ */}
      <ul className="mt-5 space-y-3 border-t border-line pt-5">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between gap-3 text-[15px]">
            <span className="text-ink">
              {it.title}{it.variantName && ` (${it.variantName})`}{" "}
              <span className="text-sub">× {it.quantity}</span>
            </span>
            <span className="shrink-0 text-ink">{formatPrice(Number(it.price) * it.quantity)}</span>
          </li>
        ))}
      </ul>

      {(Number(order.discount) > 0 || Number(order.shippingFee) > 0) && (
        <div className="mt-4 space-y-2 text-[15px]">
          {Number(order.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-sub">ส่วนลด</span>
              <span className="text-emerald-600">−{formatPrice(order.discount)}</span>
            </div>
          )}
          {Number(order.shippingFee) > 0 && (
            <div className="flex justify-between">
              <span className="text-sub">ค่าจัดส่ง{order.shippingMethod && ` · ${order.shippingMethod}`}</span>
              <span className="text-ink">{formatPrice(order.shippingFee)}</span>
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex justify-between border-t border-line pt-4 text-[17px] font-semibold text-ink">
        <span>ยอดรวม</span>
        <span>{formatPrice(order.total)}</span>
      </div>

      <dl className="mt-5 space-y-1.5 text-[14px]">
        <Row label="วิธีชำระเงิน" value={PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod} />
        {order.shippingMethod && <Row label="วิธีจัดส่ง" value={order.shippingMethod} />}
        <Row label="จัดส่งถึง" value={`${order.shipName} · ${order.shipPhone}`} />
        <Row label="ที่อยู่" value={order.shipAddress} />
        {order.note && <Row label="หมายเหตุ" value={order.note} />}
      </dl>

      {/* ชำระเงิน — เฉพาะที่ยังไม่จ่าย */}
      {order.paymentStatus === "PENDING_REVIEW" && (
        <div className="mt-6 rounded-xl bg-amber-50 px-5 py-4 text-center text-amber-700">
          <p className="text-[15px] font-semibold">ได้รับสลิปแล้ว กำลังตรวจสอบ</p>
          <p className="mt-1 text-[13px] opacity-90">ร้านจะยืนยันการชำระเงินภายใน 24 ชม.</p>
          {order.slipImage && (
            <a href={order.slipImage} target="_blank" rel="noreferrer" className="mt-3 block">
              <img src={order.slipImage} alt="สลิป" className="mx-auto max-h-56 rounded-xl border border-amber-200" />
            </a>
          )}
        </div>
      )}
      {order.paymentStatus === "PAID" && (
        <div className="mt-6 rounded-xl bg-emerald-50 px-5 py-4 text-center text-emerald-700">
          <p className="text-[15px] font-semibold">ชำระเงินเรียบร้อย</p>
          <p className="mt-1 text-[13px] opacity-90">ขอบคุณครับ ร้านกำลังจัดเตรียมสินค้าให้คุณ</p>
        </div>
      )}

      {showPay && (
        <div className="mt-6 space-y-4">
          {promptpay && <PromptPay data={promptpay} />}
          {order.paymentMethod === "TRANSFER" && (
            <div className="rounded-2xl border border-line p-6">
              <h3 className="mb-4 text-[16px] font-semibold text-ink">โอนเงินเข้าบัญชี</h3>
              {s.bankAccountNo ? (
                <dl className="space-y-2 text-[15px]">
                  <Row label="ธนาคาร" value={s.bankName} />
                  <Row label="เลขบัญชี" value={s.bankAccountNo} />
                  <Row label="ชื่อบัญชี" value={s.bankAccountName} />
                  <Row label="ยอดโอน" value={formatPrice(order.total)} />
                </dl>
              ) : (
                <p className="text-[14px] text-sub">ร้านยังไม่ได้ตั้งค่าบัญชีธนาคาร</p>
              )}
            </div>
          )}
          <SlipUpload code={code} phone={phone} order={order} onUpdated={onUpdated} data={data} />
        </div>
      )}
    </div>
  );
}

function PromptPay({ data }) {
  return (
    <div className="rounded-2xl border border-line p-6 text-center">
      <h3 className="text-[16px] font-semibold text-ink">สแกนจ่ายด้วยพร้อมเพย์</h3>
      <img src={data.qr} alt="PromptPay QR" className="mx-auto my-4 h-56 w-56" />
      {data.promptpayName && <p className="text-[15px] text-ink">{data.promptpayName}</p>}
      <p className="text-[14px] text-sub">พร้อมเพย์ · {data.promptpayId}</p>
      <p className="mt-2 text-[19px] font-semibold text-ink">{formatPrice(data.amount)}</p>
    </div>
  );
}

function SlipUpload({ code, phone, onUpdated, data }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const upload = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("slip", file);
      fd.append("code", code);
      fd.append("phone", phone);
      return (await api.post("/orders/track/slip", fd)).data;
    },
    onSuccess: (res) => {
      onUpdated({
        ...data,
        order: { ...data.order, slipImage: res.slipImage, paymentStatus: res.paymentStatus },
      });
    },
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
    <div className="rounded-2xl border border-line p-6">
      <h3 className="text-[16px] font-semibold text-ink">แนบสลิปการโอน</h3>
      <p className="mt-1 text-[13px] text-sub">อัปโหลดรูปสลิปเพื่อยืนยันการชำระเงิน</p>

      {preview && <img src={preview} alt="ตัวอย่างสลิป" className="mx-auto mt-4 max-h-56 rounded-xl border border-line" />}

      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-full border border-dashed border-line py-3 text-[15px] text-sub transition hover:border-ink/30 hover:text-ink">
        {file ? file.name : "เลือกรูปสลิป"}
        <input type="file" accept="image/*" onChange={pick} className="hidden" />
      </label>

      {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}

      <button
        onClick={() => upload.mutate()}
        disabled={!file || upload.isPending}
        className="mt-4 w-full rounded-full bg-accent py-3 text-[16px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-40"
      >
        {upload.isPending ? "กำลังส่งสลิป..." : "ส่งสลิปยืนยัน"}
      </button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-sub">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
