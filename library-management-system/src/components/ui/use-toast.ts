// Inspired by react-hot-toast library
import { useCallback, useState } from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

export type ToastType = "success" | "error" | "info" | "warning";

export type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  type?: ToastType;
}

export interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number; // milliseconds
  action?: ToastActionElement;
}

let count = 0;

function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ToastState = {
  toasts: ToasterToast[];
}

export const useToast = () => {
  const [state, setState] = useState<ToastState>({
    toasts: [],
  });

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = generateId();
      const newToast: ToasterToast = {
        id,
        title: opts.title,
        description: opts.description,
        type: opts.type || "info",
        action: opts.action,
      };

      setState((state) => {
        const newToasts = [...state.toasts];
        if (newToasts.length >= TOAST_LIMIT) {
          newToasts.shift();
        }
        return {
          ...state,
          toasts: [...newToasts, newToast],
        };
      });

      return id;
    },
    []
  );

  const dismiss = useCallback((toastId?: string) => {
    setState((state) => {
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        };
      }
      return {
        ...state,
        toasts: [],
      };
    });
  }, []);

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
}
