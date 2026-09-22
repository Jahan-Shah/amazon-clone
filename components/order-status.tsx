const STATUS_LABELS: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  shipped: "Shipped",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
};

export function OrderStatus({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const styles = STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}
