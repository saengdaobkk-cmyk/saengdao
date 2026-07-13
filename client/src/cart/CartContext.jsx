import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { priceInfo } from "../lib/pricing";

const CartContext = createContext(null);
const STORAGE_KEY = "saengdao_cart";

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

  // sync ลง localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // เพิ่มลงตะกร้า — รองรับ variant (book.id + variantId เป็น key แยกบรรทัด)
  const add = (book, qty = 1, variant = null) => {
    const key = variant ? `${book.id}:${variant.id}` : book.id;
    // ปัดราคาต่อหน่วยขึ้นเป็นจำนวนเต็มบาท (Hot Deal/ลด/ปกติ ให้ตรงกับที่แสดง/คิดเงินจริง)
    const price = Math.ceil(
      variant ? Number(variant.discountPrice ?? variant.price) : priceInfo(book).price
    );
    const stock = variant ? variant.stock : book.stock;

    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(i.quantity + qty, stock) } : i
        );
      }
      return [
        ...prev,
        {
          key,
          id: book.id,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
          title: book.title,
          author: book.author,
          price,
          coverImage: book.coverImage,
          stock,
          quantity: Math.min(qty, stock),
        },
      ];
    });
  };

  const setQty = (key, qty) =>
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i
      )
    );

  const remove = (key) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, add, setQty, remove, clear, count, subtotal, drawerOpen, openDrawer, closeDrawer }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
