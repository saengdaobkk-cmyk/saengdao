// ราคาที่คิดจริง: Hot Deal (ในช่วงเวลา) > ราคาลด > ราคาปกติ
export function hotDealActive(book, now = Date.now()) {
  if (book?.hotDealPrice == null) return false;
  if (book.hotDealStart && now < new Date(book.hotDealStart).getTime()) return false;
  if (book.hotDealEnd && now > new Date(book.hotDealEnd).getTime()) return false;
  return true;
}

// คืน { price, original, hot, discount } — price = ราคาที่แสดง/คิดจริง, original = ราคาปกติ (ขีดฆ่า)
export function priceInfo(book) {
  const original = Number(book.price);
  if (hotDealActive(book)) return { price: Number(book.hotDealPrice), original, hot: true, discount: false };
  if (book.discountPrice != null) return { price: Number(book.discountPrice), original, hot: false, discount: true };
  return { price: original, original, hot: false, discount: false };
}
