type Props = {
  stock: number;
};

export function ProductStockBadge({ stock }: Props) {
  if (stock <= 0) {
    return (
      <div className="border-b border-red-500/50 bg-red-600 px-3 py-2">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-white">
          Agotado
        </p>
      </div>
    );
  }

  if (stock > 3) return null;

  return (
    <div className="border-b border-amber-300/60 bg-amber-400 px-3 py-2 shadow-[0_4px_14px_rgba(251,191,36,0.35)]">
      <p className="text-center text-[11px] font-extrabold uppercase tracking-widest text-zinc-900">
        Pocas unidades · quedan {stock}
      </p>
    </div>
  );
}