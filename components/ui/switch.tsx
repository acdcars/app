import { cn } from "@/lib/cn";
import * as React from "react";

type Props = { checked?: boolean; onCheckedChange?: (v: boolean) => void } & React.HTMLAttributes<HTMLButtonElement>;
export function Switch({ checked=false, onCheckedChange, className, ...props }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn("h-6 w-10 rounded-full transition p-0.5", checked ? "bg-orange-500" : "bg-neutral-600", className)}
      {...props}
    >
      <span className={cn("block h-5 w-5 bg-white rounded-full transition", checked ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}
