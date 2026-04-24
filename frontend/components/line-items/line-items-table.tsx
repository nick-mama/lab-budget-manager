"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useApi } from "@/lib/api-client";

type LineItem = {
  id: number;
  item_code: string;
  description: string;
  project_name: string;
  project_manager_id: number;
  requestor_name: string;
  type: "expense" | "revenue";
  amount: number;
  request_date: string;
  status: "pending" | "approved" | "rejected" | "reimbursed";
};

type Props = {
  filters?: {
    search: string;
    status: string;
    type: string;
    project_id: string;
  };
  refreshKey?: number;
  onRefresh?: () => void;
};

export function LineItemsTable({ filters, refreshKey, onRefresh }: Props) {
  const { user: currentUser } = useCurrentUser();
  const { apiFetch } = useApi();

  const [items, setItems] = React.useState<LineItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [rejectItem, setRejectItem] = React.useState<LineItem | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [rejecting, setRejecting] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all-status") {
      params.set("status", filters.status);
    }
    if (filters?.type && filters.type !== "all-type") {
      params.set("type", filters.type);
    }
    if (filters?.project_id && filters.project_id !== "all-projects") {
      params.set("project_id", filters.project_id);
    }

    apiFetch(`/api/line-items?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [
    currentUser,
    filters?.status,
    filters?.type,
    filters?.project_id,
    refreshKey,
  ]);

  const filtered = React.useMemo(() => {
    const q = filters?.search?.toLowerCase() ?? "";
    if (!q) return items;

    return items.filter(
      (item) =>
        item.description.toLowerCase().includes(q) ||
        item.project_name?.toLowerCase().includes(q) ||
        item.requestor_name?.toLowerCase().includes(q) ||
        item.item_code?.toLowerCase().includes(q),
    );
  }, [items, filters?.search]);

  function canManageProjectItem(item: LineItem) {
    if (!currentUser) return false;

    if (currentUser.role === "Financial Admin") return true;

    if (
      currentUser.role === "Lab Manager" &&
      Number(item.project_manager_id) === Number(currentUser.id)
    ) {
      return true;
    }

    return false;
  }

  async function updateStatus(
    item: LineItem,
    status: "approved" | "rejected" | "reimbursed",
    extra: Record<string, string> = {},
  ) {
    try {
      const res = await apiFetch(`/api/line-items/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, ...extra }),
      });

      if (res.ok) {
        onRefresh?.();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Action failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Action failed.");
    }
  }

  async function handleDelete(item: LineItem) {
    const confirmed = window.confirm("Delete this line item?");
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/api/line-items/${item.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        onRefresh?.();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Delete failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Delete failed.");
    }
  }

  async function handleReject() {
    if (!rejectItem || !rejectionReason.trim()) return;

    setRejecting(true);
    await updateStatus(rejectItem, "rejected", {
      rejection_reason: rejectionReason,
    });
    setRejecting(false);
    setRejectItem(null);
    setRejectionReason("");
  }

  function getActions(item: LineItem) {
    const actions: React.ReactNode[] = [];

    if (currentUser?.role === "Lab Manager" && canManageProjectItem(item)) {
      if (item.status === "pending") {
        actions.push(
          <DropdownMenuItem
            key="approve"
            onClick={() => updateStatus(item, "approved")}
          >
            Approve
          </DropdownMenuItem>,
        );

        actions.push(
          <DropdownMenuItem
            key="reject"
            className="text-red-500"
            onClick={() => {
              setRejectItem(item);
              setRejectionReason("");
            }}
          >
            Reject
          </DropdownMenuItem>,
        );
      }

      actions.push(
        <DropdownMenuItem
          key="delete"
          className="text-red-600 focus:text-red-600"
          onClick={() => handleDelete(item)}
        >
          Delete
        </DropdownMenuItem>,
      );
    }

    if (currentUser?.role === "Financial Admin") {
      if (item.status === "approved") {
        actions.push(
          <DropdownMenuItem
            key="reimburse"
            onClick={() => updateStatus(item, "reimbursed")}
          >
            Mark as Reimbursed
          </DropdownMenuItem>,
        );
      }

      if (actions.length > 0) {
        actions.push(<DropdownMenuSeparator key="sep-admin" />);
      }

      actions.push(
        <DropdownMenuItem
          key="delete-admin"
          className="text-red-600 focus:text-red-600"
          onClick={() => handleDelete(item)}
        >
          Delete
        </DropdownMenuItem>,
      );
    }

    if (actions.length === 0) {
      actions.push(
        <DropdownMenuItem key="none" disabled>
          No actions available
        </DropdownMenuItem>,
      );
    }

    return actions;
  }

  return (
    <>
      <Card className="bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">
                  Description
                </TableHead>
                <TableHead className="text-muted-foreground">Project</TableHead>
                <TableHead className="text-muted-foreground">
                  Requestor
                </TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No line items found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="font-medium text-accent">
                      {item.item_code}
                    </TableCell>

                    <TableCell className="max-w-[200px] truncate font-medium text-foreground">
                      {item.description}
                    </TableCell>

                    <TableCell className="text-foreground">
                      {item.project_name}
                    </TableCell>

                    <TableCell className="text-foreground">
                      {item.requestor_name}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.type === "expense" ? (
                          <ArrowUpRight className="h-4 w-4 text-[#D32F2F]" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-[#2E7D32]" />
                        )}
                        <span className="capitalize text-foreground">
                          {item.type}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell
                      className={`font-medium ${
                        item.type === "expense"
                          ? "text-[#D32F2F]"
                          : "text-[#2E7D32]"
                      }`}
                    >
                      {item.type === "expense" ? "-" : "+"}$
                      {Number(item.amount).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {item.request_date?.slice(0, 10)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {getActions(item)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!rejectItem}
        onOpenChange={(open) => {
          if (!open) setRejectItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Line Item</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-2">
            <Label>Reason for rejection</Label>
            <Input
              placeholder="Enter reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting || !rejectionReason.trim()}
            >
              {rejecting ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
