import { useState, useCallback } from "react";
import { toast } from "sonner";

interface ToastFn {
  (msg: string, sub?: string, type?: "info" | "ok" | "err" | "warn"): void;
}

export const useToastNotify = (): ToastFn => {
  return useCallback((msg: string, sub?: string, type?: string) => {
    const icons: Record<string, string> = { info: "ℹ️", ok: "✅", err: "🚨", warn: "⚠️" };
    const icon = icons[type || "info"] || "ℹ️";
    if (type === "err") {
      toast.error(`${icon} ${msg}`, { description: sub });
    } else if (type === "warn") {
      toast.warning(`${icon} ${msg}`, { description: sub });
    } else if (type === "ok") {
      toast.success(`${icon} ${msg}`, { description: sub });
    } else {
      toast.info(`${icon} ${msg}`, { description: sub });
    }
  }, []);
};
