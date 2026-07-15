import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <p className="text-[15px] font-medium tracking-tight text-sub">เกี่ยวกับเรา</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">
        ร้านหนังสือแสงดาว
      </h1>
      <p className="mt-6 text-[19px] leading-relaxed text-ink/80">
        SAENGDAO คือร้านหนังสือออนไลน์ที่คัดสรรหนังสือดีมีคุณภาพมาเพื่อคุณ
        ตั้งแต่วรรณกรรม นิยาย ธุรกิจ พัฒนาตัวเอง ไปจนถึงหนังสือสำหรับเด็ก
        เราเชื่อว่าหนังสือดีเล่มหนึ่งเปลี่ยนมุมมองชีวิตได้
      </p>

      {/* จุดเด่น */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { t: "คัดสรรอย่างดี", d: "ทุกเล่มผ่านการเลือกโดยทีมที่รักการอ่าน" },
          { t: "ส่งทั่วประเทศ", d: "จัดส่งถึงบ้านคุณอย่างปลอดภัย รวดเร็ว" },
          { t: "ราคาเป็นมิตร", d: "โปรโมชันและส่วนลดสม่ำเสมอ" },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl bg-mist p-6">
            <p className="text-[17px] font-semibold text-ink">{x.t}</p>
            <p className="mt-1.5 text-[16px] leading-relaxed text-sub">{x.d}</p>
          </div>
        ))}
      </div>

      {/* เรื่องราว */}
      <div className="mt-14 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tightest text-ink">เรื่องราวของเรา</h2>
        <p className="mt-4 text-[18px] leading-relaxed text-ink/80">
          ร้านหนังสือแสงดาวเริ่มต้นจากความรักในหนังสือ และความตั้งใจที่จะส่งต่อเรื่องราวดีๆ
          ให้ถึงมือผู้อ่านทุกคน เราดูแลทุกคำสั่งซื้อด้วยใจ ตั้งแต่การเลือกหนังสือ
          ห่ออย่างประณีต จนถึงส่งถึงมือคุณ
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/" className="rounded-full bg-accent px-7 py-3 text-[17px] font-medium text-white transition hover:bg-accent/90">
          เลือกซื้อหนังสือ
        </Link>
        <Link to="/contact" className="rounded-full border border-line px-7 py-3 text-[17px] font-medium text-ink transition hover:bg-mist">
          ติดต่อเรา
        </Link>
      </div>
    </div>
  );
}
