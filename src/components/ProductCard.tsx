import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { ProductMarginItem } from '../data/marginsData';
import { formatARS, formatPct, getProfitabilityStatus } from '../utils/marginsLogic';

interface ProductCardProps {
  item: ProductMarginItem;
  onSimulate: (item: ProductMarginItem) => void;
  onUpdateMissingCost?: (itemId: string, newCost: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onSimulate,
  onUpdateMissingCost,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [costInput, setCostInput] = useState('');
  const [costError, setCostError] = useState('');

  const status = getProfitabilityStatus(item);

  const handleCostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = costInput.replace(/\./g, '').replace(',', '.').trim();
    const parsed = parseFloat(cleaned);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setCostError('Ingresá un costo mayor a $0');
      return;
    }
    setCostError('');
    if (onUpdateMissingCost) {
      onUpdateMissingCost(item.id, parsed);
    }
  };

  return (
    <article
      className="bg-white rounded-2xl border border-slate-200 transition-colors hover:border-slate-300 flex flex-col justify-between"
      data-testid={`product-card-${item.index}`}
    >
      <div className="p-4 sm:p-5">
        {/* Top Metadata Line (Zero-Pill Discipline: quiet inline text with · separators) */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-mono text-slate-400">#{String(item.index).padStart(2, '0')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-700">{item.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{item.weightLabel}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 font-medium">
            {status === 'profitable' && (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Rentable</span>
              </span>
            )}
            {status === 'loss' && (
              <span className="inline-flex items-center gap-1 text-rose-700">
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pérdida con envío</span>
              </span>
            )}
            {status === 'pending' && (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Costo pendiente</span>
              </span>
            )}
          </div>
        </div>

        {/* Product Title */}
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug mb-4">
          {item.name}
        </h2>

        {/* Primary Financial Hero Metric: Ganancia Final con Envío */}
        <div
          className={`p-3.5 rounded-xl mb-4 ${
            status === 'profitable'
              ? 'bg-emerald-50/70 text-emerald-950'
              : status === 'loss'
              ? 'bg-rose-50/70 text-rose-950'
              : 'bg-amber-50/80 text-amber-950'
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium opacity-80">
              Ganancia final con envío
            </span>
            {item.finalMarginWithShippingPct !== null && (
              <span
                className={`font-mono text-xs font-semibold ${
                  status === 'profitable'
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                {item.finalMarginWithShippingPct > 0 ? '+' : ''}
                {formatPct(item.finalMarginWithShippingPct)} sobre base
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span
              className={`font-mono text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap ${
                status === 'profitable'
                  ? 'text-emerald-700'
                  : status === 'loss'
                  ? 'text-rose-700'
                  : 'text-amber-800'
              }`}
            >
              {formatARS(item.finalProfitWithShipping)}
            </span>
            <span className="text-[11px] opacity-80 font-mono whitespace-nowrap">
              Sin envío: {formatARS(item.profitWithoutShipping)}{' '}
              {item.marginWithoutShippingPct !== null
                ? `(${formatPct(item.marginWithoutShippingPct)})`
                : ''}
            </span>
          </div>

          {item.pendingNote && (
            <p className="mt-2 text-xs text-amber-800 font-medium">
              Pendiente: {item.pendingNote}
            </p>
          )}
        </div>

        {/* If item has missing purchase cost, allow quick inline entry or simulator */}
        {item.purchaseCost === null && onUpdateMissingCost && (
          <form onSubmit={handleCostSubmit} className="mb-4">
            <label
              htmlFor={`cost-input-${item.id}`}
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Cargar costo de compra para calcular ganancia:
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`cost-input-${item.id}`}
                type="text"
                inputMode="decimal"
                placeholder="Ej: 21500"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                className="flex-1 min-h-[44px] px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Calcular
              </button>
            </div>
            {costError && (
              <p className="mt-1 text-xs text-rose-600">{costError}</p>
            )}
          </form>
        )}

        {/* Core 4-Metric Summary Grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs pt-1 border-t border-slate-100">
          <div>
            <dt className="text-slate-500">Precio sugerido</dt>
            <dd className="font-mono font-semibold text-slate-900 text-sm mt-0.5">
              {formatARS(item.suggestedPrice)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Base de comisión</dt>
            <dd className="font-mono font-semibold text-slate-900 text-sm mt-0.5">
              {formatARS(item.commissionBase)}
              {item.commissionBase !== item.suggestedPrice && (
                <span className="ml-1 text-[11px] font-sans font-normal text-amber-700">
                  (dif.)
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Costo de compra</dt>
            <dd className="font-mono font-medium text-slate-800 mt-0.5">
              {formatARS(item.purchaseCost)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Envío vendedor</dt>
            <dd className="font-mono font-medium text-slate-800 mt-0.5">
              {formatARS(item.sellerShipping)}
            </dd>
          </div>
        </dl>

        {/* Buyer Pays Shipping Scenario Callout (if present in markdown) */}
        {item.buyerPaysShippingProfit !== undefined && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Truck className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
              <span>Si el comprador paga envío (cargo {formatARS(item.buyerPaysShippingFixedFee)}):</span>
            </div>
            <span className="font-mono font-semibold text-emerald-700 shrink-0">
              +{formatARS(item.buyerPaysShippingProfit)}
            </span>
          </div>
        )}

        {/* Expandable Complete Breakdown */}
        {expanded && (
          <div className="mt-4 pt-3.5 border-t border-slate-200 space-y-2 text-xs">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              Desglose completo de la publicación
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Precio sugerido:</span>
              <span className="font-mono text-slate-900">{formatARS(item.suggestedPrice)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Base usada para calcular comisión:</span>
              <span className="font-mono text-slate-900">{formatARS(item.commissionBase)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Costo de compra:</span>
              <span className="font-mono text-slate-900">{formatARS(item.purchaseCost)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Comisión de Mercado Libre (12,5%):</span>
              <span className="font-mono text-rose-700">-{formatARS(item.mlCommission)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Envío a cargo del vendedor:</span>
              <span className="font-mono text-rose-700">-{formatARS(item.sellerShipping)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Recibís antes de descontar envío:</span>
              <span className="font-mono font-medium text-slate-900">
                {formatARS(item.receivedBeforeShipping)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Recibís después de descontar envío:</span>
              <span className="font-mono font-medium text-slate-900">
                {formatARS(item.receivedAfterShipping)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Ganancia sin descontar envío:</span>
              <span className="font-mono font-medium text-slate-900">
                {formatARS(item.profitWithoutShipping)}{' '}
                {item.marginWithoutShippingPct !== null
                  ? `(${formatPct(item.marginWithoutShippingPct)})`
                  : ''}
              </span>
            </div>
            <div className="flex justify-between py-1 font-semibold">
              <span className="text-slate-900">Ganancia final con envío:</span>
              <span
                className={`font-mono ${
                  status === 'profitable'
                    ? 'text-emerald-700'
                    : status === 'loss'
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}
              >
                {formatARS(item.finalProfitWithShipping)}{' '}
                {item.finalMarginWithShippingPct !== null
                  ? `(${formatPct(item.finalMarginWithShippingPct)})`
                  : ''}
              </span>
            </div>
            {item.buyerPaysShippingFixedFee !== undefined && (
              <>
                <div className="flex justify-between py-1 border-t border-slate-100 text-sky-900">
                  <span>Cargo fijo si el comprador paga el envío:</span>
                  <span className="font-mono">{formatARS(item.buyerPaysShippingFixedFee)}</span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-emerald-700">
                  <span>Ganancia en ese escenario:</span>
                  <span className="font-mono">{formatARS(item.buyerPaysShippingProfit)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Touch Actions (44px min touch hitbox for mobile ergonomics) */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="min-h-[44px] px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 rounded-xl hover:bg-slate-200/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
              <span>Ocultar desglose</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
              <span>Ver los 9 ítems</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSimulate(item)}
          aria-label={`Simular margen de ${item.name}`}
          className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200/90 hover:bg-slate-100 rounded-xl inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Simular</span>
        </button>
      </div>
    </article>
  );
};
