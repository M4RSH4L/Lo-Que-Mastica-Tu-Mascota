import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ProductMarginItem } from '../data/marginsData';
import { formatARS, formatPct, getProfitabilityStatus } from '../utils/marginsLogic';

interface ProductTableProps {
  products: ProductMarginItem[];
  onSimulate: (item: ProductMarginItem) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onSimulate,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
              <th className="py-3.5 px-3 font-mono">#</th>
              <th className="py-3.5 px-3">Producto</th>
              <th className="py-3.5 px-3 text-right">Precio Sug.</th>
              <th className="py-3.5 px-3 text-right">Base Com.</th>
              <th className="py-3.5 px-3 text-right">Costo Compra</th>
              <th className="py-3.5 px-3 text-right">Comisión ML</th>
              <th className="py-3.5 px-3 text-right">Envío Vend.</th>
              <th className="py-3.5 px-3 text-right">Recibís c/Envío</th>
              <th className="py-3.5 px-3 text-right">Ganancia s/Envío</th>
              <th className="py-3.5 px-3 text-right">Ganancia Final c/Envío</th>
              <th className="py-3.5 px-3 text-right">Escenario Comp.</th>
              <th className="py-3.5 px-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((item) => {
              const status = getProfitabilityStatus(item);
              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/90 transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {String(item.index).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900 min-w-[220px]">
                    <div>{item.name}</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      {item.brand} · {item.weightLabel}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {formatARS(item.suggestedPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-900 font-medium whitespace-nowrap">
                    {formatARS(item.commissionBase)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {formatARS(item.purchaseCost)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-700 whitespace-nowrap">
                    -{formatARS(item.mlCommission)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-700 whitespace-nowrap">
                    -{formatARS(item.sellerShipping)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                    {formatARS(item.receivedAfterShipping)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    <div>{formatARS(item.profitWithoutShipping)}</div>
                    {item.marginWithoutShippingPct !== null && (
                      <div className="text-[11px] text-slate-500">
                        {formatPct(item.marginWithoutShippingPct)}
                      </div>
                    )}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${
                      status === 'profitable'
                        ? 'text-emerald-700'
                        : status === 'loss'
                        ? 'text-rose-700'
                        : 'text-amber-700'
                    }`}
                  >
                    <div>{formatARS(item.finalProfitWithShipping)}</div>
                    {item.finalMarginWithShippingPct !== null && (
                      <div className="text-[11px]">
                        {formatPct(item.finalMarginWithShippingPct)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                    {item.buyerPaysShippingProfit !== undefined ? (
                      <div>
                        <div className="text-emerald-700 font-semibold">
                          +{formatARS(item.buyerPaysShippingProfit)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Cargo: {formatARS(item.buyerPaysShippingFixedFee)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSimulate(item)}
                      className="min-h-[38px] px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Simular</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
