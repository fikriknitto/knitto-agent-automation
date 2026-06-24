import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

const buttonVariants = {
  default:
    "border border-white/8 bg-slate-800/70 text-slate-100 hover:border-white/15 hover:bg-slate-700/80",
  primary:
    "border-0 bg-[#0f163F] text-white hover:bg-[#0f163F]/60",
  danger:
    "border border-red-500/30 bg-red-600/15 text-red-300 shadow-[0_4px_12px_rgba(220,38,38,0.1)] hover:border-red-500/40 hover:bg-red-600/25",
  ghost:
    " bg-slate-900 text-slate-200 hover:bg-slate-700/90",
} as const;

const buttonSizes = {
  default: "px-4 py-2 text-sm font-semibold",
  sm: "px-3.5 py-1.5 text-[0.82rem] font-medium",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

const buttonBase =
  "inline-flex cursor-pointer items-center justify-center rounded-lg transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "default",
  size = "default",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export type ButtonIconProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
};

export function ButtonIcon({
  variant = "ghost",
  size = "sm",
  active,
  className,
  type = "button",
  ...props
}: ButtonIconProps) {
  return (
    <button
      type={type}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        size === "sm" ? "min-w-[2.1rem] px-2 py-1.5 text-[0.82rem] font-medium" : buttonSizes[size],
        active && "border-blue-400/45 bg-blue-500/22 text-blue-200",
        className
      )}
      {...props}
    />
  );
}
