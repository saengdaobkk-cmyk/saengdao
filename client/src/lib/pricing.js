// ราคาที่คิดจริง: Hot Deal (ในช่วงเวลา) > ราคาลด > ราคาปกติ
export function hotDealActive(book, now = Date.now()) {
  if (book?.hotDealPrice == null) return false;
  if (book.hotDealStart && now < new Date(book.hotDealStart).getTime()) return false;
  if (book.hotDealEnd && now > new Date(book.hotDealEnd).getTime()) return false;
  return true;
}

// พรีออเดอร์กำลัง active (เปิด + อยู่ในช่วงเวลา) — หมดเวลา = false → กลับราคาปกติ + ปิดพรีออเดอร์
export function preorderActive(book, now = Date.now()) {
  if (!book?.preorder) return false;
  if (book.preorderStart && now < new Date(book.preorderStart).getTime()) return false;
  if (book.preorderEnd && now > new Date(book.preorderEnd).getTime()) return false;
  return true;
}

// คืน { price, original, hot, discount, preorder } — price = ราคาที่แสดง/คิดจริง, original = ราคาปกติ (ขีดฆ่า)
export function priceInfo(book) {
  const original = Number(book.price);
  if (preorderActive(book) && book.preorderPrice != null)
    return { price: Number(book.preorderPrice), original, hot: false, discount: Number(book.preorderPrice) < original, preorder: true };
  if (hotDealActive(book)) return { price: Number(book.hotDealPrice), original, hot: true, discount: false, preorder: false };
  if (book.discountPrice != null) return { price: Number(book.discountPrice), original, hot: false, discount: true, preorder: false };
  return { price: original, original, hot: false, discount: false, preorder: false };
}
