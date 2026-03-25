import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { login, signInWithGoogle } from "@/app/auth/actions"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>
}) {
  const { error, message, next } = await searchParams
  const nextPath = next && next.startsWith("/") ? next : "/profile"

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-neutral-50">
      {/* Left Area - Editorial Image */}
      <div className="relative hidden lg:block overflow-hidden">
        <Image 
          src="/login-bg.png"
          alt="Luxury Perfumes Background"
          fill
          className="object-cover scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-10 left-10 z-10 text-white">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs tracking-[0.2em] font-medium uppercase">Return to Boutique</span>
          </Link>
        </div>

        <div className="absolute bottom-12 left-12 right-12 z-10 text-white">
          <h2 className="text-4xl font-serif leading-tight mb-4">
            &ldquo;A perfume is like a piece of clothing, a message, a way of presenting oneself.&rdquo;
          </h2>
          <p className="font-light tracking-wide text-white/80 uppercase text-xs">Discover Your Signature Scent</p>
        </div>
      </div>

      {/* Right Area - Form Container */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-[420px] bg-white p-8 sm:p-12 shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] rounded-3xl border border-neutral-100">
          
          <div className="mb-10 text-center">
             <div className="flex justify-center mb-6">
               <div className="flex flex-col items-center">
                 <span className="text-4xl font-serif font-bold tracking-tighter text-black">CLE</span>
                 <span className="text-[9px] tracking-[0.4em] uppercase mt-1 text-neutral-500">Perfumes</span>
               </div>
             </div>
            <h1 className="text-2xl font-serif text-neutral-900 mb-2">Welcome Back</h1>
            <p className="text-sm text-neutral-500 font-light">Sign in to your CLE account to continue.</p>
          </div>

          <div className="space-y-6">
            <form action={signInWithGoogle}>
              <Button
                type="submit"
                variant="outline"
                className="w-full h-12 rounded-xl border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-3 transition-colors bg-white hover:text-black"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M23.52 12.2727C23.52 11.4218 23.4436 10.6036 23.3018 9.81818H12V14.4545H18.4582C18.18 15.9491 17.34 17.2145 16.0364 18.0873V21.0873H19.9145C22.1836 19.0091 23.52 15.9273 23.52 12.2727Z" fill="#4285F4"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.0001 24C15.2401 24 17.9674 22.9254 19.9146 21.0873L16.0365 18.0873C14.9837 18.7964 13.6092 19.2273 12.0001 19.2273C8.88011 19.2273 6.23466 17.1218 5.28556 14.3073L5.27539 14.316V17.3879L1.35284 17.3818C3.31647 21.2891 7.34738 24 12.0001 24Z" fill="#34A853"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M5.28545 14.3073C5.04545 13.5982 4.90909 12.8236 4.90909 12C4.90909 11.1764 5.04545 10.4018 5.28545 9.69273V6.62182H1.35273C0.534545 8.25273 0.0654545 10.0745 0.0654545 12C0.0654545 13.9255 0.534545 15.7473 1.35273 17.3782L5.28545 14.3073Z" fill="#FBBC05"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.0001 4.77273C13.7619 4.77273 15.3383 5.37818 16.5819 6.56182L20.0019 3.14182C17.962 1.25455 15.2346 0 12.0001 0C7.34738 0 3.31647 2.71091 1.35284 6.61818L5.28556 9.69273C6.23466 6.87818 8.88011 4.77273 12.0001 4.77273Z" fill="#EA4335"/>
                </svg>
                <span className="font-medium text-xs tracking-wide text-neutral-700">Continue with Google</span>
              </Button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-neutral-100"></div>
              <span className="flex-shrink-0 mx-4 text-neutral-400 text-xs font-medium bg-white px-2 uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-neutral-100"></div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {message}
              </p>
            )}

            <form className="space-y-5" action={login}>
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium ml-1">Email Address</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="name@example.com"
                  className="h-12 rounded-xl border-neutral-200 focus-visible:ring-black focus-visible:border-black bg-neutral-50/50 px-4 text-sm transition-all"
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">Password</Label>
                  <Link href="#" className="text-[11px] text-neutral-400 hover:text-black transition-colors underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-neutral-200 focus-visible:ring-black focus-visible:border-black bg-neutral-50/50 px-4 text-sm transition-all"
                  required 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all shadow-lg shadow-black/10 mt-2"
              >
                Sign In
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-neutral-500 text-sm font-light">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-black font-semibold hover:underline underline-offset-4 transition-all">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
