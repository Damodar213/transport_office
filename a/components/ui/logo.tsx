import Link from "next/link"
import Image from "next/image"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-12 w-16",
    md: "h-16 w-20", 
    lg: "h-20 w-24"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  }

  return (
    <Link href="/" className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <Image
          src="/mahalaxmi-logo.png"
          alt="Mahalaxmi Transport Co Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-blue-900 ${textSizeClasses[size]}`}>
            MAHALAXMI
          </span>
          <span className={`text-blue-700 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
            TRANSPORT CO
          </span>
        </div>
      )}
    </Link>
  )
}
