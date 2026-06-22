import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "financial" | "alert"
  hoverEffect?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function GlassCard(
  { className, variant = "default", hoverEffect = true, children, ...props }: GlassCardProps
) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-glass-border bg-glass-surface shadow-md backdrop-blur-glass transition-[background-color,border-color,box-shadow,transform] duration-300",
        
        hoverEffect && "hover:-translate-y-0.5 hover:border-[var(--accent)]/35 hover:shadow-lg hover:shadow-black/12",
        
        variant === "financial" && "border-t-2 border-t-[var(--accent)] shadow-md",
        variant === "alert" && "border-l-2 border-l-[var(--danger)] bg-[var(--danger)]/8",
        
        className
      )}
      {...props}
    >
      {/* Shine effect overlay (Elite Polish) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-glass-highlight to-transparent opacity-0 transition-opacity duration-500 pointer-events-none hover:opacity-100" />
      
      {children}
    </div>
  )
}
GlassCard.displayName = "GlassCard"

export { GlassCard }