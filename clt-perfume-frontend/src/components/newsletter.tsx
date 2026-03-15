import { Button } from "@/components/ui/button";

export function Newsletter() {
  return (
    <section className="py-24 bg-neutral-50 border-t border-neutral-100">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-3xl font-serif mb-6 text-neutral-900">Join the Circle</h2>
        <p className="text-neutral-500 mb-8 font-light">
          Be the first to know about new releases, exclusive events, and the art of perfumery.
        </p>
        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-1 px-4 py-3 bg-white border border-neutral-200 focus:outline-none focus:border-black rounded-sm text-sm"
          />
          <Button className="rounded-none bg-black text-white hover:bg-neutral-800 px-8 py-6 uppercase text-xs tracking-widest font-medium transition-colors">
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  );
}
