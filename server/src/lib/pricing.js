// ราคาที่คิดจริง: Hot Deal (ถ้าอยู่ในช่วงเวลา) > ราคาลด (discountPrice) > ราคาปกติ
export function hotDealActive(book, now = new Date()) {
  if (book?.hotDealPrice == null) return false;
  if (book.hotDealStart && now < new Date(book.hotDealStart)) return false;
  if (book.hotDealEnd && now > new Date(book.hotDealEnd)) return false;
  return true;
}

export function effectivePrice(book) {
  if (hotDealActive(book)) return Number(book.hotDealPrice);
  if (book.discountPrice != null) return Number(book.discountPrice);
  return Number(book.price);
}

// where clause: หนังสือที่มี Hot Deal กำลัง active ตอนนี้
export function hotDealWhere(now = new Date()) {
  return {
    hotDealPrice: { not: null },
    AND: [
      { OR: [{ hotDealStart: null }, { hotDealStart: { lte: now } }] },
      { OR: [{ hotDealEnd: null }, { hotDealEnd: { gte: now } }] },
    ],
  };
}
