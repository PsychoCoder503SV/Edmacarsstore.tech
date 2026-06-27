import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  statusStepIndex,
} from "@/lib/order-tracking";

type Props = {
  status: string;
  compact?: boolean;
};

export function OrderStatusBar({ status, compact = false }: Props) {
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
        Este pedido fue cancelado.
      </p>
    );
  }

  const currentStep = statusStepIndex(status);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className={`font-medium text-neon-cyan ${compact ? "text-xs" : "text-sm"}`}>
        {ORDER_STATUS_LABELS[status] ?? status}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {ORDER_STATUS_STEPS.map((step, i) => {
          const active = i === currentStep;
          const reached = i <= currentStep;

          return (
            <div key={step} className="min-w-0 text-center">
              <div className="relative flex items-center">
                <div
                  className={`h-2 w-full rounded-full transition-colors ${
                    reached ? "bg-neon-cyan" : "bg-white/10"
                  } ${active ? "ring-1 ring-neon-cyan/50" : ""}`}
                />
                {!compact && (
                  <span
                    className={`absolute -top-0.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 ${
                      reached
                        ? "border-neon-cyan bg-neon-cyan"
                        : "border-white/20 bg-surface"
                    } ${active ? "shadow-[0_0_8px_rgba(0,245,255,0.6)]" : ""}`}
                    aria-hidden
                  />
                )}
              </div>
              <p
                className={`mt-2 leading-tight ${
                  compact ? "text-[9px]" : "text-[10px]"
                } ${reached ? "text-neon-cyan" : "text-zinc-600"}`}
              >
                {ORDER_STATUS_LABELS[step]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}