import React from 'react';
import { KPIStats } from '../types/sales';
import { CurrencyCode, formatCurrency, formatPercent } from '../utils/formatters';
import { DollarSign, ShoppingBag, Receipt, TrendingUp, CreditCard } from 'lucide-react';

interface KpiCardsProps {
  kpis: KPIStats;
  currency: CurrencyCode;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, currency }) => {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {/* 1. Total Net Revenue */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Gross Revenue</span>
          <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums dark:text-white">
          {formatCurrency(kpis.totalRevenue, currency)}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{kpis.totalOrders} total orders</span>
          <span aria-hidden="true" className="mx-1.5 opacity-60">·</span>
          <span>Avg ticket {formatCurrency(kpis.avgOrderValue, currency)}</span>
        </div>
      </div>

      {/* 2. Units Sold & Baskets */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Units Dispatched</span>
          <ShoppingBag className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums dark:text-white">
          {kpis.totalUnits} <span className="text-sm font-normal text-slate-500">items</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{kpis.multiItemOrdersCount} multi-item orders</span>
          <span aria-hidden="true" className="mx-1.5 opacity-60">·</span>
          <span>{(kpis.totalUnits / (kpis.totalOrders || 1)).toFixed(2)} items/order</span>
        </div>
      </div>

      {/* 3. Average Order Value (AOV) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Average Order Value</span>
          <Receipt className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums dark:text-white">
          {formatCurrency(kpis.avgOrderValue, currency)}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Item ASP {formatCurrency(kpis.avgItemPrice, currency)}</span>
          <span aria-hidden="true" className="mx-1.5 opacity-60">·</span>
          <span>98 historical baskets</span>
        </div>
      </div>

      {/* 4. Top Product */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Top Revenue Driver</span>
          <TrendingUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-2 truncate text-base font-bold tracking-tight text-slate-900 dark:text-white" title={kpis.topProduct.name}>
          {kpis.topProduct.name}
        </div>
        <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums dark:text-slate-400">
          <span>{formatCurrency(kpis.topProduct.revenue, currency)}</span>
          <span aria-hidden="true" className="mx-1.5 opacity-60 font-sans">·</span>
          <span>{kpis.topProduct.units} units sold</span>
        </div>
      </div>

      {/* 5. Top Payment Channel */}
      <div className="col-span-2 lg:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Primary Payment</span>
          <CreditCard className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-2 text-base font-bold tracking-tight text-slate-900 dark:text-white">
          {kpis.topPaymentMethod.name}
        </div>
        <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums dark:text-slate-400">
          <span>{formatCurrency(kpis.topPaymentMethod.revenue, currency)}</span>
          <span aria-hidden="true" className="mx-1.5 opacity-60 font-sans">·</span>
          <span>{formatPercent(kpis.topPaymentMethod.share)} volume</span>
        </div>
      </div>
    </div>
  );
};
