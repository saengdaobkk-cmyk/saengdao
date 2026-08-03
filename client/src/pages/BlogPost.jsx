import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useBlogPost } from "../api/blog";
import { useSettings } from "../api/settings";
import { img } from "../lib/img";
import ShareButtons from "../components/ShareButtons";

// สไตล์ element ของ markdown (หัวข้อย่อย/ตัวหนา/รูป/ลิงก์/รายการ)
export const MD_COMPONENTS = {
  h2: (p) => <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink" {...p} />,
  h3: (p) => <h3 className="mt-6 text-xl font-semibold tracking-tight text-ink" {...p} />,
  p: (p) => <p className="text-[16px] leading-relaxed text-ink/85" {...p} />,
  strong: (p) => <strong className="font-semibold text-ink" {...p} />,
  a: (p) => <a className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer" {...p} />,
  ul: (p) => <ul className="list-disc space-y-1 pl-5 text-[16px] text-ink/85" {...p} />,
  ol: (p) => <ol className="list-decimal space-y-1 pl-5 text-[16px] text-ink/85" {...p} />,
  blockquote: (p) => <blockquote className="border-l-4 border-line pl-4 text-ink/70" {...p} />,
  img: ({ node, ...p }) => <img className="my-2 w-full rounded-xl object-cover" loading="lazy" {...p} />,
  hr: () => <hr className="border-line" />,
  code: (p) => <code className="rounded bg-mist px-1.5 py-0.5 text-[14px]" {...p} />,
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "");

export default function BlogPost() {
  const { slug } = useParams();
  const { data: post, isLoading, isError } = useBlogPost(slug);
  const { showBlogShare } = useSettings();

  if (isLoading) return <div className="py-24 text-center text-sub">กำลังโหลด...</div>;
  if (isError || !post)
    return (
      <div className="py-24 text-center">
        <p className="text-sub">ไม่พบบทความ</p>
        <Link to="/blog" className="mt-4 inline-block text-[14px] text-accent">← บทความทั้งหมด</Link>
      </div>
    );

  return (
    <article className="py-12 sm:py-16">
      {/* หัวเรื่อง — hero กึ่งกลาง */}
      <div className="mx-auto max-w-4xl px-5">
        <Link to="/blog" className="text-[13px] text-sub transition hover:text-ink">← บทความทั้งหมด</Link>
        <div className="mt-8 text-center">
          <p className="text-[13px] text-sub">{fmtDate(post.publishedAt || post.createdAt)}{post.author ? ` · โดย ${post.author}` : ""}</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tightest text-ink sm:text-[44px]">{post.title}</h1>
          {showBlogShare !== false && (
            <div className="mt-7 flex justify-center">
              <ShareButtons title={post.title} />
            </div>
          )}
        </div>
      </div>

      {/* รูปปก — hero กว้างกว่าเนื้อหา */}
      {post.coverImage && (
        <div className="mx-auto mt-10 max-w-5xl px-5">
          <img src={img(post.coverImage, 1600)} alt={post.title} className="w-full rounded-2xl object-cover" />
        </div>
      )}

      {/* เนื้อหา — คอลัมน์อ่านสบาย */}
      <div className="mx-auto mt-10 max-w-3xl space-y-4 px-5">
        <ReactMarkdown components={MD_COMPONENTS}>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
