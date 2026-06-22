import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="w-full h-full flex flex-col">
      {children}
    </div>
  )
}
