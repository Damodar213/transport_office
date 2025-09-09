import { Logo } from "./logo"

interface PageHeaderProps {
  title?: string
  subtitle?: string
  showLogo?: boolean
  className?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  showLogo = true, 
  className = "" 
}: PageHeaderProps) {
  return (
    <div className={`text-center mb-8 ${className}`}>
      {showLogo && (
        <div className="flex items-center justify-center mb-4">
          <Logo size="lg" />
        </div>
      )}
      {title && (
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-muted-foreground text-lg">
          {subtitle}
        </p>
      )}
    </div>
  )
}



