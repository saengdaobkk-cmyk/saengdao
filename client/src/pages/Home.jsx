import { Fragment } from "react";
import BookRow from "../components/BookRow";
import HeroSlider from "../components/HeroSlider";
import BrowseSections from "../components/BrowseSections";
import PublisherMarquee from "../components/PublisherMarquee";
import PromoRibbon from "../components/PromoRibbon";
import TextMarquee from "../components/TextMarquee";
import HotDealSection from "../components/HotDealSection";
import { useSettings } from "../api/settings";
import { parseOrder } from "../lib/homeSections";

const SECTIONS = {
  hero: <HeroSlider />,
  hotdeal: <HotDealSection />,
  new: (
    <div className="pt-10 sm:pt-14">
      <BookRow eyebrow="อัปเดตล่าสุด" title="มาใหม่" sort="newest" />
    </div>
  ),
  bestseller: (
    <div className="pt-10 sm:pt-14">
      <BookRow eyebrow="ยอดนิยม" title="ขายดี" sort="popular" />
    </div>
  ),
  browse: <BrowseSections />,
  textmarquee: <TextMarquee />,
  ribbon: <PromoRibbon />,
  brands: <PublisherMarquee />,
};

export default function Home() {
  const { homeSectionOrder } = useSettings();
  const order = parseOrder(homeSectionOrder);
  return (
    <>
      {order.map((key) => (
        <Fragment key={key}>{SECTIONS[key]}</Fragment>
      ))}
    </>
  );
}
