import { CollectionCard } from "@/components/collections/collection-card"

export function Collections() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col mb-12">
          <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-neutral-900 mb-4">
            Curated Selections
          </h2>
          <p className="text-neutral-500 max-w-lg font-light">
            Discover our most sought-after fragrances, tailored for every preference and occasion. Shop by exclusive collections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px] md:auto-rows-[600px]">
          <CollectionCard 
            href="/collections/mens"
            imageSrc="/curated-perfume-men-2.jpeg"
            imageAlt="Best Men's Collection"
            subtitle="For Him"
            title={<>Best Men&apos;s<br/>Collection</>}
            actionText="Explore"
          />
          <CollectionCard 
            href="/collections/womens"
            imageSrc="/curated-pefume-banner-1.jpeg"
            imageAlt="Best Women's Collection"
            subtitle="For Her"
            title={<>Best Women&apos;s<br/>Collection</>}
            actionText="Explore"
          />
          <CollectionCard 
            href="/collections/deals"
            imageSrc="/best-deals-sets.png"
            imageAlt="Best Deals"
            subtitle="Exclusive Offers"
            title={<>Best Deals<br/>& Sets</>}
            actionText="Shop Now"
          />
        </div>
      </div>
    </section>
  )
}
