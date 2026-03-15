import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface CollectionCardProps {
  href: string;
  imageSrc: string;
  imageAlt: string;
  subtitle: string;
  title: React.ReactNode;
  actionText: string;
}

export function CollectionCard({ href, imageSrc, imageAlt, subtitle, title, actionText }: CollectionCardProps) {
  return (
    <Link href={href} className="relative group overflow-hidden rounded-2xl block h-full w-full">
      <div className="absolute inset-0 z-0">
         <Image 
           src={imageSrc}
           alt={imageAlt}
           fill
           className="object-cover transition-transform duration-1000 group-hover:scale-105"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
      </div>
      <div className="relative z-10 w-full h-full flex flex-col justify-end p-8 md:p-10">
         <span className="text-white/70 text-xs font-medium uppercase tracking-[0.2em] mb-3">{subtitle}</span>
         <h3 className="text-3xl md:text-4xl font-serif text-white mb-4 leading-none">{title}</h3>
         <div className="flex items-center text-white text-sm group-hover:text-white transition-colors overflow-hidden">
            <span className="uppercase tracking-widest font-medium border-b border-white/30 pb-1 group-hover:border-white transition-colors">{actionText}</span>
            <ArrowRight className="h-4 w-4 ml-3 transition-transform group-hover:translate-x-2" />
         </div>
      </div>
    </Link>
  )
}
