import React from "react"

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className = "", ...props }: DivProps) {
  return (
    <div
      className={
        "rounded-xl border border-[#e5e7eb] dark:border-[#2a2a2a] bg-white dark:bg-[#111] shadow-sm " +
        className
      }
      {...props}
    />
  )
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return <div className={"p-4 sm:p-6 " + className} {...props} />
}

export function CardTitle({ className = "", ...props }: DivProps) {
  return (
    <h3
      className={
        "text-lg font-semibold leading-none tracking-tight text-[#0f172a] dark:text-white " +
        className
      }
      {...props}
    />
  )
}

export function CardDescription({ className = "", ...props }: DivProps) {
  return (
    <p
      className={
        "text-sm text-[#475569] dark:text-[#9ca3af] mt-1 " + className
      }
      {...props}
    />
  )
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={"p-4 sm:p-6 pt-0 " + className} {...props} />
}

export function CardFooter({ className = "", ...props }: DivProps) {
  return <div className={"p-4 sm:p-6 pt-0 " + className} {...props} />
}

