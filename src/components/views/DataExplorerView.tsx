import React, { useState, useMemo } from 'react';
import { SaleRecord } from '../../types/sales';
import { CurrencyCode, formatCurrency } from '../../utils/formatters';
import { Search, ArrowUpDown, Trash2, Eye, FileSpreadsheet, Package } from 'lucide-react';

interface DataExplorerViewProps {
  records: SaleRecord[];
  currency: CurrencyCode;
  onDeleteRecord?: (id: string) => void;
}

type SortColumn = 'orderNumber' | 'date' | 'product' | 'price' | 'paymentMethod';

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  records,
  currency,
  onDeleteRecord,
}) => {
  const [viewMode, setViewMode] = useState<'items' | 'orders'>('items');
  const [sortCol, setSortCol] = useState<SortColumn>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [localSearch, setLocalSearch] = useState<string>('');

  // Handle column sorting
  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  // Grouped by order for 'orders' viewMode
  const ordersGrouped = useMemo(() => {
    const map = new Map<string, { orderNumber: string; date: string; paymentMethod: string; items: SaleRecord[]; totalPrice: number }>();
    records.forEach((r) => {
      const cur = map.get(r.orderNumber) || {
        orderNumber: r.orderNumber,
        date: r.date,
        paymentMethod: r.paymentMethod,
        items: [],
        totalPrice: 0,
      };
      cur.items.push(r);
      cur.totalPrice += r.price;
      map.set(r.orderNumber, cur);
    });
    return Array.from(map.values());
  }, [records]);

  // Filtered & sorted data based on viewMode
  const displayData = useMemo(() => {
    if (viewMode === 'items') {
      let filtered = records;
      if (localSearch) {
        const q = localSearch.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.orderNumber.toLowerCase().includes(q) ||
            r.product.toLowerCase().includes(q) ||
            r.paymentMethod.toLowerCase().includes(q) ||
            r.date.includes(q)
        );
      }

      return [...filtered].sort((a, b) => {
        let valA = a[sortCol];
        let valB = b[sortCol];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
    } else {
      let filtered = ordersGrouped;
      if (localSearch) {
        const q = localSearch.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.paymentMethod.toLowerCase().includes(q) ||
            o.date.includes(q) ||
            o.items.some((i) => i.product.toLowerCase().includes(q))
        );
      }

      return [...filtered].sort((a, b) => {
        if (sortCol === 'price') {
          return sortAsc ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice;
        }
        const valA = a[sortCol === 'product' ? 'orderNumber' : sortCol];
        const valB = b[sortCol === 'product' ? 'orderNumber' : sortCol];
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }
  }, [records, ordersGrouped, viewMode, sortCol, sortAsc, localSearch]);

  const totalPages = Math.ceil(displayData.length / pageSize) || 1;
  const paginatedData = displayData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-800 dark:bg-slate-800">
            <button
              onClick={() => {
                setViewMode('items');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 rounded px-3 py-1 font-medium transition-colors ${
                viewMode === 'items'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Line Items ({records.length})</span>
            </button>
            <button
              onClick={() => {
                setViewMode('orders');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 rounded px-3 py-1 font-medium transition-colors ${
                viewMode === 'orders'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Order Baskets ({ordersGrouped.length})</span>
            </button>
          </div>

          {/* Quick in-table search */}
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search table..."
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-7 rounded border border-slate-200 bg-slate-50 px-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Main High-Density Grid */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th
                  onClick={() => handleSort('orderNumber')}
                  className="py-3 pl-4 pr-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Order #</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('product')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>{viewMode === 'items' ? 'Product' : 'Items in Basket'}</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{viewMode === 'items' ? 'Price' : 'Total Basket'}</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('paymentMethod')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Payment Method</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 pr-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No records match search parameters.
                  </td>
                </tr>
              ) : viewMode === 'items' ? (
                (paginatedData as SaleRecord[]).map((row) => (
                  <tr
                    key={row.id}
                    className="h-10 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2.5 pl-4 pr-3 font-semibold text-slate-900 dark:text-white">
                      {row.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {row.date}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 font-medium dark:text-slate-200">
                      {row.product}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(row.price, currency)}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                      {row.paymentMethod}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      {onDeleteRecord && (
                        <button
                          onClick={() => onDeleteRecord(row.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                (paginatedData as typeof ordersGrouped).map((order) => (
                  <tr
                    key={order.orderNumber}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 pl-4 pr-3 font-semibold text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {order.date}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{it.product}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              ({formatCurrency(it.price, currency)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(order.totalPrice, currency)}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400">
                      {order.paymentMethod}
                    </td>
                    <td className="py-3 pr-4 text-right font-sans text-slate-400 text-[11px]">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, displayData.length)} of {displayData.length} entries
          </div>

          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
            >
              Prev
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
