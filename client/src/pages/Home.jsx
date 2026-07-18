import BookRow from "../components/BookRow";
import HeroSlider from "../components/HeroSlider";
import BrowseSections from "../components/BrowseSections";
import PublisherMarquee from "../components/PublisherMarquee";
import PromoRibbon from "../components/PromoRibbon";
import TextMarquee from "../components/TextMarquee";
import HotDealSection from "../components/HotDealSection";

export default function Home() {
  return (
    <>
      <HeroSlider />

      {/* Hot Deal — section แรก (ซ่อนถ้าไม่มีสินค้าราคาพิเศษ) */}
      <HotDealSection />

      {/* แถวแนะนำ — เลื่อนแนวนอน */}
      <div className="pt-10 sm:pt-14">
        <BookRow eyebrow="อัปเดตล่าสุด" title="มาใหม่" sort="newest" />
        <div className="mx-auto max-w-page px-5">
          <div className="border-t border-line" />
        </div>
        <BookRow eyebrow="ยอดนิยม" title="ขายดี" sort="popular" />
      </div>

      {/* หมวดหมู่ */}
      <BrowseSections />

      {/* โลโก้สำนักพิมพ์เลื่อนวน (ก่อน footer) */}
      <TextMarquee />
      <PromoRibbon />
      <PublisherMarquee />
    </>
  );
}
