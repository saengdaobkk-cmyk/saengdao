import BookRow from "../components/BookRow";
import HeroSlider from "../components/HeroSlider";
import BrowseSections from "../components/BrowseSections";
import BookCatalog from "../components/BookCatalog";
import PublisherMarquee from "../components/PublisherMarquee";

export default function Home() {
  return (
    <>
      <HeroSlider />

      {/* แถวแนะนำ — เลื่อนแนวนอน */}
      <div className="pt-10 sm:pt-14">
        <BookRow eyebrow="อัปเดตล่าสุด" title="มาใหม่" sort="newest" />
        <div className="mx-auto max-w-page px-5">
          <div className="border-t border-line" />
        </div>
        <BookRow eyebrow="ยอดนิยม" title="ขายดี" sort="popular" />
      </div>

      {/* หมวดหมู่ + สำนักพิมพ์ */}
      <BrowseSections />

      <div className="mt-2 bg-mist py-2" />

      {/* คอลเลกชันสินค้า */}
      <BookCatalog id="catalog" eyebrow="คอลเลกชัน" heading="คัดสรรมาเพื่อคุณ" limit={8} />

      {/* โลโก้สำนักพิมพ์เลื่อนวน (ก่อน footer) */}
      <PublisherMarquee />
    </>
  );
}
