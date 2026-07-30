import { useParams, Link } from "react-router-dom";
import { useBlogPost } from "../api/blog";
import { img } from "../lib/img";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "");

export default function BlogPost() {
  const { slug } = useParams();
  const { data: post, isLoading, isError } = useBlogPost(slug);

  if (isLoading) return <div className="py-24 text-center text-sub">กำลังโหลด...</div>;
  if (isError || !post)
    return (
      <div className="py-24 text-center">
        <p className="text-sub">ไม่พบบทความ</p>
        <Link to="/blog" className="mt-4 inline-block text-[14px] text-accent">← บทความทั้งหมด</Link>
      </div>
    );

  return (
    <article className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <Link to="/blog" className="text-[13px] text-sub transition hover:text-ink">← บทความทั้งหมด</Link>
      <p className="mt-6 text-[13px] text-sub">{fmtDate(post.publishedAt || post.createdAt)}{post.author ? ` · โดย ${post.author}` : ""}</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tightest text-ink sm:text-[40px]">{post.title}</h1>
      {post.coverImage && (
        <img src={img(post.coverImage, 1200)} alt={post.title} className="mt-8 w-full rounded-2xl object-cover" />
      )}
      <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-ink/85">
        {post.content.split(/\n{2,}/).filter(Boolean).map((para, i) => (
          <p key={i} className="whitespace-pre-line">{para}</p>
        ))}
      </div>
    </article>
  );
}
