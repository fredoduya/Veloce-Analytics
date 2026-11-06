import { SaleRecord, FilterState, KPIStats } from '../types/sales';
import { PRODUCT_CATALOG } from '../data/initialData';

export function filterRecords(records: SaleRecord[], filters: FilterState): SaleRecord[] {
  return records.filter((item) => {
    // Search query: matches product, order number, or payment method
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        item.product.toLowerCase().includes(q) ||
        item.orderNumber.toLowerCase().includes(q) ||
        item.paymentMethod.toLowerCase().includes(q) ||
        item.date.includes(q);
      if (!match) return false;
    }

    // Date range filter
    if (filters.dateRange === 'aug2025') {
      if (!item.date.startsWith('2025-08')) return false;
    } else if (filters.dateRange === 'sep2025') {
      if (!item.date.startsWith('2025-09')) return false;
    } else if (filters.dateRange === 'oct2025') {
      if (!item.date.startsWith('2025-10')) return false;
    } else if (filters.dateRange === 'custom') {
      if (filters.startDate && item.date < filters.startDate) return false;
      if (filters.endDate && item.date > filters.endDate) return false;
    }

    // Product filter
    if (filters.products.length > 0 && !filters.products.includes(item.product)) {
      return false;
    }

    // Payment method filter
    if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(item.paymentMethod)) {
      return false;
    }

    // Price range filter
    if (item.price < filters.minPrice || item.price > filters.maxPrice) {
      return false;
    }

    return true;
  });
}

export function computeKPIs(records: SaleRecord[]): KPIStats {
  if (records.length === 0) {
    return {
      totalRevenue: 0,
      totalUnits: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      avgItemPrice: 0,
      topProduct: { name: 'None', revenue: 0, units: 0 },
      topPaymentMethod: { name: 'None', revenue: 0, share: 0 },
      multiItemOrdersCount: 0,
    };
  }

  const totalRevenue = records.reduce((sum, r) => sum + r.price, 0);
  const totalUnits = records.length;

  // Group by orderNumber
  const orderMap = new Map<string, { total: number; count: number }>();
  const productMap = new Map<string, { units: number; revenue: number }>();
  const paymentMap = new Map<string, { count: number; revenue: number }>();

  records.forEach((r) => {
    // Orders
    const ord = orderMap.get(r.orderNumber) || { total: 0, count: 0 };
    ord.total += r.price;
    ord.count += 1;
    orderMap.set(r.orderNumber, ord);

    // Products
    const prod = productMap.get(r.product) || { units: 0, revenue: 0 };
    prod.units += 1;
    prod.revenue += r.price;
    productMap.set(r.product, prod);

    // Payments
    const pay = paymentMap.get(r.paymentMethod) || { count: 0, revenue: 0 };
    pay.count += 1;
    pay.revenue += r.price;
    paymentMap.set(r.paymentMethod, pay);
  });

  const totalOrders = orderMap.size;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const avgItemPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

  // Multi-item orders count
  let multiItemOrdersCount = 0;
  orderMap.forEach((val) => {
    if (val.count > 1) multiItemOrdersCount++;
  });

  // Top Product
  let topProdName = 'None';
  let topProdRevenue = 0;
  let topProdUnits = 0;
  productMap.forEach((val, name) => {
    if (val.revenue > topProdRevenue) {
      topProdRevenue = val.revenue;
      topProdName = name;
      topProdUnits = val.units;
    }
  });

  // Top Payment Method
  let topPayName = 'None';
  let topPayRevenue = 0;
  paymentMap.forEach((val, name) => {
    if (val.revenue > topPayRevenue) {
      topPayRevenue = val.revenue;
      topPayName = name;
    }
  });
  const topPayShare = totalRevenue > 0 ? (topPayRevenue / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalUnits,
    totalOrders,
    avgOrderValue,
    avgItemPrice,
    topProduct: { name: topProdName, revenue: topProdRevenue, units: topProdUnits },
    topPaymentMethod: { name: topPayName, revenue: topPayRevenue, share: topPayShare },
    multiItemOrdersCount,
  };
}

export interface DailyDataPoint {
  date: string;
  formattedDate: string;
  revenue: number;
  units: number;
  orders: number;
  cumulativeRevenue: number;
  dayOfWeek: string;
}

export function computeDailyTimeline(records: SaleRecord[]): DailyDataPoint[] {
  // Aggregate by date
  const map = new Map<string, { revenue: number; units: number; ordersSet: Set<string> }>();

  records.forEach((r) => {
    const entry = map.get(r.date) || { revenue: 0, units: 0, ordersSet: new Set<string>() };
    entry.revenue += r.price;
    entry.units += 1;
    entry.ordersSet.add(r.orderNumber);
    map.set(r.date, entry);
  });

  // Sort dates
  const sortedDates = Array.from(map.keys()).sort();
  let cumulative = 0;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return sortedDates.map((dateStr) => {
    const entry = map.get(dateStr)!;
    cumulative += entry.revenue;
    const d = new Date(dateStr + 'T12:00:00Z');
    const dayName = daysOfWeek[d.getUTCDay()];
    const shortDate = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;

    return {
      date: dateStr,
      formattedDate: `${dayName} ${shortDate}`,
      revenue: Math.round(entry.revenue * 100) / 100,
      units: entry.units,
      orders: entry.ordersSet.size,
      cumulativeRevenue: Math.round(cumulative * 100) / 100,
      dayOfWeek: dayName,
    };
  });
}

export interface ProductBreakdown {
  product: string;
  category: string;
  unitPrice: number;
  units: number;
  revenue: number;
  revenueShare: number;
  orderCount: number;
}

export function computeProductBreakdown(records: SaleRecord[]): ProductBreakdown[] {
  const totalRevenue = records.reduce((s, r) => s + r.price, 0);
  const map = new Map<string, { units: number; revenue: number; orders: Set<string> }>();

  records.forEach((r) => {
    const entry = map.get(r.product) || { units: 0, revenue: 0, orders: new Set<string>() };
    entry.units += 1;
    entry.revenue += r.price;
    entry.orders.add(r.orderNumber);
    map.set(r.product, entry);
  });

  const list: ProductBreakdown[] = [];
  map.forEach((val, product) => {
    const catalogInfo = PRODUCT_CATALOG[product] || { category: 'Other', price: val.revenue / (val.units || 1) };
    list.push({
      product,
      category: catalogInfo.category,
      unitPrice: catalogInfo.price,
      units: val.units,
      revenue: val.revenue,
      revenueShare: totalRevenue > 0 ? (val.revenue / totalRevenue) * 100 : 0,
      orderCount: val.orders.size,
    });
  });

  return list.sort((a, b) => b.revenue - a.revenue);
}

export interface PaymentBreakdown {
  method: string;
  revenue: number;
  units: number;
  orderCount: number;
  avgBasket: number;
  share: number;
}

export function computePaymentBreakdown(records: SaleRecord[]): PaymentBreakdown[] {
  const totalRevenue = records.reduce((s, r) => s + r.price, 0);
  const map = new Map<string, { revenue: number; units: number; orders: Set<string> }>();

  records.forEach((r) => {
    const entry = map.get(r.paymentMethod) || { revenue: 0, units: 0, orders: new Set<string>() };
    entry.revenue += r.price;
    entry.units += 1;
    entry.orders.add(r.orderNumber);
    map.set(r.paymentMethod, entry);
  });

  const list: PaymentBreakdown[] = [];
  map.forEach((val, method) => {
    const orderCount = val.orders.size;
    list.push({
      method,
      revenue: val.revenue,
      units: val.units,
      orderCount,
      avgBasket: orderCount > 0 ? val.revenue / orderCount : 0,
      share: totalRevenue > 0 ? (val.revenue / totalRevenue) * 100 : 0,
    });
  });

  return list.sort((a, b) => b.revenue - a.revenue);
}

export interface DayOfWeekBreakdown {
  day: string;
  dayIndex: number;
  revenue: number;
  units: number;
  orders: number;
  avgOrderValue: number;
}

export function computeDayOfWeekBreakdown(records: SaleRecord[]): DayOfWeekBreakdown[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const data = dayNames.map((day, idx) => ({
    day,
    dayIndex: idx,
    revenue: 0,
    units: 0,
    ordersSet: new Set<string>(),
  }));

  records.forEach((r) => {
    const d = new Date(r.date + 'T12:00:00Z');
    const dayIdx = d.getUTCDay();
    data[dayIdx].revenue += r.price;
    data[dayIdx].units += 1;
    data[dayIdx].ordersSet.add(r.orderNumber);
  });

  return data.map((d) => ({
    day: d.day,
    dayIndex: d.dayIndex,
    revenue: Math.round(d.revenue * 100) / 100,
    units: d.units,
    orders: d.ordersSet.size,
    avgOrderValue: d.ordersSet.size > 0 ? Math.round((d.revenue / d.ordersSet.size) * 100) / 100 : 0,
  }));
}

export interface BasketPair {
  pair: string;
  itemA: string;
  itemB: string;
  count: number;
  totalPairValue: number;
}

export function computeBasketPairs(records: SaleRecord[]): BasketPair[] {
  // Group by orderNumber
  const orders = new Map<string, SaleRecord[]>();
  records.forEach((r) => {
    const list = orders.get(r.orderNumber) || [];
    list.push(r);
    orders.set(r.orderNumber, list);
  });

  const pairCounts = new Map<string, { itemA: string; itemB: string; count: number; totalPairValue: number }>();

  orders.forEach((items) => {
    if (items.length > 1) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i].product;
          const b = items[j].product;
          const key = a < b ? `${a} + ${b}` : `${b} + ${a}`;
          const [first, second] = a < b ? [a, b] : [b, a];
          
          const cur = pairCounts.get(key) || { itemA: first, itemB: second, count: 0, totalPairValue: 0 };
          cur.count += 1;
          cur.totalPairValue += items[i].price + items[j].price;
          pairCounts.set(key, cur);
        }
      }
    }
  });

  return Array.from(pairCounts.entries())
    .map(([pair, data]) => ({
      pair,
      itemA: data.itemA,
      itemB: data.itemB,
      count: data.count,
      totalPairValue: data.totalPairValue,
    }))
    .sort((a, b) => b.count - a.count);
}
