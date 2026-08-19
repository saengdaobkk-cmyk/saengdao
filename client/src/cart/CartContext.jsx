import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { priceInfo } from "../lib/pricing";

const CartContext = createContext(null);
const STORAGE_KEY = "saengdao_cart";
const NOTE_KEY = "saengdao_cart_note";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      // เติม key ให้ item เก่า (ก่อนมีระบบ variant)
      return saved.map((i) => ({ ...i, key: i.key || (i.variantId ? `${i.id}:${i.variantId}` : i.id) }));
    } catch {
      return [];
    }
  });

  // สถานะเปิด/ปิด Cart Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  // หมายเหตุถึงร้าน — กรอกในตะกร้า แล้วไหลไปหน้า checkout
  const [note, setNote] = useState(() => localStorage.getItem(NOTE_KEY) || "");

  // sync ลง localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    localStorage.setItem(NOTE_KEY, note);
  }, [note]);

  // เพิ่มลงตะกร้า — รองรับ variant (book.id + variantId เป็น key แยกบรรทัด)
  const add = (book, qty = 1, variant = null) => {
    const key = variant ? `${book.id}:${variant.id}` : book.id;
    // ปัดราคาต่อหน่วยขึ้นเป็นจำนวนเต็มบาท (Hot Deal/ลด/ปกติ ให้ตรงกับที่แสดง/คิดเงินจริง)
    const price = Math.ceil(
      variant ? Number(variant.discountPrice ?? variant.price) : priceInfo(book).price
    );
    const stock = variant ? variant.stock : book.stock;
    // พรีออเดอร์ (เฉพาะซื้อทั้งเล่ม ไม่ใช่ variant) → สั่งได้ไม่จำกัดตามสต็อก
    const preorder = !variant && !!book.preorder;
    const cap = preorder ? Number.POSITIVE_INFINITY : stock;

    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(i.quantity + qty, cap) } : i
        );
      }
      return [
        ...prev,
        {
          key,
          id: book.id,
          slug: book.slug || null,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
          title: book.title,
          author: book.author,
          price,
          coverImage: book.coverImage,
          stock,
          preorder,
          quantity: Math.min(qty, cap),
        },
      ];
    });
  };

  const setQty = (key, qty) =>
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, quantity: Math.max(1, Math.min(qty, i.preorder ? Number.POSITIVE_INFINITY : i.stock)) } : i
      )
    );

  const remove = (key) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clear = () => { setItems([]); setNote(""); };

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, add, setQty, remove, clear, count, subtotal, note, setNote, drawerOpen, openDrawer, closeDrawer }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
