type Props = {
  className?: string;
  size?: "sm" | "md";
};

export function LoadingIndicator({ className = "", size = "md" }: Props) {
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";

  return (
    <div
      className={`flex justify-center py-6 ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Cargando"
    >
      <span
        className={`${dim} animate-spin rounded-full border-2 border-neon-cyan/25 border-t-neon-cyan`}
      />
    </div>
  );
}