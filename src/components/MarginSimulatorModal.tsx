import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Calculator } from 'lucide-react';
import { ProductMarginItem } from '../data/marginsData';
import {
  calculateSimulatedMargin,
  formatARS,
  formatPct,
} from '../utils/marginsLogic';

interface MarginSimulatorModalProps {
  product: ProductMarginItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MarginSimulatorModal: React.FC<MarginSimulatorModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [commissionBase, setCommissionBase] = useState<string>('100000');
  const [purchaseCost, setPurchaseCost] = useState<string>('65000');
  const [commissionPct, setCommissionPct] = useState<string>('12.5');
  const [sellerShipping, setSellerShipping] = useState<string>('16290');
  const [buyerFixedFee, setBuyerFixedFee] = useState<string>('0');

  useEffect(() => {
    if (product) {
      setCommissionBase(String(product.commissionBase));
      setPurchaseCost(product.purchaseCost !== null ? String(product.purchaseCost) : '22000');
      const inferredRate =
        product.commissionBase > 0
          ? ((product.mlCommission / product.commissionBase) * 100).toFixed(1)
          : '12.5';
      setCommissionPct(inferredRate);
      setSellerShipping(String(product.sellerShipping));
      setBuyerFixedFee(
        product.buyerPaysShippingFixedFee !== undefined
          ? String(product.buyerPaysShippingFixedFee)
          : '3320'
      );
    }
  }, [product]);

  if (!isOpen) return null;

  const baseNum = parseFloat(commissionBase) || 0;
  const costNum = parseFloat(purchaseCost) || 0;
  const rateNum = parseFloat(commissionPct) || 0;
  const shippingNum = parseFloat(sellerShipping) || 0;
  const fixedFeeNum = parseFloat(buyerFixedFee) || 0;

  const sim = calculateSimulatedMargin({
    commissionBase: baseNum,
    purchaseCost: costNum,
    commissionRatePct: rateNum,
    sellerShipping: shippingNum,
    buyerPaysFixedFee: fixedFeeNum > 0 ? fixedFeeNum : undefined,
  });

  const isProfitable = sim.finalProfitWithShipping >= 0;

  // Calculate break-even base price needed for $0 loss with seller shipping
  const effectiveKeepRatio = 1 - rateNum / 100;
  const breakEvenBasePrice =
    effectiveKeepRatio > 0 ? (costNum + shippingNum) / effectiveKeepRatio : 0;

  const handleReset = () => {
    if (product) {
      setCommissionBase(String(product.commissionBase));
      setPurchaseCost(product.purchaseCost !== null ? String(product.purchaseCost) : '22000');
      setCommissionPct('12.5');
      setSellerShipping(String(product.sellerShipping));
      setBuyerFixedFee(
        product.buyerPaysShippingFixedFee !== undefined
          ? String(product.buyerPaysShippingFixedFee)
          : '3320'
      );
    } else {
      setCommissionBase('100000');
      setPurchaseCost('65000');
      setCommissionPct('12.5');
      setSellerShipping('16290');
      setBuyerFixedFee('3320');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulator-modal-title"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Mobile grab handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Calculator className="w-5 h-5 text-slate-800 shrink-0" aria-hidden="true" />
            <div className="truncate">
              <h2
                id="simulator-modal-title"
                className="text-base font-bold text-slate-900 truncate"
              >
                Simulador de Rentabilidad ML
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {product ? product.name : 'Cálculo personalizado de comisión y envío'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar simulador"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {product && product.suggestedPrice !== product.commissionBase && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
              <span>Precio sugerido original:</span>
              <button
                type="button"
                onClick={() => setCommissionBase(String(product.suggestedPrice))}
                className="font-mono font-semibold underline hover:text-amber-950 cursor-pointer"
              >
                Usar {formatARS(product.suggestedPrice)} como base
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="sim-base"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Base de cálculo comisión ($)
              </label>
              <input
                id="sim-base"
                type="number"
                step="100"
                value={commissionBase}
                onChange={(e) => setCommissionBase(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="sim-cost"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Costo de compra ($)
              </label>
              <input
                id="sim-cost"
                type="number"
                step="100"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="sim-comm"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Comisión ML (%)
              </label>
              <input
                id="sim-comm"
                type="number"
                step="0.5"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="sim-shipping"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Envío a cargo vendedor ($)
              </label>
              <input
                id="sim-shipping"
                type="number"
                step="100"
                value={sellerShipping}
                onChange={(e) => setSellerShipping(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Live Results Panel */}
          <div
            className={`p-4 rounded-2xl border ${
              isProfitable
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold">
                Ganancia final con envío simulada
              </span>
              <span className="font-mono text-xs font-bold">
                {formatPct(sim.finalMarginWithShippingPct)}
              </span>
            </div>
            <div className="font-mono text-2xl font-bold mt-1">
              {formatARS(sim.finalProfitWithShipping)}
            </div>

            <div className="mt-3 pt-3 border-t border-black/10 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Comisión ML ({commissionPct}%):</span>
                <span className="font-mono">-{formatARS(sim.mlCommission)}</span>
              </div>
              <div className="flex justify-between">
                <span>Recibís antes de descontar envío:</span>
                <span className="font-mono">{formatARS(sim.receivedBeforeShipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>Recibís después de descontar envío:</span>
                <span className="font-mono">{formatARS(sim.receivedAfterShipping)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Ganancia sin descontar envío:</span>
                <span className="font-mono">
                  {formatARS(sim.profitWithoutShipping)} ({formatPct(sim.marginWithoutShippingPct)})
                </span>
              </div>
            </div>
          </div>

          {/* Break-even helper */}
          <div className="p-3.5 rounded-xl bg-slate-100 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">
                Precio base de equilibrio (Ganancia $0 con envío):
              </span>
              <button
                type="button"
                onClick={() => setCommissionBase(String(Math.ceil(breakEvenBasePrice)))}
                className="font-mono font-semibold text-slate-900 underline hover:text-slate-700 cursor-pointer"
              >
                {formatARS(breakEvenBasePrice)}
              </button>
            </div>
            {sim.buyerPaysShippingProfit !== undefined && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                <span>Si el comprador paga envío (cargo {formatARS(fixedFeeNum)}):</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {formatARS(sim.buyerPaysShippingProfit)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 rounded-xl hover:bg-slate-200/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Restaurar valores</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
