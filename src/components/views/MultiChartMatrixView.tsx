import React, { useState } from 'react';
import { SaleRecord } from '../../types/sales';
import { CurrencyCode, formatCurrency, formatPercent } from '../../utils/formatters';
import { PRODUCT_CATALOG } from '../../data/initialData';
import {
  computeDailyTimeline,
  computeProductBreakdown,
  computePaymentBreakdown,
  computeDayOfWeekBreakdown,
} from '../../utils/analytics';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
} from 'recharts';

interface MultiChartMatrixViewProps {
  records: SaleRecord[];
  currency: CurrencyCode;
}

export const MultiChartMatrixView: React.FC<MultiChartMatrixViewProps> = ({
  records,
  currency,
}) => {
  const [groupByInterval, setGroupByInterval] = useState<'daily' | 'weekly'>('weekly');

  const dailyTimeline = computeDailyTimeline(records);
  const products = computeProductBreakdown(records);
  const payments = computePaymentBreakdown(records);
  const dayOfWeek = computeDayOfWeekBreakdown(records);

  // 1. Stacked Timeline by Payment Method (Weekly or Daily)
  const stackedTimeline = React.useMemo(() => {
    // Group records by week or date
    const map = new Map<string, { label: string; 'Credit Card': number; 'Debit Card': number; eWallet: number; Cash: number; total: number }>();

    records.forEach((r) => {
      let key = r.date;
      let label = r.date.slice(5);

      if (groupByInterval === 'weekly') {
        const d = new Date(r.date + 'T12:00:00Z');
        // calculate week starting monday
        const day = d.getUTCDay();
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        key = monday.toISOString().slice(0, 10);
        label = `Wk ${key.slice(5)}`;
      }

      const cur = map.get(key) || {
        label,
        'Credit Card': 0,
        'Debit Card': 0,
        eWallet: 0,
        Cash: 0,
        total: 0,
      };

      const m = r.paymentMethod as 'Credit Card' | 'Debit Card' | 'eWallet' | 'Cash';
      if (cur[m] !== undefined) {
        cur[m] += r.price;
      }
      cur.total += r.price;
      map.set(key, cur);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, data]) => data);
  }, [records, groupByInterval]);

  // 2. Price Elasticity / Bubble Scatter Data: Price vs Units Sold
  const scatterData = React.useMemo(() => {
    return products.map((p) => ({
      name: p.product,
      category: p.category,
      price: p.unitPrice,
      units: p.units,
      revenue: p.revenue,
      z: p.revenue, // bubble size
    }));
  }, [products]);

  // 3. Category Breakdown Data
  const categoryData = React.useMemo(() => {
    const map = new Map<string, { revenue: number; units: number; skus: number }>();
    products.forEach((p) => {
      const cur = map.get(p.category) || { revenue: 0, units: 0, skus: 0 };
      cur.revenue += p.revenue;
      cur.units += p.units;
      cur.skus += 1;
      map.set(p.category, cur);
    });
    return Array.from(map.entries()).map(([cat, val]) => ({
      category: cat,
      revenue: val.revenue,
      units: val.units,
      skus: val.skus,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [products]);

  // 4. Payment Radar Data (Normalized scores 0-100)
  const radarData = React.useMemo(() => {
    const maxRev = Math.max(...payments.map((p) => p.revenue), 1);
    const maxOrders = Math.max(...payments.map((p) => p.orderCount), 1);
    const maxUnits = Math.max(...payments.map((p) => p.units), 1);
    const maxAvgBasket = Math.max(...payments.map((p) => p.avgBasket), 1);

    return [
      {
        dimension: 'Revenue Share',
        'Credit Card': Math.round(((payments.find((p) => p.method === 'Credit Card')?.revenue || 0) / maxRev) * 100),
        'Debit Card': Math.round(((payments.find((p) => p.method === 'Debit Card')?.revenue || 0) / maxRev) * 100),
        eWallet: Math.round(((payments.find((p) => p.method === 'eWallet')?.revenue || 0) / maxRev) * 100),
        Cash: Math.round(((payments.find((p) => p.method === 'Cash')?.revenue || 0) / maxRev) * 100),
      },
      {
        dimension: 'Order Frequency',
        'Credit Card': Math.round(((payments.find((p) => p.method === 'Credit Card')?.orderCount || 0) / maxOrders) * 100),
        'Debit Card': Math.round(((payments.find((p) => p.method === 'Debit Card')?.orderCount || 0) / maxOrders) * 100),
        eWallet: Math.round(((payments.find((p) => p.method === 'eWallet')?.orderCount || 0) / maxOrders) * 100),
        Cash: Math.round(((payments.find((p) => p.method === 'Cash')?.orderCount || 0) / maxOrders) * 100),
      },
      {
        dimension: 'Units Velocity',
        'Credit Card': Math.round(((payments.find((p) => p.method === 'Credit Card')?.units || 0) / maxUnits) * 100),
        'Debit Card': Math.round(((payments.find((p) => p.method === 'Debit Card')?.units || 0) / maxUnits) * 100),
        eWallet: Math.round(((payments.find((p) => p.method === 'eWallet')?.units || 0) / maxUnits) * 100),
        Cash: Math.round(((payments.find((p) => p.method === 'Cash')?.units || 0) / maxUnits) * 100),
      },
      {
        dimension: 'Ticket Size',
        'Credit Card': Math.round(((payments.find((p) => p.method === 'Credit Card')?.avgBasket || 0) / maxAvgBasket) * 100),
        'Debit Card': Math.round(((payments.find((p) => p.method === 'Debit Card')?.avgBasket || 0) / maxAvgBasket) * 100),
        eWallet: Math.round(((payments.find((p) => p.method === 'eWallet')?.avgBasket || 0) / maxAvgBasket) * 100),
        Cash: Math.round(((payments.find((p) => p.method === 'Cash')?.avgBasket || 0) / maxAvgBasket) * 100),
      },
    ];
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Multi-Dimensional Visualization Matrix
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Comparative views exploring price elasticity, category mix, payment wallet share, and time cadence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Timeline Grouping:</span>
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-800 dark:bg-slate-800">
            <button
              onClick={() => setGroupByInterval('weekly')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                groupByInterval === 'weekly'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Weekly Cohorts
            </button>
            <button
              onClick={() => setGroupByInterval('daily')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                groupByInterval === 'daily'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Daily Points
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 4 Specialized Visualizations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Stacked Payment Trend Over Time */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Revenue Mix by Payment Method ({groupByInterval === 'weekly' ? 'Weekly' : 'Daily'})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stacked contribution of Credit Card, Debit Card, eWallet, and Cash
            </p>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => formatCurrency(val, currency)}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [formatCurrency(Number(val), currency), name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Credit Card" stackId="a" fill="#4f46e5" />
                <Bar dataKey="Debit Card" stackId="a" fill="#06b6d4" />
                <Bar dataKey="eWallet" stackId="a" fill="#10b981" />
                <Bar dataKey="Cash" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Price Elasticity: Price vs Units vs Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Price Elasticity & Volume Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              X = Unit Price ($) · Y = Units Sold · Bubble Size = Total Revenue
            </p>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis
                  type="number"
                  dataKey="price"
                  name="Price"
                  domain={[50, 185]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <YAxis
                  type="number"
                  dataKey="units"
                  name="Units Sold"
                  domain={[0, 14]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <ZAxis type="number" dataKey="revenue" range={[60, 450]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg bg-slate-900 p-2.5 text-xs text-white shadow-xl border border-slate-700">
                          <div className="font-semibold">{data.name}</div>
                          <div className="text-[11px] text-slate-400">{data.category}</div>
                          <div className="mt-1 font-mono tabular-nums space-y-0.5">
                            <div>Unit Price: {formatCurrency(data.price, currency)}</div>
                            <div>Units Sold: {data.units} items</div>
                            <div className="text-indigo-400">Total Revenue: {formatCurrency(data.revenue, currency)}</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Products" data={scatterData} fill="#6366f1" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Category Mix Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Apparel Category Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated revenue and unit volume grouped by style category
            </p>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => formatCurrency(val, currency)}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  width={90}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? formatCurrency(Number(val), currency) : val,
                    name === 'revenue' ? 'Revenue' : 'Units',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Dual-Axis Velocity: Daily Revenue vs Order Count */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Daily Order Volume vs. Gross Revenue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Composed chart correlating order count spikes with revenue generation
            </p>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} interval={5} />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => formatCurrency(val, currency)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={[0, 5]}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? formatCurrency(Number(val), currency) : `${val} orders`,
                    name === 'revenue' ? 'Revenue' : 'Orders',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
