import { Link } from "react-router-dom";
import { useBlogPosts } from "../api/blog";
import { img } from "../lib/img";
import SectionHeading from "./SectionHeading";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "");

// section บทความหน้าแรก — กริดบทความล่าสุด (ซ่อนถ้ายังไม่มีบทความ)
export default function BlogSection({ title = "บทความ", subtitle = "" }) {
  const { data } = useBlogPosts(1, 4);
  const items = data?.items || [];
  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-page px-5 py-10">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        className="mb-8"
        right={
          <Link to="/blog" className="border-b border-ink pb-0.5 text-[14px] text-ink transition hover:opacity-60">
            ดูทั้งหมด
          </Link>
        }
      />
      <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="group block">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-mist">
              {post.coverImage && (
                <img src={img(post.coverImage, 600)} alt={post.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              )}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[12px] text-sub">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" strokeLinecap="round" /></svg>
              {fmtDate(post.publishedAt || post.createdAt)}
            </p>
            <h3 className="mt-1.5 line-clamp-2 text-[16px] font-medium leading-snug text-ink transition-colors group-hover:text-accent">{post.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
