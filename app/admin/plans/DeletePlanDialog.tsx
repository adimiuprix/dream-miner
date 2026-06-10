"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeletePlanDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  planId:       string;
  planName:     string;
  onSuccess:    () => void;
}

export default function DeletePlanDialog({
  open, onOpenChange, planId, planName, onSuccess,
}: DeletePlanDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleDelete() {
    setIsPending(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/plans/${planId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to delete plan");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(d) => { setError(null); onOpenChange(d.open); }}>
      <DialogContent size="sm" showCloseButton bottomStickOnMobile={false}>
        <DialogHeader
          title="Delete Plan"
          description={`Are you sure you want to delete "${planName}"? This cannot be undone.`}
        />
        <DialogBody>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Plans with active contracts cannot be deleted. All existing contracts will remain unaffected.
          </p>
          {error && (
            <div style={{
              marginTop: 12,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#ef4444",
            }}>
              {error}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} isLoading={isPending}>
            Delete Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
