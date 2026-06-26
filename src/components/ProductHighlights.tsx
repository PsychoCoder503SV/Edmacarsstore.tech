type Props = {
  items: string[];
};

export function ProductHighlights({ items }: Props) {
  if (!items.length) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Características destacadas
      </h2>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
            <span className="mt-0.5 shrink-0 font-bold text-neon-cyan">*</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}