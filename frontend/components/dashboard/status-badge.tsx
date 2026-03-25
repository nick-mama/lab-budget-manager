import { cn } from "@/lib/utils";

type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "reimbursed"
  | "active"
  | "completed"
  | "closed";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  },
  approved: {
    label: "Approved",
    className: "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20",
  },
  rejected: {
    label: "Rejected",
    className: "bg-[#D32F2F]/10 text-[#D32F2F] border-[#D32F2F]/20",
  },
  reimbursed: {
    label: "Reimbursed",
    className: "bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20",
  },
  active: {
    label: "Active",
    className: "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20",
  },
  completed: {
    label: "Completed",
    className: "bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
