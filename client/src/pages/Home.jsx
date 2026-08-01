import { Fragment } from "react";
import BookRow from "../components/BookRow";
import HeroSlider from "../components/HeroSlider";
import BrowseSections from "../components/BrowseSections";
import PublisherMarquee from "../components/PublisherMarquee";
import PromoRibbon from "../components/PromoRibbon";
import TextMarquee from "../components/TextMarquee";
import HotDealSection from "../components/HotDealSection";
import { useSettings } from "../api/settings";
import { parseOrder, parseRows } from "../lib/homeSections";

export default function Home() {
  const { homeSectionOrder, homeRows } = useSettings();
  const order = parseOrder(homeSectionOrder);
  const rows = parseRows(homeRows);

  const sections = {
    hero: <HeroSlider />,
    hotdeal: <HotDealSection />,
    new: (
      <div className="pt-10 sm:pt-14">
        <BookRow title={rows.new.title} subtitle={rows.new.subtitle} sort={rows.new.sort} mode={rows.new.mode} bookIds={rows.new.bookIds} />
      </div>
    ),
    bestseller: (
      <div className="pt-10 sm:pt-14">
        <BookRow title={rows.bestseller.title} subtitle={rows.bestseller.subtitle} sort={rows.bestseller.sort} mode={rows.bestseller.mode} bookIds={rows.bestseller.bookIds} />
      </div>
    ),
    browse: <BrowseSections />,
    textmarquee: <TextMarquee />,
    ribbon: <PromoRibbon />,
    brands: <PublisherMarquee />,
  };

  return (
    <>
      {order.map((key) => (
        <Fragment key={key}>{sections[key]}</Fragment>
      ))}
    </>
  );
}
