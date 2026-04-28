'use client';

import { Suspense, FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FaApple,
  FaCheck,
  FaEnvelope,
  FaGift,
  FaHeadset,
  FaLock,
  FaShieldAlt,
  FaSignal,
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label htmlFor="email" className="mb-3 block text-sm font-semibold text-slate-950">
            Email address
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="h-14 w-full rounded-lg border border-slate-300 bg-white pl-14 pr-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-950">
              Password
            </label>
            <Link href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="h-14 w-full rounded-lg border border-slate-300 bg-white pl-14 pr-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-slate-600">
          <span className={`flex h-5 w-5 items-center justify-center rounded shadow-sm ${rememberMe ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-transparent'}`}>
            {rememberMe && <FaCheck size={12} />}
          </span>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="sr-only"
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="my-9 flex items-center gap-5 text-xs text-slate-500">
        <div className="h-px flex-1 bg-slate-200" />
        <span>or continue with</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-4">
        <button
          type="button"
          disabled
          className="flex h-14 w-full cursor-not-allowed items-center justify-center gap-4 rounded-lg border border-slate-200 bg-slate-50 text-base font-medium text-slate-400 shadow-sm"
          title="Google sign-in is not configured yet"
        >
          <FcGoogle size={22} />
          Continue with Google
        </button>
        <button
          type="button"
          disabled
          className="flex h-14 w-full cursor-not-allowed items-center justify-center gap-4 rounded-lg border border-slate-200 bg-slate-50 text-base font-medium text-slate-400 shadow-sm"
          title="Apple sign-in is not configured yet"
        >
          <FaApple size={22} />
          Continue with Apple
        </button>
      </div>

      <div className="mt-10 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
          Sign up
        </Link>
      </div>
    </>
  );
}

function LoginPageContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8faff_0%,#f5f7ff_42%,#ffffff_100%)] px-4 py-10 text-slate-950">
      <div className="mx-auto grid min-h-[820px] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] lg:grid-cols-[430px_1fr]">
        <aside className="relative hidden border-r border-slate-200 bg-gradient-to-br from-white via-indigo-50/40 to-white px-10 py-10 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
              <FaGift size={20} />
            </span>
            <span className="text-2xl font-bold tracking-tight">Raffle Pro</span>
          </Link>

          <div className="mt-36 flex justify-center">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-indigo-100/70">
              <span className="absolute left-1 top-12 h-2.5 w-2.5 rotate-45 bg-blue-400" />
              <span className="absolute right-7 top-24 h-2.5 w-2.5 rotate-45 bg-amber-400" />
              <span className="absolute bottom-12 left-3 h-2.5 w-2.5 rotate-45 bg-blue-400" />
              <span className="absolute right-2 bottom-24 h-2.5 w-2.5 rotate-45 bg-purple-500" />
              <div className="relative h-32 w-36 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 shadow-[0_24px_45px_rgba(79,70,229,0.28)]">
                <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-purple-600/80" />
                <div className="absolute left-0 top-8 h-8 w-full bg-blue-300/90" />
                <div className="absolute -top-10 left-1/2 h-14 w-20 -translate-x-1/2 rounded-full border-[14px] border-purple-600 border-b-transparent" />
                <div className="absolute -top-8 left-10 h-12 w-16 -rotate-[35deg] rounded-full border-[12px] border-purple-500 border-b-transparent" />
              </div>
            </div>
          </div>

          <div className="mt-20">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
            <p className="mt-5 max-w-[260px] text-base leading-7 text-slate-700">
              Sign in to your account and manage your raffles.
            </p>
          </div>

          <div className="mt-auto space-y-8">
            {[
              { icon: FaShieldAlt, title: 'Secure & Trusted', text: 'Your data is safe with us' },
              { icon: FaSignal, title: 'Powerful Features', text: 'Everything you need to run successful raffles' },
              { icon: FaHeadset, title: '24/7 Support', text: "We're here to help anytime" },
            ].map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="flex gap-5">
                  <Icon className="mt-1 shrink-0 text-indigo-600" size={28} />
                  <div>
                    <h3 className="font-bold text-slate-950">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex flex-col">
          <div className="px-6 py-8 sm:px-12 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
                <FaGift size={18} />
              </span>
              <span className="text-xl font-bold tracking-tight">Raffle Pro</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-12 lg:px-20 lg:py-20">
            <div className="w-full max-w-[500px]">
              <div className="mb-12">
                <h1 className="text-4xl font-bold tracking-tight">Sign in</h1>
                <p className="mt-5 text-base text-slate-500">Welcome back! Please sign in to your account.</p>
              </div>

              <LoginPageContent />
            </div>
          </div>

          <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-500">
            © 2026 Raffle Pro. Fair, random, transparent.
          </footer>
        </section>
      </div>
    </div>
  );
}
