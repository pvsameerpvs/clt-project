import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function OfferCards() {
  const cards = [
    {
      title: "Signature Sets",
      description: "Curated collections of our finest scents, beautifully bundled and packaged.",
      linkText: "Shop Sets",
      href: "/signature-sets",
      bgColor: "bg-[#F3F0EA]", // Muted earthy sand
      textColor: "text-neutral-900"
    },
    {
      title: "Personal Engraving",
      description: "Add a personalized engraving to your bottle, available on all 100ml flacons.",
      linkText: "Learn More",
      href: "/personal-engraving",
      bgColor: "bg-[#EBEFF5]", // Soft arctic blue
      textColor: "text-neutral-900"
    },
    {
      title: "Complimentary Samples",
      description: "Receive two complimentary luxury miniatures with every online order.",
      linkText: "View Details",
      href: "/complimentary-samples",
      bgColor: "bg-[#F5EBEB]", // Faded rose
      textColor: "text-neutral-900"
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, idx) => (
            <Link 
              key={idx}
              href={card.href} 
              className={`${card.bgColor} p-10 lg:p-14 h-full flex flex-col justify-between group block hover:shadow-xl transition-all duration-500 border border-black/5`}
            >
              <div>
                <h3 className={`text-2xl font-serif mb-4 ${card.textColor}`}>{card.title}</h3>
                <p className="text-neutral-600 font-light mb-16 text-sm leading-relaxed max-w-[250px]">
                  {card.description}
                </p>
              </div>
              <div 
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black group-hover:gap-4 transition-all"
              >
                {card.linkText} <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
