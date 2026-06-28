import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass-card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-amber px-4 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-clay hover:shadow-[0_4px_16px_rgba(79,110,247,0.35)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function SecondaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-line bg-white/60 px-4 text-sm font-semibold text-amber shadow-sm backdrop-blur transition duration-150 hover:-translate-y-0.5 hover:border-amber hover:bg-white hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[12px] border border-line bg-white/70 px-3 text-sm text-ink shadow-sm outline-none backdrop-blur transition placeholder:text-muted/70 focus:border-amber focus:ring-4 focus:ring-amber/15",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[12px] border border-line bg-white/70 px-3 text-sm text-ink shadow-sm outline-none backdrop-blur transition focus:border-amber focus:ring-4 focus:ring-amber/15",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("text-sm font-medium text-muted", className)}>
      {children}
    </label>
  );
}
