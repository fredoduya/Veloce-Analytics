import React, { useState } from 'react';
import { SaleRecord } from '../../types/sales';
import { CurrencyCode, formatCurrency, formatPercent } from '../../utils/formatters';
import { computeProductBreakdown, computeBasketPairs } from '../../utils/analytics';
import { PRODUCT_CATALOG } from '../../data/initialData';
import { ArrowUpDown, ShoppingBag, Layers, GitCompare } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface ProductAnalyticsViewProps {
  records: SaleRecord[];
  currency: CurrencyCode;
}

export const ProductAnalyticsView: React.FC<ProductAnalyticsViewProps> = ({
  records,
  currency,
}) => {
  const [sortField, setSortField] = useState<'revenue' | 'units' | 'unitPrice' | 'orderCount'>('revenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const productData = computeProductBreakdown(records);
  const basketPairs = computeBasketPairs(records);

  const sortedProducts = [...productData].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: 'revenue' | 'units' | 'unitPrice' | 'orderCount') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Price tier groupings
  const tiers = React.useMemo(() => {
    const groups = {
      'Accessible (<$75)': { revenue: 0, units: 0, products: [] as string[] },
      'Core Casual ($75 - $99)': { revenue: 0, units: 0, products: [] as string[] },
      'Tailored & Heritage ($100 - $149)': { revenue: 0, units: 0, products: [] as string[] },
      'Luxury Formal ($150+)': { revenue: 0, units: 0, products: [] as string[] },
    };

    productData.forEach((p) => {
      let tierKey: keyof typeof groups = 'Core Casual ($75 - $99)';
      if (p.unitPrice < 75) tierKey = 'Accessible (<$75)';
      else if (p.unitPrice >= 150) tierKey = 'Luxury Formal ($150+)';
      else if (p.unitPrice >= 100) tierKey = 'Tailored & Heritage ($100 - $149)';

      groups[tierKey].revenue += p.revenue;
      groups[tierKey].units += p.units;
      groups[tierKey].products.push(p.product);
    });

    const totalRev = productData.reduce((s, p) => s + p.revenue, 0);

    return Object.entries(groups).map(([tierName, val]) => ({
      tier: tierName,
      revenue: val.revenue,
      units: val.units,
      productCount: val.products.length,
      revenueShare: totalRev > 0 ? (val.revenue / totalRev) * 100 : 0,
    }));
  }, [productData]);

  return (
    <div className="space-y-6">
      {/* 1. Price Tier Performance Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t, idx) => (
          <div
            key={t.tier}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.tier}
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight text-slate-900 font-mono tabular-nums dark:text-white">
              {formatCurrency(t.revenue, currency)}
            </div>
            <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums dark:text-slate-400">
              <span>{t.units} units sold</span>
              <span aria-hidden="true" className="mx-1.5 opacity-60 font-sans">·</span>
              <span>{formatPercent(t.revenueShare)} share</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Interactive Product Comparison Matrix */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Apparel Line Ledger & Margins
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Click column headers to sort by revenue, ASP, volume, or order frequency
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {productData.length} total SKUs
          </span>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="pb-2.5 font-medium">Product / SKU</th>
                <th className="pb-2.5 font-medium">Category</th>
                <th
                  onClick={() => handleSort('unitPrice')}
                  className="pb-2.5 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unit ASP</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('units')}
                  className="pb-2.5 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Units Sold</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="pb-2.5 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Gross Revenue</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="pb-2.5 font-medium text-right">Revenue Share</th>
                <th
                  onClick={() => handleSort('orderCount')}
                  className="pb-2.5 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Distinct Baskets</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums dark:divide-slate-800/60">
              {sortedProducts.map((p) => {
                const isSelected = selectedProduct === p.product;
                return (
                  <tr
                    key={p.product}
                    onClick={() => setSelectedProduct(isSelected ? null : p.product)}
                    className={`transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {p.product}
                    </td>
                    <td className="py-2.5 pr-4 font-sans text-slate-500 dark:text-slate-400">
                      {p.category}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-slate-700 dark:text-slate-300">
                      {formatCurrency(p.unitPrice, currency)}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-slate-900 font-semibold dark:text-white">
                      {p.units}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-indigo-600 font-semibold dark:text-indigo-400">
                      {formatCurrency(p.revenue, currency)}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-slate-500">
                      {formatPercent(p.revenueShare)}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                      {p.orderCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Basket Co-Occurrence & Cross-Sell Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Basket Pairs Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Basket Affinity & Co-Purchases
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Item combinations occurring in the 18 multi-item orders in this period
            </p>
          </div>

          <div className="mt-4 space-y-2.5">
            {basketPairs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No multi-item baskets matching current filter criteria.
              </p>
            ) : (
              basketPairs.map((pair, idx) => (
                <div
                  key={pair.pair}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-[10px] font-mono text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <div className="text-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {pair.itemA}
                      </div>
                      <div className="text-slate-500 text-[11px] dark:text-slate-400">
                        + {pair.itemB}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums text-xs">
                    <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {pair.count} {pair.count === 1 ? 'basket' : 'baskets'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Comb: {formatCurrency(pair.totalPairValue, currency)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Merchandising Strategic Takeaways */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Merchandising Recommendations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actionable catalog optimization based on transaction pairings
              </p>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                  1. Bundle: Chinos + Work Pants Bundle
                </span>
                Repeated across multiple transaction orders (TT-1015, TT-1034, TT-1065). Offering a curated bundle discount for workplace and casual rotation would drive higher multi-unit conversion.
              </div>

              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                  2. Cross-Category Activewear Attach
                </span>
                Joggers consistently attach with Denim Jeans (TT-1001) and Drawstring Linen Trousers (TT-1059, TT-1079), confirming customer interest in lifestyle versatility.
              </div>

              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                  3. Premium Trousers Standalone Pull
                </span>
                The highest-priced item ($175.00) is almost exclusively purchased as a focused single-item investment purchase, warranting targeted high-touch post-purchase follow-up.
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 flex items-center justify-between">
            <span>Multi-item Order Ratio</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              18.4% of total checkouts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
