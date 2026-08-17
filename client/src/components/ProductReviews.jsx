import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useBookReviews, useMyReview, useSubmitReview } from "../api/reviews";
import Stars from "./Stars";

const fmtDate = (d) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

export default function ProductReviews({ bookId }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data } = useBookReviews(bookId, page, 5);
  const { data: me } = useMyReview(bookId, !!user);
  const submit = useSubmitReview(bookId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [gotPoint, setGotPoint] = useState(false);

  const items = data?.items || [];
  const avg = data?.avg || 0;
  const count = data?.count || 0;
  const totalPages = data?.totalPages || 1;

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!rating) return setError("เลือกจำนวนดาว");
    if (!comment.trim()) return setError("กรอกความคิดเห็น");
    submit.mutate({ rating, comment }, {
      onSuccess: (res) => { setDone(true); setGotPoint(!!res?.pointAwarded); },
      onError: (err) => setError(err.response?.data?.error || "ส่งรีวิวไม่สำเร็จ"),
    });
  };

  return (
    <section className="mt-16 border-t border-line pt-10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-2xl font-semibold tracking-tightest text-ink">รีวิวจากผู้ซื้อ</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={avg} size={18} />
            <span className="text-[14px] text-ink"><b>{avg}</b> <span className="text-sub">({count} รีวิว)</span></span>
          </div>
        )}
      </div>

      {/* ฟอร์มเขียนรีวิว — ต้องซื้อจริง + รีวิวได้ครั้งเดียว */}
      <div className="mt-6 rounded-2xl border border-line p-5">
        {!user ? (
          <p className="text-[14px] text-sub">
            <Link to="/login" state={{ from: window.location.pathname }} className="font-medium text-accent">เข้าสู่ระบบ</Link> เพื่อเขียนรีวิว
          </p>
        ) : done ? (
          <p className="text-[14px] font-medium text-emerald-600">
            ขอบคุณสำหรับรีวิว 🙏{gotPoint && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] text-emerald-700">+1 แต้ม</span>}
          </p>
        ) : me == null ? (
          <p className="text-[14px] text-sub">กำลังโหลด...</p>
        ) : me.reviewed && me.review ? (
          <div>
            <p className="text-[14px] font-medium text-ink">คุณรีวิวสินค้านี้แล้ว</p>
            <Stars value={me.review.rating} size={18} className="mt-2" />
            {me.review.comment && <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink/80">{me.review.comment}</p>}
            <p className="mt-2 text-[12px] text-sub">รีวิวได้ครั้งเดียวต่อสินค้า</p>
          </div>
        ) : !me.purchased ? (
          <p className="text-[14px] text-sub">
            เฉพาะลูกค้าที่<b className="text-ink">สั่งซื้อสินค้านี้แล้ว</b> (ชำระเงินเรียบร้อย) เท่านั้นจึงจะรีวิวได้
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <p className="text-[14px] font-medium text-ink">ให้คะแนนหนังสือเล่มนี้</p>
            <Stars value={rating} size={30} onChange={setRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="เล่าประสบการณ์การอ่าน สิ่งที่ชอบ หรือแนะนำใครดี..."
              className="w-full resize-none rounded-xl border border-line px-4 py-2.5 text-[14px] outline-none focus:border-ink/30"
            />
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <p className="text-[12px] text-sub">รีวิวได้ครั้งเดียวและแก้ไขไม่ได้ · รับ 1 แต้มเมื่อรีวิว</p>
            <button type="submit" disabled={submit.isPending} className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
              {submit.isPending ? "กำลังส่ง..." : "ส่งรีวิว"}
            </button>
          </form>
        )}
      </div>

      {/* รายการรีวิว */}
      {count === 0 ? (
        <p className="mt-6 text-[14px] text-sub">ยังไม่มีรีวิว — เป็นคนแรกที่รีวิวเล่มนี้</p>
      ) : (
        <>
          <ul className="mt-6 space-y-5">
            {items.map((r) => (
              <li key={r.id} className="border-b border-line/60 pb-5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-ink">{r.name}</span>
                  {r.verified && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">ซื้อจริง</span>}
                  <span className="ml-auto text-[12px] text-sub">{fmtDate(r.createdAt)}</span>
                </div>
                <Stars value={r.rating} size={14} className="mt-1" />
                <ReviewComment text={r.comment} />
              </li>
            ))}
          </ul>
          {totalPages > 1 && <ReviewPager page={page} totalPages={totalPages} onChange={setPage} />}
        </>
      )}
    </section>
  );
}

// คอมเมนต์ยาว → ตัดย่อ 4 บรรทัด + ปุ่มอ่านเพิ่ม/ย่อ
function ReviewComment({ text }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 180 || (text.match(/\n/g)?.length || 0) >= 4;
  return (
    <div className="mt-2">
      <p className={`whitespace-pre-line text-[14px] leading-relaxed text-ink/80 ${long && !open ? "line-clamp-4" : ""}`}>{text}</p>
      {long && (
        <button onClick={() => setOpen((o) => !o)} className="mt-1 text-[13px] font-medium text-accent">
          {open ? "ย่อ" : "อ่านเพิ่ม"}
        </button>
      )}
    </div>
  );
}

function reviewPageWindow(cur, total) {
  const keep = new Set([1, total, cur, cur - 1, cur + 1]);
  const arr = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of arr) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

function ReviewPager({ page, totalPages, onChange }) {
  const arrow = "flex h-9 w-9 items-center justify-center rounded-full text-[15px] text-ink transition hover:bg-mist disabled:opacity-30 disabled:hover:bg-transparent";
  const go = (p) => { onChange(p); window.scrollTo({ top: document.body.scrollHeight - 900, behavior: "smooth" }); };
  return (
    <div className="mt-7 flex items-center justify-center gap-1">
      <button onClick={() => go(page - 1)} disabled={page === 1} aria-label="ก่อนหน้า" className={arrow}>‹</button>
      {reviewPageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-[14px] text-sub">…</span>
        ) : (
          <button key={p} onClick={() => go(p)}
            className={`h-9 min-w-9 rounded-full px-3 text-[14px] transition ${p === page ? "bg-ink font-medium text-white" : "text-ink hover:bg-mist"}`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => go(page + 1)} disabled={page === totalPages} aria-label="ถัดไป" className={arrow}>›</button>
    </div>
  );
}
