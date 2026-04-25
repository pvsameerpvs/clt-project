import { getProducts, getSiteSettings } from "@/lib/api";
import { Hero } from "@/components/hero";
import { Collections } from "@/components/collections";
import { FeaturedProducts } from "@/components/featured-products";
import { OfferCards } from "@/components/offer-cards";
import { PocketFriendly } from "@/components/pocket-friendly";
import { BrandStory } from "@/components/brand-story";

export default async function Home() {
  const [settings, products] = await Promise.all([getSiteSettings(), getProducts()]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <Hero initialSlides={settings?.hero_slides} />
      <Collections initialCollections={settings?.collections} />
      <FeaturedProducts initialProducts={products} />
      <BrandStory initialData={settings?.brand_story} />
      <OfferCards initialOffers={settings?.offers} />
      <PocketFriendly
        initialPricePoints={settings?.pocket_friendly_configs}
        initialProducts={products}
      />
    </div>
  );
}
