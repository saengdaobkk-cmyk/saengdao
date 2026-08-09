import { Component } from "react";

// กันหน้าขาว: ถ้า component ใดพังตอน render จะโชว์ข้อความแทนที่จะจอขาวทั้งเว็บ
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // log ไว้ดูใน console (โปรดักชันจะเห็น stack จริงตรงนี้)
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-page px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold text-ink">เกิดข้อผิดพลาดชั่วคราว</h1>
        <p className="mt-2 text-[14px] text-sub">ลองรีเฟรชหน้าอีกครั้ง หากยังพบปัญหา โปรดแจ้งเรา</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-accent/90"
        >
          รีเฟรชหน้า
        </button>
      </div>
    );
  }
}
