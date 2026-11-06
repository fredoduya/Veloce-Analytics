import React, { useState } from 'react';
import { SaleRecord } from '../../types/sales';
import { CurrencyCode, formatCurrency } from '../../utils/formatters';
import { computeDailyTimeline, computeDayOfWeekBreakdown } from '../../utils/analytics';
import { Calendar, ChevronRight, Filter } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TemporalAnalyticsViewProps {
  records: SaleRecord[];
  currency: CurrencyCode;
  onFilterDate?: (dateStr: string) => void;
}

export const TemporalAnalyticsView: React.FC<TemporalAnalyticsViewProps> = ({
  records,
  currency,
  onFilterDate,
}) => {
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);

  const dailyTimeline = computeDailyTimeline(records);
  const dayOfWeek = computeDayOfWeekBreakdown(records);

  // Group daily records into calendar days
  const dailyRecordMap = React.useMemo(() => {
    const map = new Map<string, SaleRecord[]>();
    records.forEach((r) => {
      const list = map.get(r.date) || [];
      list.push(r);
      map.set(r.date, list);
    });
    return map;
  }, [records]);

  // Generate calendar days for Aug, Sep, Oct 2025
  const calendarMonths = [
    { year: 2025, month: 7, name: 'August 2025', daysInMonth: 31, startOffset: 5 }, // Aug 1, 2025 was Friday (offset 5)
    { year: 2025, month: 8, name: 'September 2025', daysInMonth: 30, startOffset: 1 }, // Sep 1 was Monday
    { year: 2025, month: 9, name: 'October 2025', daysInMonth: 31, startOffset: 3 }, // Oct 1 was Wednesday
  ];

  // Helper for heatmap colors
  const getCellIntensity = (rev: number) => {
    if (rev === 0) return 'bg-slate-100 dark:bg-slate-800/40 text-slate-400';
    if (rev < 100) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300';
    if (rev < 200) return 'bg-indigo-300 text-indigo-950 dark:bg-indigo-800 dark:text-indigo-100';
    if (rev < 300) return 'bg-indigo-500 text-white dark:bg-indigo-600';
    return 'bg-indigo-700 text-white dark:bg-indigo-500 font-bold';
  };

  const selectedRecords = selectedDayDetail ? dailyRecordMap.get(selectedDayDetail) || [] : [];
  const selectedDayTotal = selectedRecords.reduce((s, r) => s + r.price, 0);

  // Month-over-Month aggregated velocity
  const monthlyRunRate = React.useMemo(() => {
    const months = [
      { id: '2025-08', label: 'August 2025 (Aug 15 - 31)', daysActive: 17 },
      { id: '2025-09', label: 'September 2025 (Full Month)', daysActive: 30 },
      { id: '2025-10', label: 'October 2025 (Oct 1 - 7)', daysActive: 7 },
    ];

    return months.map((m) => {
      const mRecords = records.filter((r) => r.date.startsWith(m.id));
      const rev = mRecords.reduce((s, r) => s + r.price, 0);
      const orders = new Set(mRecords.map((r) => r.orderNumber)).size;
      return {
        month: m.label,
        revenue: rev,
        units: mRecords.length,
        orders,
        dailyAverage: m.daysActive > 0 ? rev / m.daysActive : 0,
      };
    });
  }, [records]);

  return (
    <div className="space-y-6">
      {/* 1. Interactive Heatmap Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Daily Transaction Heatmap Calendar
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Hover or click any calendar date to inspect order details and basket combinations
            </p>
          </div>

          {/* Intensity Legend */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Low ($0)</span>
            <div className="h-3 w-3 rounded-xs bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-3 rounded-xs bg-indigo-100 dark:bg-indigo-950" />
            <div className="h-3 w-3 rounded-xs bg-indigo-300 dark:bg-indigo-800" />
            <div className="h-3 w-3 rounded-xs bg-indigo-500 dark:bg-indigo-600" />
            <div className="h-3 w-3 rounded-xs bg-indigo-700 dark:bg-indigo-500" />
            <span>High ($300+)</span>
          </div>
        </div>

        {/* 3 Calendar Month Grids */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {calendarMonths.map((m) => {
            const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            return (
              <div key={m.name} className="rounded-lg border border-slate-100 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="text-center font-display text-xs font-bold text-slate-900 dark:text-white mb-2">
                  {m.name}
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-400 mb-1">
                  {weekDays.map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Leading empty cells */}
                  {Array.from({ length: m.startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-9 rounded-sm bg-transparent" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: m.daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `2025-${String(m.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const daySales = dailyRecordMap.get(dateStr) || [];
                    const rev = daySales.reduce((s, r) => s + r.price, 0);
                    const isSelected = selectedDayDetail === dateStr;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDayDetail(isSelected ? null : dateStr)}
                        className={`group relative flex h-9 flex-col items-center justify-center rounded-sm text-[11px] transition-all cursor-pointer ${getCellIntensity(
                          rev
                        )} ${
                          isSelected ? 'ring-2 ring-indigo-600 ring-offset-1 dark:ring-offset-slate-900' : ''
                        }`}
                        title={`${dateStr}: ${daySales.length} items, ${formatCurrency(rev, currency)}`}
                      >
                        <span className="font-mono text-[10px]">{dayNum}</span>
                        {rev > 0 && (
                          <span className="text-[9px] font-mono leading-none opacity-90">
                            ${Math.round(rev)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Day Order Detail Panel */}
        {selectedDayDetail && (
          <div className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2 dark:border-indigo-900/40">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-display font-semibold text-xs text-slate-900 dark:text-white">
                  Transactions on {selectedDayDetail}
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  ({selectedRecords.length} items · Total: {formatCurrency(selectedDayTotal, currency)})
                </span>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400"
              >
                Close
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selectedRecords.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-white bg-white/90 p-2 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{r.product}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Order {r.orderNumber} · {r.paymentMethod}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(r.price, currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Month-over-Month Velocity & Day of Week Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Month Run Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Monthly Output & Normalized Run-Rates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standardized daily revenue average across recorded months
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {monthlyRunRate.map((m) => (
              <div
                key={m.month}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200">
                  <span>{m.month}</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                    {formatCurrency(m.revenue, currency)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  <span>{m.units} units in {m.orders} orders</span>
                  <span>Daily Velocity: {formatCurrency(m.dailyAverage, currency)}/day</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day of Week Ticket Size */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Average Basket Value by Day of Week
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Examines spending intensity per shopping session on each weekday
            </p>
          </div>

          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeek} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(d) => d.slice(0, 3)} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => formatCurrency(val, currency)}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), 'Avg Order Value']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="avgOrderValue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
