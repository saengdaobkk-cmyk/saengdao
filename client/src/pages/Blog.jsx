import { useState } from "react";
import { Link } from "react-router-dom";
import { useBlogPosts } from "../api/blog";
import { img } from "../lib/img";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "");

export default function Blog() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBlogPosts(page, 9);
  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="mx-auto max-w-page px-5 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">บทความ</h1>
      <p className="mt-2 text-[15px] text-sub">เรื่องเล่า รีวิว และแรงบันดาลใจจากหนังสือ</p>

      {isLoading && !data ? (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[16/10] rounded-2xl bg-mist" />
              <div className="mt-4 h-3 w-1/3 rounded bg-mist" />
              <div className="mt-2 h-4 w-3/4 rounded bg-mist" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-16 text-center text-[14px] text-sub">ยังไม่มีบทความ</p>
      ) : (
        <>
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => <ArticleCard key={p.id} post={p} />)}
          </div>
          {totalPages > 1 && <Pager page={page} totalPages={totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
}

function ArticleCard({ post }) {
  const to = `/blog/${post.slug || post.id}`;
  return (
    <Link to={to} className="group block">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-mist">
        {post.coverImage && (
          <img src={img(post.coverImage, 600)} alt={post.title} loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
      </div>
      <p className="mt-4 text-[12px] text-sub">{fmtDate(post.publishedAt || post.createdAt)}{post.author ? ` · ${post.author}` : ""}</p>
      <h2 className="mt-1 line-clamp-2 text-[18px] font-semibold leading-snug text-ink transition group-hover:text-accent">{post.title}</h2>
      {post.excerpt && <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-sub">{post.excerpt}</p>}
      <span className="mt-3 inline-block text-[13px] font-medium text-accent">อ่านต่อ →</span>
    </Link>
  );
}

function pageWindow(cur, total) {
  const keep = new Set([1, total, cur, cur - 1, cur + 1]);
  const arr = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of arr) { if (p - prev > 1) out.push("…"); out.push(p); prev = p; }
  return out;
}

function Pager({ page, totalPages, onChange }) {
  const arrow = "flex h-9 w-9 items-center justify-center rounded-full text-[15px] text-ink transition hover:bg-mist disabled:opacity-30 disabled:hover:bg-transparent";
  const go = (p) => { onChange(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <div className="mt-14 flex items-center justify-center gap-1">
      <button onClick={() => go(page - 1)} disabled={page === 1} aria-label="ก่อนหน้า" className={arrow}>‹</button>
      {pageWindow(page, totalPages).map((p, i) =>
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
