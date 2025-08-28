import * as React from "react"
import { cn } from "../../lib/utils"

type DivProps = React.HTMLAttributes<HTMLDivElement>

// shadcn/ui Card
export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-xl border shadow-sm border-gray-200 bg-white text-slate-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}

export function CardTitle({ className, ...props }: DivProps) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}

export function CardDescription({ className, ...props }: DivProps) {
  return <p className={cn("text-sm text-slate-500 dark:text-neutral-400", className)} {...props} />
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
}
