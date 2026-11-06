import React, { useState } from 'react';
import { FilterState } from '../types/sales';
import { Search, RotateCcw, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { PRODUCT_CATALOG } from '../data/initialData';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  uniqueOrdersCount: number;
  availableProducts: string[];
  availablePaymentMethods: string[];
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  uniqueOrdersCount,
  availableProducts,
  availablePaymentMethods,
  onResetFilters,
}) => {
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.dateRange !== 'all' ||
    filters.products.length > 0 ||
    filters.paymentMethods.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 200;

  const handleToggleProduct = (product: string) => {
    const exists = filters.products.includes(product);
    const updated = exists
      ? filters.products.filter((p) => p !== product)
      : [...filters.products, product];
    onFilterChange({ ...filters, products: updated });
  };

  const handleTogglePayment = (method: string) => {
    const exists = filters.paymentMethods.includes(method);
    const updated = exists
      ? filters.paymentMethods.filter((m) => m !== method)
      : [...filters.paymentMethods, method];
    onFilterChange({ ...filters, paymentMethods: updated });
  };

  return (
    <div className="border-b border-slate-200 bg-white/70 backdrop-blur-xs px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Left side: Search & Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search product, order, date..."
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Date Range Segmented Controls */}
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-800 dark:bg-slate-800/80">
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'aug2025', label: 'Aug 2025' },
              { id: 'sep2025', label: 'Sep 2025' },
              { id: 'oct2025', label: 'Oct 2025' },
              { id: 'custom', label: 'Custom' },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => onFilterChange({ ...filters, dateRange: period.id as any })}
                className={`rounded px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
                  filters.dateRange === period.id
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers if 'custom' is active */}
          {filters.dateRange === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <input
                type="date"
                value={filters.startDate}
                min="2025-08-01"
                max="2025-10-31"
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <span>to</span>
              <input
                type="date"
                value={filters.endDate}
                min="2025-08-01"
                max="2025-10-31"
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Product Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProductDropdownOpen(!productDropdownOpen);
                setPaymentDropdownOpen(false);
              }}
              className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
                filters.products.length > 0
                  ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <span>Products {filters.products.length > 0 ? `(${filters.products.length})` : ''}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {productDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900 max-h-72 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1 px-1 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Filter by Product</span>
                  {filters.products.length > 0 && (
                    <button
                      onClick={() => onFilterChange({ ...filters, products: [] })}
                      className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {availableProducts.map((p) => {
                  const isChecked = filters.products.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => handleToggleProduct(p)}
                      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="truncate pr-2 text-slate-700 dark:text-slate-200">{p}</span>
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isChecked
                            ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
                            : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setPaymentDropdownOpen(!paymentDropdownOpen);
                setProductDropdownOpen(false);
              }}
              className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
                filters.paymentMethods.length > 0
                  ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <span>Payment {filters.paymentMethods.length > 0 ? `(${filters.paymentMethods.length})` : ''}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {paymentDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1 px-1 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Payment Methods</span>
                  {filters.paymentMethods.length > 0 && (
                    <button
                      onClick={() => onFilterChange({ ...filters, paymentMethods: [] })}
                      className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {availablePaymentMethods.map((m) => {
                  const isChecked = filters.paymentMethods.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => handleTogglePayment(m)}
                      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="text-slate-700 dark:text-slate-200">{m}</span>
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isChecked
                            ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
                            : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Count & Reset */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {filteredCount}
            </span>{' '}
            of <span className="tabular-nums">{totalCount}</span> items
            <span aria-hidden="true" className="mx-1.5 opacity-50">·</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {uniqueOrdersCount}
            </span>{' '}
            orders
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              title="Reset all active filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
