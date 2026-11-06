import React, { useState, useEffect, useMemo } from 'react';
import { SaleRecord, ViewTab, FilterState } from './types/sales';
import { INITIAL_SALES_DATA, PRODUCT_CATALOG } from './data/initialData';
import { filterRecords, computeKPIs } from './utils/analytics';
import { CurrencyCode } from './utils/formatters';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { OverviewView } from './components/views/OverviewView';
import { MultiChartMatrixView } from './components/views/MultiChartMatrixView';
import { ProductAnalyticsView } from './components/views/ProductAnalyticsView';
import { TemporalAnalyticsView } from './components/views/TemporalAnalyticsView';
import { ChartStudioView } from './components/views/ChartStudioView';
import { DataExplorerView } from './components/views/DataExplorerView';
import { AddSaleModal } from './components/AddSaleModal';
import { RefreshCw, Database } from 'lucide-react';

const STORAGE_KEY_RECORDS = 'veloce_sales_records_v1';
const STORAGE_KEY_THEME = 'veloce_theme_mode_v1';
const STORAGE_KEY_CURRENCY = 'veloce_currency_v1';

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  dateRange: 'all',
  startDate: '2025-08-15',
  endDate: '2025-10-07',
  products: [],
  paymentMethods: [],
  minPrice: 0,
  maxPrice: 200,
};

export default function App() {
  // 1. Dataset State
  const [records, setRecords] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_SALES_DATA;
  });

  // 2. Active View Tab
  const [currentTab, setCurrentTab] = useState<ViewTab>('overview');

  // 3. Currency State
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    return (localStorage.getItem(STORAGE_KEY_CURRENCY) as CurrencyCode) || 'USD';
  });

  // 4. Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return false;
  });

  // 5. Filter State
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // 6. Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync dark class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDarkMode]);

  // Sync currency preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
  }, [currency]);

  // Save records to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      // storage quota or error
    }
  }, [records]);

  // Derived filtered records & KPIs
  const filteredRecords = useMemo(() => {
    return filterRecords(records, filters);
  }, [records, filters]);

  const kpis = useMemo(() => {
    return computeKPIs(filteredRecords);
  }, [filteredRecords]);

  const uniqueOrdersCount = useMemo(() => {
    return new Set(filteredRecords.map((r) => r.orderNumber)).size;
  }, [filteredRecords]);

  // Available unique values for filters
  const availableProducts = useMemo(() => {
    const set = new Set(records.map((r) => r.product));
    return Array.from(set).sort();
  }, [records]);

  const availablePaymentMethods = useMemo(() => {
    const set = new Set(records.map((r) => r.paymentMethod));
    return Array.from(set).sort();
  }, [records]);

  // Handlers
  const handleAddSale = (newSale: SaleRecord) => {
    setRecords((prev) => [newSale, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset transactions dataset to original source (116 records)?')) {
      setRecords(INITIAL_SALES_DATA);
      setFilters(INITIAL_FILTERS);
      try {
        localStorage.removeItem(STORAGE_KEY_RECORDS);
      } catch (e) {
        // ignore
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Product', 'Price', 'Date', 'Payment Method'];
    const rows = filteredRecords.map((r) => [
      `"${r.orderNumber}"`,
      `"${r.product}"`,
      `"$${r.price.toFixed(2)}"`,
      `"${r.date}"`,
      `"${r.paymentMethod}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectProductFilter = (prod: string) => {
    setFilters((prev) => ({
      ...prev,
      products: prev.products.includes(prod) ? prev.products : [prod],
    }));
  };

  const handleSelectPaymentFilter = (pm: string) => {
    setFilters((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(pm) ? prev.paymentMethods : [pm],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* 1. Header (3-zone Top Bar Contract) */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currency={currency}
        onCurrencyChange={setCurrency}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* 2. Interactive Global Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        totalCount={records.length}
        filteredCount={filteredRecords.length}
        uniqueOrdersCount={uniqueOrdersCount}
        availableProducts={availableProducts}
        availablePaymentMethods={availablePaymentMethods}
        onResetFilters={() => setFilters(INITIAL_FILTERS)}
      />

      {/* 3. Main Content Viewport */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* KPI Metric Summary Strip */}
        <KpiCards kpis={kpis} currency={currency} />

        {/* Dynamic View Tab Rendering */}
        {currentTab === 'overview' && (
          <OverviewView
            records={filteredRecords}
            currency={currency}
            onSelectProduct={handleSelectProductFilter}
            onSelectPayment={handleSelectPaymentFilter}
          />
        )}

        {currentTab === 'charts' && (
          <MultiChartMatrixView records={filteredRecords} currency={currency} />
        )}

        {currentTab === 'products' && (
          <ProductAnalyticsView records={filteredRecords} currency={currency} />
        )}

        {currentTab === 'temporal' && (
          <TemporalAnalyticsView
            records={filteredRecords}
            currency={currency}
            onFilterDate={(d) => setFilters((prev) => ({ ...prev, dateRange: 'custom', startDate: d, endDate: d }))}
          />
        )}

        {currentTab === 'builder' && (
          <ChartStudioView records={filteredRecords} currency={currency} />
        )}

        {currentTab === 'table' && (
          <DataExplorerView
            records={filteredRecords}
            currency={currency}
            onDeleteRecord={handleDeleteRecord}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            <span>Dataset: Sales_data_Sheet1 · 116 records · 98 baskets</span>
            <span aria-hidden="true">·</span>
            <span>Period: 2025-08-15 to 2025-10-07</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Reset dataset to original 116 items"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset Data</span>
            </button>
            <span className="font-mono tabular-nums">Veloce v1.0</span>
          </div>
        </div>
      </footer>

      {/* 5. Add Sale Modal */}
      <AddSaleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSale={handleAddSale}
        currency={currency}
        latestOrderNumber={records[0]?.orderNumber || 'TT-1098'}
      />
    </div>
  );
}
