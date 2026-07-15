import { useEffect, useRef, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";
import { messageFor } from "../lib/validation";
import { useContent } from "../api/content";
import { useShipping } from "../api/shipping";

const PAYMENTS = [
  { value: "PROMPTPAY", label: "พร้อมเพย์ (PromptPay)", desc: "สแกน QR จ่ายเงิน แล้วแนบสลิป" },
  { value: "TRANSFER", label: "โอนเงินผ่านธนาคาร", desc: "โอนแล้วแนบสลิปยืนยัน" },
  { value: "CARD", label: "บัตรเครดิต/เดบิต", desc: "ชำระผ่านบัตรอย่างปลอดภัย" },
];

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const { t } = useContent();
  const navigate = useNavigate();

  const [form, setForm] = useState({ shipName: "", shipPhone: "", shipAddress: "", email: "" });
  const [paymentMethod, setPaymentMethod] = useState("PROMPTPAY");
  const [note, setNote] = useState("");

  // ช่องทางจัดส่ง
  const { data: shippingMethods = [] } = useShipping();
  const [shippingMethodId, setShippingMethodId] = useState("");

  // ใบเสร็จ
  const [needReceipt, setNeedReceipt] = useState(false);
  const [receiptSameAsShipping, setReceiptSame] = useState(true);
  const [receipt, setReceipt] = useState({ receiptName: "", receiptTaxId: "", receiptAddress: "" });

  // ส่วนลด
  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const placedRef = useRef(false); // สั่งซื้อสำเร็จแล้ว — กัน guard เด้งไป /cart ตอน clear()

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      shipName: f.shipName || user.name || "",
      email: f.email || user.email || "",
      shipPhone: f.shipPhone || user.phone || "",
      shipAddress: f.shipAddress || user.address || "",
    }));
    // เติมข้อมูลใบเสร็จที่บันทึกไว้
    if (user.receiptName || user.receiptAddress || user.receiptTaxId)
      setReceipt((r) => ({
        receiptName: r.receiptName || user.receiptName || "",
        receiptTaxId: r.receiptTaxId || user.receiptTaxId || "",
        receiptAddress: r.receiptAddress || user.receiptAddress || "",
      }));
  }, [user]);

  // เลือกช่องทางแรกให้อัตโนมัติ
  useEffect(() => {
    if (shippingMethods.length && !shippingMethods.some((m) => m.id === shippingMethodId))
      setShippingMethodId(shippingMethods[0].id);
  }, [shippingMethods, shippingMethodId]);

  if (loading) return <div className="py-24 text-center text-sub">กำลังโหลด...</div>;
  if (!user) return <Navigate to="/login" state={{ from: "/checkout" }} replace />;
  if (items.length === 0 && !placedRef.current) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setR = (k) => (e) => setReceipt((r) => ({ ...r, [k]: e.target.value }));

  const discount = coupon?.discount || 0;
  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethodId) || null;
  const shippingFee = selectedShipping ? Math.max(0, Math.round(Number(selectedShipping.fee))) : 0;
  const total = Math.max(0, subtotal - discount + shippingFee);

  const applyCoupon = async () => {
    setCouponError("");
    if (!codeInput.trim()) return;
    setCouponBusy(true);
    try {
      const { data } = await api.post("/coupons/apply", { code: codeInput, subtotal });
      setCoupon({ code: data.code, discount: data.discount });
    } catch (err) {
      setCoupon(null);
      setCouponError(err.response?.data?.error || "ใช้โค้ดไม่สำเร็จ");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCodeInput("");
    setCouponError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data: order } = await api.post("/orders", {
        items: items.map((i) => ({ bookId: i.id, variantId: i.variantId || null, quantity: i.quantity })),
        ...form,
        paymentMethod,
        shippingMethodId: shippingMethodId || null,
        note,
        discountCode: coupon?.code || null,
        needReceipt,
        receiptSameAsShipping,
        ...(needReceipt && !receiptSameAsShipping ? receipt : { receiptTaxId: receipt.receiptTaxId }),
      });
      placedRef.current = true; // กัน guard ก่อนล้างตะกร้า
      navigate(`/orders/${order.id}`, { replace: true });
      clear();
    } catch (err) {
      setError(err.response?.data?.error || "สั่งซื้อไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-page px-5 py-12 sm:py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tightest text-ink">{t("checkout.title", "ชำระเงิน")}</h1>

      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {/* ที่อยู่จัดส่ง */}
          <section>
            <h2 className="mb-4 text-[17px] font-semibold text-ink">{t("checkout.shipping_heading", "ที่อยู่จัดส่ง")}</h2>
            <div className="space-y-4">
              <Input label={t("checkout.field_name", "ชื่อผู้รับ")} value={form.shipName} onChange={set("shipName")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t("checkout.field_email", "อีเมล")} type="email" value={form.email} onChange={set("email")} />
                <Input label={t("checkout.field_phone", "เบอร์โทรศัพท์")} type="tel" value={form.shipPhone} onChange={set("shipPhone")} />
              </div>
              <Textarea label={t("checkout.field_address", "ที่อยู่")} value={form.shipAddress} onChange={set("shipAddress")} />
            </div>
          </section>

          {/* ช่องทางจัดส่ง */}
          {shippingMethods.length > 0 && (
            <section>
              <h2 className="mb-4 text-[17px] font-semibold text-ink">{t("checkout.shipping_method_heading", "ช่องทางจัดส่ง")}</h2>
              <div className="space-y-3">
                {shippingMethods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      shippingMethodId === m.id ? "border-ink/40 bg-mist/60" : "border-line hover:border-ink/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={m.id}
                      checked={shippingMethodId === m.id}
                      onChange={(e) => setShippingMethodId(e.target.value)}
                      className="mt-1 accent-accent"
                    />
                    <div className="flex-1">
                      <p className="text-[16px] font-medium text-ink">{m.name}</p>
                      {m.note && <p className="text-[14px] text-sub">{m.note}</p>}
                    </div>
                    <span className="text-[16px] font-semibold text-ink">
                      {Number(m.fee) === 0 ? <span className="text-emerald-600">ฟรี</span> : formatPrice(m.fee)}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* ใบเสร็จรับเงิน */}
          <section>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={needReceipt}
                onChange={(e) => setNeedReceipt(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-[17px] font-semibold text-ink">{t("checkout.receipt_toggle", "ออกใบเสร็จรับเงิน / ใบกำกับภาษี")}</span>
            </label>

            {needReceipt && (
              <div className="mt-4 space-y-4 rounded-2xl border border-line p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                  <Radio
                    name="receipt"
                    checked={receiptSameAsShipping}
                    onChange={() => setReceiptSame(true)}
                    label="ใช้ข้อมูลเดียวกับที่จัดส่ง"
                  />
                  <Radio
                    name="receipt"
                    checked={!receiptSameAsShipping}
                    onChange={() => setReceiptSame(false)}
                    label="ออกในชื่อ/ที่อยู่อื่น"
                  />
                </div>

                {!receiptSameAsShipping && (
                  <div className="space-y-4">
                    <Input label="ชื่อ / บริษัท" value={receipt.receiptName} onChange={setR("receiptName")} />
                    <Textarea label="ที่อยู่ออกใบเสร็จ" value={receipt.receiptAddress} onChange={setR("receiptAddress")} />
                  </div>
                )}

                <Input
                  label="เลขประจำตัวผู้เสียภาษี (ถ้ามี)"
                  value={receipt.receiptTaxId}
                  onChange={setR("receiptTaxId")}
                  required={false}
                  inputMode="numeric"
                  placeholder="13 หลัก"
                />
              </div>
            )}
          </section>

          {/* วิธีชำระเงิน */}
          <section>
            <h2 className="mb-4 text-[17px] font-semibold text-ink">{t("checkout.payment_heading", "วิธีชำระเงิน")}</h2>
            <div className="space-y-3">
              {PAYMENTS.map((p) => (
                <label
                  key={p.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    paymentMethod === p.value ? "border-ink/40 bg-mist/60" : "border-line hover:border-ink/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={p.value}
                    checked={paymentMethod === p.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 accent-accent"
                  />
                  <div>
                    <p className="text-[16px] font-medium text-ink">{p.label}</p>
                    <p className="text-[14px] text-sub">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-3 text-[14px] text-sub">
              {t("checkout.payment_note", "* ขั้นตอนชำระเงินจริง (QR / สลิป / บัตร) จะเปิดใช้งานใน Phase 5")}
            </p>
          </section>

          {/* หมายเหตุ */}
          <section>
            <h2 className="mb-3 text-[17px] font-semibold text-ink">{t("checkout.note_heading", "หมายเหตุถึงร้าน")}</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={t("checkout.note_placeholder", "ระบุรายละเอียดเพิ่มเติม เช่น เวลาที่สะดวกรับของ (ถ้ามี)")}
              className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-[17px] text-ink outline-none transition placeholder:text-sub/70 focus:border-ink/30"
            />
          </section>
        </div>

        {/* สรุป */}
        <aside className="h-fit rounded-2xl border border-line bg-mist/50 p-6 lg:sticky lg:top-20">
          <h2 className="text-[17px] font-semibold text-ink">{t("checkout.summary_heading", "คำสั่งซื้อ")}</h2>
          <ul className="mt-4 space-y-2 text-[15px]">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-2">
                <span className="text-sub">
                  {i.title}{i.variantName && ` (${i.variantName})`} <span className="text-ink/40">× {i.quantity}</span>
                </span>
                <span className="shrink-0 text-ink">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          {/* โค้ดส่วนลด */}
          <div className="mt-5 border-t border-line pt-5">
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
                <span className="text-[15px] font-medium text-emerald-700">
                  ใช้โค้ด {coupon.code} แล้ว
                </span>
                <button type="button" onClick={removeCoupon} className="text-[14px] text-emerald-700">
                  ยกเลิก
                </button>
              </div>
            ) : (
              <>
                <p className="mb-2 text-[15px] font-medium text-ink">{t("checkout.discount_label", "โค้ดส่วนลด")}</p>
                <div className="flex gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="กรอกโค้ด"
                    className="flex-1 rounded-full border border-line bg-white px-4 py-2 text-[16px] uppercase text-ink outline-none focus:border-ink/30"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponBusy || !codeInput.trim()}
                    className="rounded-full bg-ink px-5 py-2 text-[16px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-40"
                  >
                    {t("checkout.apply_code", "ใช้โค้ด")}
                  </button>
                </div>
                {couponError && <p className="mt-2 text-[14px] text-red-500">{couponError}</p>}
              </>
            )}
          </div>

          {/* ยอดเงิน */}
          <div className="mt-5 space-y-2 border-t border-line pt-5 text-[16px]">
            <div className="flex justify-between text-sub">
              <span>{t("checkout.subtotal", "ยอดรวมสินค้า")}</span>
              <span className="text-ink">{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{t("checkout.discount", "ส่วนลด")}</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sub">
              <span>{t("checkout.shipping_fee", "ค่าจัดส่ง")}{selectedShipping && ` · ${selectedShipping.name}`}</span>
              {shippingFee === 0 ? (
                <span className="text-emerald-600">{t("checkout.shipping_free", "ฟรี")}</span>
              ) : (
                <span className="text-ink">{formatPrice(shippingFee)}</span>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-[18px] font-semibold text-ink">
            <span>{t("checkout.total", "ยอดชำระ")}</span>
            <span>{formatPrice(total)}</span>
          </div>

          {error && (
            <div className="mt-4">
              <p className="text-[15px] text-red-600">{error}</p>
              {error.includes("ตะกร้า") && (
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    navigate("/");
                  }}
                  className="mt-2 text-[15px] font-medium text-accent"
                >
                  ล้างตะกร้าแล้วเลือกใหม่ →
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-full bg-accent py-3 text-[17px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "กำลังสั่งซื้อ..." : t("checkout.submit", "ยืนยันคำสั่งซื้อ")}
          </button>
        </aside>
      </form>
    </div>
  );
}

// ---- ฟิลด์ ----
function useFieldError() {
  const [error, setError] = useState("");
  const onInvalid = (e) => {
    e.preventDefault();
    setError(messageFor(e.target));
  };
  const onInput = (e) => {
    e.target.setCustomValidity("");
    if (error) setError("");
  };
  return { error, onInvalid, onInput };
}

function Input({ label, type = "text", value, onChange, required = true, ...rest }) {
  const { error, onInvalid, onInput } = useFieldError();
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onInvalid={onInvalid}
        onInput={onInput}
        required={required}
        {...rest}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[17px] text-ink outline-none transition placeholder:text-sub/60 ${
          error ? "neon-error" : "border-line focus:border-ink/30"
        }`}
      />
      {error && <span className="mt-1.5 block text-[14px] text-red-500">{error}</span>}
    </label>
  );
}

function Textarea({ label, value, onChange, required = true }) {
  const { error, onInvalid, onInput } = useFieldError();
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-medium text-ink">{label}</span>
      <textarea
        value={value}
        onChange={onChange}
        onInvalid={onInvalid}
        onInput={onInput}
        required={required}
        rows={3}
        className={`w-full resize-none rounded-xl border bg-white px-4 py-2.5 text-[17px] text-ink outline-none transition ${
          error ? "neon-error" : "border-line focus:border-ink/30"
        }`}
      />
      {error && <span className="mt-1.5 block text-[14px] text-red-500">{error}</span>}
    </label>
  );
}

function Radio({ name, checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-accent" />
      <span className="text-[16px] text-ink">{label}</span>
    </label>
  );
}
