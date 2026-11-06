import React, { useState } from 'react';
import { SaleRecord } from '../../types/sales';
import { CurrencyCode, formatCurrency, formatPercent } from '../../utils/formatters';
import {
  computeDailyTimeline,
  computeProductBreakdown,
  computePaymentBreakdown,
  computeDayOfWeekBreakdown,
} from '../../utils/analytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar, CreditCard, ShoppingBag, Eye } from 'lucide-react';

interface OverviewViewProps {
  records: SaleRecord[];
  currency: CurrencyCode;
  onSelectProduct?: (product: string) => void;
  onSelectPayment?: (method: string) => void;
}

const PAYMENT_COLORS: Record<string, string> = {
  'Credit Card': '#4f46e5', // indigo-600
  'Debit Card': '#06b6d4',  // cyan-500
  'eWallet': '#10b981',     // emerald-500
  'Cash': '#f59e0b',        // amber-500
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  records,
  currency,
  onSelectProduct,
  onSelectPayment,
}) => {
  const [timelineMode, setTimelineMode] = useState<'revenue' | 'cumulative' | 'units' | 'orders'>('revenue');

  const dailyData = computeDailyTimeline(records);
  const productData = computeProductBreakdown(records);
  const paymentData = computePaymentBreakdown(records);
  const dayOfWeekData = computeDayOfWeekBreakdown(records);

  const top10Products = productData.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* 1. Main Timeline Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Sales Cadence & Revenue Trajectory
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Aug 15, 2025 to Oct 7, 2025 · Daily commercial output and velocity
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs dark:border-slate-800 dark:bg-slate-800/80">
            <button
              onClick={() => setTimelineMode('revenue')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                timelineMode === 'revenue'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Daily Revenue
            </button>
            <button
              onClick={() => setTimelineMode('cumulative')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                timelineMode === 'cumulative'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Cumulative Run-Rate
            </button>
            <button
              onClick={() => setTimelineMode('units')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                timelineMode === 'units'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Units Dispatched
            </button>
            <button
              onClick={() => setTimelineMode('orders')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                timelineMode === 'orders'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Baskets (Orders)
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {timelineMode === 'revenue' ? (
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} interval={4} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => formatCurrency(val, currency)}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), 'Daily Revenue']}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.date || ''}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            ) : timelineMode === 'cumulative' ? (
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} interval={4} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => formatCurrency(val, currency)}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), 'Cumulative Revenue']}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.date || ''}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cumulativeRevenue" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#cumGrad)" />
              </AreaChart>
            ) : timelineMode === 'units' ? (
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} interval={4} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [val, 'Units Sold']}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.date || ''}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="units" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} interval={4} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [val, 'Distinct Orders']}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.date || ''}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Line type="stepAfter" dataKey="orders" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Middle Row: Product Revenue Ranking + Payment Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product Revenue Leaderboard (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Revenue by Apparel Line
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top revenue contributors and individual unit ASP
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {productData.length} active SKUs
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {top10Products.map((p, idx) => {
              const maxRev = productData[0]?.revenue || 1;
              const fillPct = (p.revenue / maxRev) * 100;
              return (
                <div
                  key={p.product}
                  onClick={() => onSelectProduct?.(p.product)}
                  className="group flex flex-col gap-1 rounded-lg p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors dark:text-slate-200 dark:group-hover:text-indigo-400">
                        {p.product}
                      </span>
                      <span className="text-[11px] text-slate-400">({p.category})</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="text-slate-500 text-[11px]">
                        {p.units} units × {formatCurrency(p.unitPrice, currency)}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(p.revenue, currency)}
                      </span>
                      <span className="w-12 text-right text-[11px] text-slate-500">
                        {formatPercent(p.revenueShare)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Donut (1 Col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Payment Channel Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share of wallet by settlement method
              </p>
            </div>

            <div className="mt-2 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="revenue"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {paymentData.map((entry) => (
                      <Cell
                        key={`cell-${entry.method}`}
                        fill={PAYMENT_COLORS[entry.method] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clean unboxed legend with tabular metrics */}
          <div className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-800 space-y-2">
            {paymentData.map((item) => (
              <div
                key={item.method}
                onClick={() => onSelectPayment?.(item.method)}
                className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-xs"
                    style={{ backgroundColor: PAYMENT_COLORS[item.method] || '#94a3b8' }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.method}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  <span>{formatCurrency(item.revenue, currency)}</span>
                  <span className="text-[11px] text-slate-400">({formatPercent(item.share)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Day of Week Cadence & Historical Highlights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Day of Week Analysis */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Sales by Day of the Week
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated weekly commercial distribution across all 54 recorded days
            </p>
          </div>

          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(d) => d.slice(0, 3)} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => formatCurrency(val, currency)}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Highlights */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Catalog & Commercial Key Insights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Key patterns derived from dataset transaction analysis
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Premium Tier Margin Strength
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Premium Tailored Trousers ($175.00) and Tailored Wool Dress Trousers ($145.00) represent the highest single-ticket contributions, generating over 25% of gross store revenue.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Multi-Item Basket Velocity
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    18 distinct orders contain 2 items simultaneously (e.g. TT-1001 with Denim Jeans + Performance Joggers), demonstrating strong cross-sell affinity between core pants and activewear.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Diverse Payment Split
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Electronic methods (Credit Card, Debit Card, eWallet) comprise over 75% of settlements, while Cash transactions maintain steady repeat velocity on mid-range staples.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 flex items-center justify-between">
            <span>Historical Range: 2025-08-15 → 2025-10-07</span>
            <span className="font-mono tabular-nums">{records.length} total records</span>
          </div>
        </div>
      </div>
    </div>
  );
};
