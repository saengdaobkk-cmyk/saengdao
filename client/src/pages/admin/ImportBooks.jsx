import { useState } from "react";
import * as XLSX from "xlsx";
import { useImportBooks } from "../../api/admin";

const COLUMNS = [
  "title", "price", "sale_price", "category", "author", "translator", "stock", "is_featured",
  "publisher", "edition", "pages", "dimensions", "weight", "paper_inner", "cover_type",
  "isbn", "sku", "image_url", "description", "tags",
];
const COL_DESC = {
  title: "ชื่อหนังสือ (จำเป็น)",
  price: "ราคาปกติ (จำเป็น)",
  sale_price: "ราคาลด (เว้นว่าง = ไม่ลด)",
  category: "ชื่อหมวด — ไม่มีจะสร้างให้",
  author: "ผู้เขียน",
  translator: "ผู้แปล",
  stock: "จำนวนสต็อก",
  is_featured: "1 = แนะนำหน้าแรก",
  "publisher…cover_type": "ข้อมูลจำเพาะ (เว้นว่างได้)",
  "isbn / sku": "รหัสสินค้า",
  image_url: "ลิงก์รูปปก (เว้นว่าง = ปกไล่เฉดสี)",
  tags: "แท็ก คั่นด้วย , เช่น ขายดี, ใหม่",
};
const SAMPLE = {
  title: "ตัวอย่างหนังสือ", price: 250, sale_price: 199, category: "นิยาย",
  author: "ชื่อผู้เขียน", translator: "", stock: 10, is_featured: 1, publisher: "แสงดาว",
  edition: "1", pages: 320, dimensions: "14.5x21 cm.", weight: "330 g",
  paper_inner: "ถนอมสายตา 65 gsm", cover_type: "ปกอ่อน", isbn: "9781234567890",
  sku: "SD-001", image_url: "", description: "เรื่องย่อของหนังสือ...", tags: "ขายดี, ใหม่",
};

export default function ImportBooks({ onClose }) {
  const importBooks = useImportBooks();
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([SAMPLE], { header: COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "books");
    XLSX.writeFile(wb, "saengdao-import-template.xlsx");
  };

  const readFile = async (file) => {
    setErr(""); setResult(null);
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { setErr("รองรับเฉพาะไฟล์ .xlsx หรือ .csv"); return; }
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
      if (!parsed.length) { setErr("ไฟล์ว่างเปล่า หรืออ่านไม่ได้"); return; }
      setRows(parsed);
      setFileName(file.name);
    } catch {
      setErr("อ่านไฟล์ไม่สำเร็จ");
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    readFile(e.dataTransfer.files?.[0]);
  };

  const doImport = () => {
    importBooks.mutate(rows, {
      onSuccess: (r) => setResult(r),
      onError: (e) => setErr(e.response?.data?.error || "นำเข้าไม่สำเร็จ"),
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[18px] font-semibold text-ink">นำเข้าสินค้า (CSV / Excel)</h3>
          <button onClick={onClose} aria-label="ปิด" className="rounded-full p-1.5 text-sub hover:bg-mist hover:text-ink">✕</button>
        </div>

        {result ? (
          /* ---- ผลลัพธ์ ---- */
          <div>
            <div className="rounded-2xl bg-emerald-50 p-5 text-center">
              <p className="text-2xl font-semibold text-emerald-700">นำเข้าสำเร็จ {result.created} เล่ม</p>
              {result.failed > 0 && <p className="mt-1 text-[14px] text-amber-700">ข้าม {result.failed} แถว (ข้อมูลไม่ครบ/ซ้ำ)</p>}
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-4 max-h-52 overflow-y-auto rounded-xl border border-line p-3 text-[13px]">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-sub">แถว {e.line}: <span className="text-red-600">{e.error}</span></p>
                ))}
              </div>
            )}
            <button onClick={onClose} className="mt-5 w-full rounded-full bg-ink py-3 text-[15px] font-medium text-white hover:bg-ink/90">เสร็จสิ้น</button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            {/* อัปโหลด */}
            <div>
              {/* drag-drop */}
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${drag ? "border-accent bg-accent/5" : "border-line hover:border-ink/30"}`}
              >
                <span className="text-4xl">📥</span>
                <p className="mt-3 text-[15px] font-medium text-ink">ลากไฟล์มาวางที่นี่</p>
                <p className="text-[13px] text-sub">หรือคลิกเพื่อเลือกไฟล์ (.xlsx / .csv)</p>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => readFile(e.target.files?.[0])} className="hidden" />
              </label>

              {err && <p className="mt-3 text-[13px] text-red-600">{err}</p>}

              {rows && !err && (
                <div className="mt-4 rounded-xl border border-line p-4">
                  <p className="text-[14px] text-ink">📄 {fileName}</p>
                  <p className="text-[13px] text-sub">พบ <b className="text-ink">{rows.length}</b> แถว พร้อมนำเข้า</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={doImport} disabled={importBooks.isPending}
                      className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
                      {importBooks.isPending ? "กำลังนำเข้า..." : `นำเข้า ${rows.length} เล่ม`}
                    </button>
                    <button onClick={() => { setRows(null); setFileName(""); }} className="rounded-full border border-line px-4 py-2.5 text-[14px] text-ink hover:bg-mist">เลือกใหม่</button>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-[12px] text-emerald-800">
                💡 แนะนำอัปโหลดเป็น <b>.xlsx</b> โดยตรง — เลข ISBN จะไม่เพี้ยน · ถ้าใช้ CSV ให้ตั้งคอลัมน์ ISBN เป็น Text ก่อน
              </div>
            </div>

            {/* เทมเพลต + คำอธิบาย */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-line p-4">
                <p className="text-[13px] font-semibold text-ink">เทมเพลต</p>
                <p className="mt-1 text-[12px] text-sub">มีคอลัมน์ + ตัวอย่างให้ กรอกแล้วอัปได้เลย</p>
                <button onClick={downloadTemplate} className="mt-3 w-full rounded-full bg-ink py-2.5 text-[13px] font-medium text-white hover:bg-ink/90">
                  ⬇ ดาวน์โหลด template.xlsx
                </button>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <p className="mb-2 text-[13px] font-semibold text-ink">คอลัมน์</p>
                <dl className="space-y-1.5 text-[12px]">
                  {Object.entries(COL_DESC).map(([k, v]) => (
                    <div key={k}><dt className="font-medium text-ink">{k}</dt><dd className="text-sub">{v}</dd></div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
