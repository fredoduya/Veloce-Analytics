import React, { useState } from 'react';
import { SaleRecord } from '../types/sales';
import { PRODUCT_CATALOG } from '../data/initialData';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { X, Plus, AlertCircle } from 'lucide-react';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSale: (sale: SaleRecord) => void;
  currency: CurrencyCode;
  latestOrderNumber: string;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({
  isOpen,
  onClose,
  onAddSale,
  currency,
  latestOrderNumber,
}) => {
  // Suggest next order number e.g. TT-1099
  const nextOrderNumber = React.useMemo(() => {
    const match = latestOrderNumber.match(/TT-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      return `TT-${num}`;
    }
    return 'TT-1099';
  }, [latestOrderNumber]);

  const [orderNumber, setOrderNumber] = useState(nextOrderNumber);
  const [product, setProduct] = useState(Object.keys(PRODUCT_CATALOG)[0]);
  const [price, setPrice] = useState(PRODUCT_CATALOG[Object.keys(PRODUCT_CATALOG)[0]].price);
  const [date, setDate] = useState('2025-10-08');
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'eWallet' | 'Cash'>('Credit Card');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProductChange = (selectedProd: string) => {
    setProduct(selectedProd);
    if (PRODUCT_CATALOG[selectedProd]) {
      setPrice(PRODUCT_CATALOG[selectedProd].price);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please provide an order number.');
      return;
    }
    if (price <= 0) {
      setError('Price must be greater than $0.00');
      return;
    }
    if (!date) {
      setError('Please pick a date.');
      return;
    }

    const newRecord: SaleRecord = {
      id: `manual-${Date.now()}-${orderNumber}`,
      orderNumber: orderNumber.trim(),
      product,
      price,
      date,
      paymentMethod,
    };

    onAddSale(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Record New Transaction
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immediately updates all metric charts and ledger records
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Order Number */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Order Number
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. TT-1099"
              required
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Product Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Product SKU
            </label>
            <select
              value={product}
              onChange={(e) => handleProductChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {Object.keys(PRODUCT_CATALOG).map((p) => (
                <option key={p} value={p}>
                  {p} ({formatCurrency(PRODUCT_CATALOG[p].price, currency)})
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Transaction Unit Price ($ USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="eWallet">eWallet</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
