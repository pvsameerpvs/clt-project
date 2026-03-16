"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/api";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await subscribeNewsletter(email);
      if (res.success) {
        toast.success("Welcome to the circle! Check your email soon.");
        setEmail("");
      } else {
        toast.error(res.error || "Subscription failed.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-neutral-50 border-t border-neutral-100">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-3xl font-serif mb-6 text-neutral-900">Join the Circle</h2>
        <p className="text-neutral-500 mb-8 font-light">
          Be the first to know about new releases, exclusive events, and the art of perfumery.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 bg-white border border-neutral-200 focus:outline-none focus:border-black rounded-sm text-sm"
          />
          <Button 
            disabled={loading}
            className="rounded-none bg-black text-white hover:bg-neutral-800 px-8 py-6 uppercase text-xs tracking-widest font-medium transition-colors"
          >
            {loading ? "Joining..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}
