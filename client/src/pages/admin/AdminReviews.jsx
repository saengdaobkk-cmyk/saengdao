import { useAdminReviews, useModerateReview } from "../../api/reviews";
import Stars from "../../components/Stars";

const fmtDate = (d) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

export default function AdminReviews() {
  const { data: reviews, isLoading } = useAdminReviews();
  const mod = useModerateReview();

  if (isLoading) return <p className="text-sub">กำลังโหลด...</p>;
  if (!reviews?.length) return <p className="py-12 text-center text-sub">ยังไม่มีรีวิว</p>;

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-sub">รีวิวสินค้าทั้งหมด ({reviews.length}) · ซ่อนรีวิวที่ไม่เหมาะสม หรือลบทิ้ง</p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="border-b border-line bg-mist/40 text-[12px] text-sub">
            <tr>
              <th className="px-5 py-3 font-medium">สินค้า / ลูกค้า</th>
              <th className="px-5 py-3 font-medium">คะแนน</th>
              <th className="px-5 py-3 font-medium">ความคิดเห็น</th>
              <th className="px-5 py-3 font-medium">วันที่</th>
              <th className="px-5 py-3 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {reviews.map((r) => (
              <tr key={r.id} className={`align-top hover:bg-mist/30 ${r.hidden ? "opacity-50" : ""}`}>
                <td className="px-5 py-3">
                  <p className="font-medium text-ink">{r.bookTitle}</p>
                  <p className="text-[12px] text-sub">
                    {r.customer}
                    {r.verified && <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">ซื้อจริง</span>}
                  </p>
                </td>
                <td className="px-5 py-3"><Stars value={r.rating} size={14} /></td>
                <td className="max-w-md px-5 py-3 text-[13px] text-ink/80"><p className="whitespace-pre-line">{r.comment}</p></td>
                <td className="whitespace-nowrap px-5 py-3 text-[12px] text-sub">{fmtDate(r.createdAt)}</td>
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex justify-end gap-4">
                    <button onClick={() => mod.mutate({ id: r.id, hidden: !r.hidden })} className="text-[13px] text-accent">
                      {r.hidden ? "แสดง" : "ซ่อน"}
                    </button>
                    <button
                      onClick={() => confirm("ลบรีวิวนี้?") && mod.mutate({ id: r.id, action: "delete" })}
                      className="text-[13px] text-sub hover:text-red-600"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
