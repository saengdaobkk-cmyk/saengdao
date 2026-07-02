import BookCatalog from "../components/BookCatalog";

export default function Collection() {
  return (
    <div className="pt-4">
      <BookCatalog eyebrow="หนังสือทั้งหมด" heading="เลือกซื้อหนังสือ" limit={16} />
    </div>
  );
}
