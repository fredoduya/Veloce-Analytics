import React, { useState, useMemo } from 'react';
import { SaleRecord } from '../../types/sales';
import { CurrencyCode, formatCurrency, formatPercent } from '../../utils/formatters';
import { PRODUCT_CATALOG } from '../../data/initialData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ComposedChart,
} from 'recharts';
import { Sliders, BarChart3, PieChart as PieIcon, LineChart as LineIcon, Download, RefreshCw } from 'lucide-react';

interface ChartStudioViewProps {
  records: SaleRecord[];
  currency: CurrencyCode;
}

type ChartType = 'bar-v' | 'bar-h' | 'line' | 'area' | 'pie' | 'radar' | 'composed';
type DimensionType = 'product' | 'paymentMethod' | 'category' | 'dayOfWeek' | 'date' | 'priceTier';
type MetricType = 'revenue' | 'units' | 'orders' | 'aov';

const PALETTES = {
  indigo: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
  emerald: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  amber: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  multi: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'],
};

export const ChartStudioView: React.FC<ChartStudioViewProps> = ({
  records,
  currency,
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar-v');
  const [dimension, setDimension] = useState<DimensionType>('product');
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [paletteKey, setPaletteKey] = useState<keyof typeof PALETTES>('multi');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'natural'>('desc');

  // Aggregation calculation
  const aggregatedData = useMemo(() => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const groups = new Map<string, { key: string; revenue: number; units: number; orders: Set<string> }>();

    records.forEach((r) => {
      let groupKey = '';
      if (dimension === 'product') {
        groupKey = r.product;
      } else if (dimension === 'paymentMethod') {
        groupKey = r.paymentMethod;
      } else if (dimension === 'category') {
        groupKey = PRODUCT_CATALOG[r.product]?.category || 'Other';
      } else if (dimension === 'dayOfWeek') {
        const d = new Date(r.date + 'T12:00:00Z');
        groupKey = daysOfWeek[d.getUTCDay()];
      } else if (dimension === 'date') {
        groupKey = r.date;
      } else if (dimension === 'priceTier') {
        if (r.price < 75) groupKey = 'Budget (<$75)';
        else if (r.price < 100) groupKey = 'Mid-Range ($75-$99)';
        else if (r.price < 150) groupKey = 'Upper-Mid ($100-$149)';
        else groupKey = 'Premium ($150+)';
      }

      const entry = groups.get(groupKey) || { key: groupKey, revenue: 0, units: 0, orders: new Set<string>() };
      entry.revenue += r.price;
      entry.units += 1;
      entry.orders.add(r.orderNumber);
      groups.set(groupKey, entry);
    });

    const totalRevenue = records.reduce((s, r) => s + r.price, 0);

    const list = Array.from(groups.values()).map((g) => {
      const orderCount = g.orders.size;
      const aov = orderCount > 0 ? g.revenue / orderCount : 0;
      return {
        dimension: g.key,
        revenue: Math.round(g.revenue * 100) / 100,
        units: g.units,
        orders: orderCount,
        aov: Math.round(aov * 100) / 100,
        share: totalRevenue > 0 ? (g.revenue / totalRevenue) * 100 : 0,
      };
    });

    if (sortOrder === 'desc') {
      list.sort((a, b) => b[metric] - a[metric]);
    } else if (sortOrder === 'asc') {
      list.sort((a, b) => a[metric] - b[metric]);
    } else if (sortOrder === 'natural') {
      list.sort((a, b) => a.dimension.localeCompare(b.dimension));
    }

    return list;
  }, [records, dimension, metric, sortOrder]);

  const activeColors = PALETTES[paletteKey];

  const getMetricLabel = () => {
    switch (metric) {
      case 'revenue': return `Gross Revenue (${currency})`;
      case 'units': return 'Units Dispatched';
      case 'orders': return 'Order Checkouts';
      case 'aov': return `Average Order Value (${currency})`;
    }
  };

  const formatMetricValue = (val: number) => {
    if (metric === 'revenue' || metric === 'aov') {
      return formatCurrency(val, currency);
    }
    return val.toLocaleString();
  };

  const handleExportCustomCSV = () => {
    const headers = ['Dimension', 'Revenue', 'Units', 'Orders', 'AOV', 'Share%'];
    const rows = aggregatedData.map((d) => [
      `"${d.dimension}"`,
      d.revenue.toFixed(2),
      d.units,
      d.orders,
      d.aov.toFixed(2),
      d.share.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `veloce_custom_${dimension}_by_${metric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Control Studio Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Visualizer Studio & Chart Designer
            </h2>
          </div>
          <button
            onClick={handleExportCustomCSV}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Aggregation</span>
          </button>
        </div>

        {/* 4 Interactive Dropdowns / Selectors */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {/* Chart Type */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Visual Style
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="bar-v">Vertical Columns</option>
              <option value="bar-h">Horizontal Bars</option>
              <option value="line">Trend Line</option>
              <option value="area">Area Mountain</option>
              <option value="pie">Donut / Pie</option>
              <option value="radar">Polar Radar</option>
              <option value="composed">Dual Composed</option>
            </select>
          </div>

          {/* Dimension */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Dimension (X-Axis)
            </label>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value as DimensionType)}
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="product">Product Line</option>
              <option value="paymentMethod">Payment Method</option>
              <option value="category">Category</option>
              <option value="dayOfWeek">Day of Week</option>
              <option value="priceTier">Price Tier</option>
              <option value="date">Calendar Date</option>
            </select>
          </div>

          {/* Metric */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Metric (Y-Axis)
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricType)}
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="revenue">Gross Revenue ($)</option>
              <option value="units">Units Dispatched</option>
              <option value="orders">Unique Orders</option>
              <option value="aov">Average Order Value ($)</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Sorting Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="desc">Highest Value First</option>
              <option value="asc">Lowest Value First</option>
              <option value="natural">Alphabetical</option>
            </select>
          </div>

          {/* Color Palette */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Palette
            </label>
            <select
              value={paletteKey}
              onChange={(e) => setPaletteKey(e.target.value as any)}
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="multi">Modern Spectrum</option>
              <option value="indigo">Electric Indigo</option>
              <option value="emerald">Botanical Emerald</option>
              <option value="amber">Warm Amber</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Chart Canvas */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              {getMetricLabel()} by {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive visualization computed over {records.length} data rows
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {aggregatedData.length} data bins
          </span>
        </div>

        {/* Dynamic Chart Container */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar-v' ? (
              <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -10, bottom: dimension === 'product' || dimension === 'date' ? 30 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis
                  dataKey="dimension"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={dimension === 'product' || dimension === 'date' ? -25 : 0}
                  textAnchor={dimension === 'product' || dimension === 'date' ? 'end' : 'middle'}
                  interval={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => (metric === 'revenue' || metric === 'aov' ? formatCurrency(val, currency) : val)}
                />
                <Tooltip
                  formatter={(val: any) => [formatMetricValue(Number(val)), getMetricLabel()]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
                  {aggregatedData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'bar-h' ? (
              <BarChart data={aggregatedData} layout="vertical" margin={{ top: 10, right: 20, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => (metric === 'revenue' || metric === 'aov' ? formatCurrency(val, currency) : val)}
                />
                <YAxis
                  dataKey="dimension"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={110}
                />
                <Tooltip
                  formatter={(val: any) => [formatMetricValue(Number(val)), getMetricLabel()]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
                  {aggregatedData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={aggregatedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="dimension" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => (metric === 'revenue' || metric === 'aov' ? formatCurrency(val, currency) : val)}
                />
                <Tooltip
                  formatter={(val: any) => [formatMetricValue(Number(val)), getMetricLabel()]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey={metric} stroke={activeColors[0]} strokeWidth={2.5} dot={{ r: 4, fill: activeColors[0] }} />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={aggregatedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="studioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeColors[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={activeColors[0]} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="dimension" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => (metric === 'revenue' || metric === 'aov' ? formatCurrency(val, currency) : val)}
                />
                <Tooltip
                  formatter={(val: any) => [formatMetricValue(Number(val)), getMetricLabel()]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey={metric} stroke={activeColors[0]} strokeWidth={2.5} fillOpacity={1} fill="url(#studioGrad)" />
              </AreaChart>
            ) : chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={aggregatedData}
                  dataKey={metric}
                  nameKey="dimension"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {aggregatedData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatMetricValue(Number(val)), getMetricLabel()]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            ) : chartType === 'radar' ? (
              <RadarChart data={aggregatedData}>
                <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Radar dataKey={metric} stroke={activeColors[0]} fill={activeColors[0]} fillOpacity={0.4} />
                <Tooltip
                  formatter={(val: any) => [formatMetricValue(Number(val)), getMetricLabel()]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
              </RadarChart>
            ) : (
              <ComposedChart data={aggregatedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="dimension" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? formatCurrency(Number(val), currency) : val,
                    name,
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar yAxisId="left" dataKey="revenue" fill={activeColors[0]} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="units" stroke="#10b981" strokeWidth={2} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Aggregation Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-3 mb-3 dark:border-slate-800">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Aggregated Tabular Summary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Numerical table backing the visualizer canvas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="pb-2 font-medium">Dimension</th>
                <th className="pb-2 font-medium text-right">Revenue</th>
                <th className="pb-2 font-medium text-right">Units</th>
                <th className="pb-2 font-medium text-right">Orders</th>
                <th className="pb-2 font-medium text-right">AOV</th>
                <th className="pb-2 font-medium text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums dark:divide-slate-800">
              {aggregatedData.map((row) => (
                <tr key={row.dimension} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 pr-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                    {row.dimension}
                  </td>
                  <td className="py-2 pr-4 text-right text-indigo-600 font-semibold dark:text-indigo-400">
                    {formatCurrency(row.revenue, currency)}
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {row.units}
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {row.orders}
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(row.aov, currency)}
                  </td>
                  <td className="py-2 text-right text-slate-500">
                    {formatPercent(row.share)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
