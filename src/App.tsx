import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Calculator,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import {
  BrandName,
  CRITERIA_INFO,
  ProductMarginItem,
  RAW_PRODUCTS,
} from './data/marginsData';
import {
  calculateSimulatedMargin,
  computeSummaryStats,
  filterAndSortProducts,
  formatARS,
  formatPct,
  SortOption,
  StatusFilter,
} from './utils/marginsLogic';
import { ProductCard } from './components/ProductCard';
import { ProductTable } from './components/ProductTable';
import { MarginSimulatorModal } from './components/MarginSimulatorModal';

const BRANDS: Array<BrandName | 'Todas'> = [
  'Todas',
  'Royal Canin',
  'Purina Excellent',
  'Fawna',
  'Eukanuba',
  'Old Prince',
  'Origen',
  'Baires',
];

export default function App() {
  const [products, setProducts] = useState<ProductMarginItem[]>(RAW_PRODUCTS);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<BrandName | 'Todas'>('Todas');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [simulatorProduct, setSimulatorProduct] = useState<ProductMarginItem | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const summaryStats = useMemo(() => computeSummaryStats(products), [products]);

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(products, {
        search,
        brand: selectedBrand,
        status: statusFilter,
        sortBy,
      }),
    [products, search, selectedBrand, statusFilter, sortBy]
  );

  const handleOpenSimulator = (item: ProductMarginItem | null) => {
    setSimulatorProduct(item);
    setIsSimulatorOpen(true);
  };

  const handleUpdateMissingCost = (itemId: string, newCost: number) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const calc = calculateSimulatedMargin({
          commissionBase: item.commissionBase,
          purchaseCost: newCost,
          mlCommissionOverride: item.mlCommission,
          sellerShipping: item.sellerShipping,
        });
        return {
          ...item,
          purchaseCost: newCost,
          profitWithoutShipping: calc.profitWithoutShipping,
          marginWithoutShippingPct: calc.marginWithoutShippingPct,
          finalProfitWithShipping: calc.finalProfitWithShipping,
          finalMarginWithShippingPct: calc.finalMarginWithShippingPct,
          pendingNote: undefined,
        };
      })
    );
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedBrand('Todas');
    setStatusFilter('all');
    setSortBy('default');
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedBrand !== 'Todas' ||
    statusFilter !== 'all' ||
    sortBy !== 'default';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#resumen"
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Márgenes ML
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Secciones principales"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#resumen"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Resumen
          </a>
          <a
            href="#criterio"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Criterio
          </a>
          <a
            href="#catalogo"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Catálogo (51)
          </a>
          <a
            href="#envio-comprador"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter('buyer_shipping');
              document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Envío Comprador (9)
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleOpenSimulator(products[0])}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Simulador ML</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        {/* Hero & Criteria Section */}
        <section id="resumen" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Alimentos Balanceados · Análisis de Publicaciones
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5 text-balance">
                {CRITERIA_INFO.title}
              </h1>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Total relevado: {summaryStats.totalCount} publicaciones
            </div>
          </div>

          {/* Criteria Explanation Banner (No thick left border, subtle hairline border) */}
          <div
            id="criterio"
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-1.5"
          >
            <div className="text-xs font-semibold text-slate-900">
              Criterio de cálculo de rentabilidad
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-mono bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              {CRITERIA_INFO.formula}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
              {CRITERIA_INFO.explanation}
            </p>
          </div>

          {/* 4-Column KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`text-left p-4 rounded-2xl border transition-colors flex flex-col justify-between cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                Total Productos
              </div>
              <div className="font-mono text-2xl font-bold mt-1.5">
                {summaryStats.totalCount}
              </div>
              <div
                className={`text-[11px] mt-1 font-mono truncate whitespace-nowrap ${
                  statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                Sin envío prom: +{formatPct(summaryStats.averageMarginWithoutShippingPct)}
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'profitable' ? 'all' : 'profitable')
              }
              className={`text-left p-4 rounded-2xl border transition-colors flex flex-col justify-between cursor-pointer ${
                statusFilter === 'profitable'
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  statusFilter === 'profitable' ? 'text-emerald-200' : 'text-slate-500'
                }`}
              >
                Rentables con Envío
              </div>
              <div
                className={`font-mono text-2xl font-bold mt-1.5 ${
                  statusFilter === 'profitable' ? 'text-white' : 'text-emerald-700'
                }`}
              >
                {summaryStats.profitableCount}
              </div>
              <div
                className={`text-[11px] mt-1 font-mono truncate whitespace-nowrap ${
                  statusFilter === 'profitable' ? 'text-emerald-200' : 'text-slate-500'
                }`}
              >
                Máx: {formatARS(summaryStats.bestProduct?.finalProfitWithShipping)} (
                {formatPct(summaryStats.bestProduct?.finalMarginWithShippingPct)})
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'loss' ? 'all' : 'loss')}
              className={`text-left p-4 rounded-2xl border transition-colors flex flex-col justify-between cursor-pointer ${
                statusFilter === 'loss'
                  ? 'bg-rose-900 text-white border-rose-900'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300'
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  statusFilter === 'loss' ? 'text-rose-200' : 'text-slate-500'
                }`}
              >
                En Pérdida con Envío
              </div>
              <div
                className={`font-mono text-2xl font-bold mt-1.5 ${
                  statusFilter === 'loss' ? 'text-white' : 'text-rose-700'
                }`}
              >
                {summaryStats.lossCount}
              </div>
              <div
                className={`text-[11px] mt-1 font-mono truncate whitespace-nowrap ${
                  statusFilter === 'loss' ? 'text-rose-200' : 'text-slate-500'
                }`}
              >
                Mín: {formatARS(summaryStats.worstProduct?.finalProfitWithShipping)} (
                {formatPct(summaryStats.worstProduct?.finalMarginWithShippingPct)})
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'buyer_shipping' ? 'all' : 'buyer_shipping'
                )
              }
              className={`text-left p-4 rounded-2xl border transition-colors flex flex-col justify-between cursor-pointer ${
                statusFilter === 'buyer_shipping'
                  ? 'bg-sky-900 text-white border-sky-900'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-sky-300'
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  statusFilter === 'buyer_shipping' ? 'text-sky-200' : 'text-slate-500'
                }`}
              >
                Envío Comprador
              </div>
              <div
                className={`font-mono text-2xl font-bold mt-1.5 ${
                  statusFilter === 'buyer_shipping' ? 'text-white' : 'text-sky-800'
                }`}
              >
                {summaryStats.buyerShippingScenarioCount}
              </div>
              <div
                className={`text-[11px] mt-1 truncate whitespace-nowrap ${
                  statusFilter === 'buyer_shipping' ? 'text-sky-200' : 'text-slate-500'
                }`}
              >
                Pasan a ganancia positiva
              </div>
            </button>
          </div>
        </section>

        {/* Mobile-First Filter & Search Workspace Toolbar */}
        <section id="catalogo" className="space-y-3.5 pt-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3.5">
            {/* Search + Sort + View Mode Row */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1">
                <label htmlFor="product-search" className="sr-only">
                  Buscar producto por nombre, marca o peso
                </label>
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="product-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ej: Royal Canin, Urinary, 15 kg, Cordero..."
                  className="w-full min-h-[44px] pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Limpiar búsqueda"
                    className="min-h-[44px] min-w-[44px] absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <label htmlFor="sort-select" className="sr-only">
                    Ordenar productos
                  </label>
                  <ArrowUpDown
                    className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full sm:w-auto min-h-[44px] pl-8 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="default">Orden original (#01 - #51)</option>
                    <option value="profit_desc">Mayor ganancia con envío ($)</option>
                    <option value="profit_asc">Mayor pérdida con envío ($)</option>
                    <option value="margin_desc">Mayor margen con envío (%)</option>
                    <option value="margin_asc">Menor margen con envío (%)</option>
                    <option value="price_desc">Mayor precio sugerido ($)</option>
                    <option value="price_asc">Menor precio sugerido ($)</option>
                  </select>
                </div>

                {/* Cards / Table View Toggle */}
                <div
                  className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0"
                  role="group"
                  aria-label="Modo de visualización"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    aria-label="Vista de tarjetas"
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Tarjetas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    aria-label="Vista de tabla"
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Tabla</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Brand Filter Bar (Mobile Touch Friendly) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Filtrar por marca:</span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Limpiar filtros</span>
                  </button>
                )}
              </div>

              <div
                className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
                role="group"
                aria-label="Filtrar por marca"
              >
                {BRANDS.map((brand) => {
                  const active = selectedBrand === brand;
                  const count =
                    brand === 'Todas'
                      ? products.length
                      : products.filter((p) => p.brand === brand).length;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      {brand} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Segmented Status Filter Controls */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100"
              role="group"
              aria-label="Filtrar por estado de rentabilidad"
            >
              {(
                [
                  { id: 'all', label: `Todos (${summaryStats.totalCount})` },
                  {
                    id: 'profitable',
                    label: `Rentables c/envío (${summaryStats.profitableCount})`,
                  },
                  {
                    id: 'loss',
                    label: `En pérdida c/envío (${summaryStats.lossCount})`,
                  },
                  {
                    id: 'buyer_shipping',
                    label: `Envío comprador (${summaryStats.buyerShippingScenarioCount})`,
                  },
                  {
                    id: 'pending',
                    label: `Sin costo (${summaryStats.pendingCount})`,
                  },
                ] as Array<{ id: StatusFilter; label: string }>
              ).map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Count Header */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-600">
            <span>
              Mostrando <strong className="font-mono text-slate-900">{filteredProducts.length}</strong> de{' '}
              <strong className="font-mono text-slate-900">{products.length}</strong> productos
            </span>
            {selectedBrand !== 'Todas' && (
              <span>
                Marca: <strong className="text-slate-900">{selectedBrand}</strong>
              </span>
            )}
          </div>

          {/* Product Feed: Responsive Grid or Table */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <p className="text-base font-semibold text-slate-900">
                No se encontraron productos con esos filtros
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Probá buscando por otra palabra clave o restablecé los filtros de marca y rentabilidad.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ver todos los productos</span>
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onSimulate={handleOpenSimulator}
                  onUpdateMissingCost={handleUpdateMissingCost}
                />
              ))}
            </div>
          ) : (
            <ProductTable
              products={filteredProducts}
              onSimulate={handleOpenSimulator}
            />
          )}
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Márgenes de productos – Mercado Libre (51 publicaciones relevadas)</span>
          <span>
            Fórmula: Base de cálculo − Comisión ML − Envío vendedor − Costo de compra
          </span>
        </div>
      </footer>

      {/* Interactive Simulator Modal */}
      <MarginSimulatorModal
        product={simulatorProduct}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
