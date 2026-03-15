
import { Hero } from "@/components/hero";
import { Collections } from "@/components/collections";
import { FeaturedProducts } from "@/components/featured-products";
import { OfferCards } from "@/components/offer-cards";
import { PocketFriendly } from "@/components/pocket-friendly";
import { BrandStory } from "@/components/brand-story";
import { Newsletter } from "@/components/newsletter";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <Hero />
      <Collections />
      <FeaturedProducts />
      <BrandStory />
     
      <OfferCards />
      <PocketFriendly />
       <Newsletter />
    </div>
  );
}
