import { Fragment } from "react";
import BookRow from "../components/BookRow";
import HeroSlider from "../components/HeroSlider";
import BrowseSections from "../components/BrowseSections";
import PublisherMarquee from "../components/PublisherMarquee";
import PromoRibbon from "../components/PromoRibbon";
import TextMarquee from "../components/TextMarquee";
import HotDealSection from "../components/HotDealSection";
import BookGridSection from "../components/BookGridSection";
import BlogSection from "../components/BlogSection";
import ParallaxBanner from "../components/ParallaxBanner";
import AuthorSpotlight from "../components/AuthorSpotlight";
import { useSettings } from "../api/settings";
import { parseOrder, parseRows, parseCustomRows, parseBanner, parseAuthorSpotlight, customKey, isCustomKey, customIdOf } from "../lib/homeSections";

// แถวหนังสือ (มาใหม่/ขายดี/แถวที่สร้างเอง) — ครอบด้วยระยะห่างมาตรฐาน
const Row = (cfg) => (
  <div className="pt-10 sm:pt-14">
    <BookRow title={cfg.title} subtitle={cfg.subtitle} sort={cfg.sort} mode={cfg.mode} bookIds={cfg.bookIds} limit={cfg.limit} />
  </div>
);

export default function Home() {
  const { homeSectionOrder, homeRows, homeCustomRows, homeBanner, homeAuthorSpotlight } = useSettings();
  const rows = parseRows(homeRows);
  const custom = parseCustomRows(homeCustomRows);
  const banner = parseBanner(homeBanner);
  const authorSpotlight = parseAuthorSpotlight(homeAuthorSpotlight);
  const customBy = Object.fromEntries(custom.map((r) => [customKey(r.id), r]));
  const order = parseOrder(homeSectionOrder, custom.map((r) => customKey(r.id)));

  const sections = {
    hero: <HeroSlider />,
    banner: <div className="pt-10 sm:pt-14"><ParallaxBanner banner={banner} /></div>,
    hotdeal: <HotDealSection title={rows.hotdeal.title} subtitle={rows.hotdeal.subtitle} />,
    new: Row(rows.new),
    bestseller: Row(rows.bestseller),
    browse: <BrowseSections title={rows.browse.title} subtitle={rows.browse.subtitle} />,
    recommend: (
      <div className="pt-10 sm:pt-14">
        <BookGridSection title={rows.recommend.title} subtitle={rows.recommend.subtitle} sort={rows.recommend.sort} mode={rows.recommend.mode} bookIds={rows.recommend.bookIds} limit={rows.recommend.limit} />
      </div>
    ),
    textmarquee: <TextMarquee />,
    ribbon: <PromoRibbon />,
    brands: <PublisherMarquee title={rows.brands.title} subtitle={rows.brands.subtitle} />,
    author: authorSpotlight.enabled && authorSpotlight.name.trim()
      ? <div className="pt-10 sm:pt-14"><AuthorSpotlight cfg={authorSpotlight} /></div>
      : null,
    blog: (
      <div className="pt-10 sm:pt-14">
        <BlogSection title={rows.blog.title} subtitle={rows.blog.subtitle} />
      </div>
    ),
  };

  const render = (key) => {
    if (isCustomKey(key)) return customBy[key] ? Row(customBy[key]) : null;
    return sections[key];
  };

  return (
    <>
      {order.map((key) => (
        <Fragment key={key}>{render(key)}</Fragment>
      ))}
    </>
  );
}
