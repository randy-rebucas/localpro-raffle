'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  FaApple,
  FaCheck,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaGift,
  FaHeadset,
  FaLock,
  FaShieldAlt,
  FaSignal,
  FaUser,
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the terms before creating your account');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Auto-login after signup
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8faff_0%,#f5f7ff_42%,#ffffff_100%)] px-4 py-10 text-slate-950">
      <div className="mx-auto grid min-h-[860px] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] lg:grid-cols-[430px_1fr]">
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

              <div className="relative h-36 w-32 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_24px_45px_rgba(79,70,229,0.28)]">
                <div className="absolute -top-3 left-1/2 h-8 w-16 -translate-x-1/2 rounded-lg bg-purple-600">
                  <div className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-indigo-100" />
                </div>
                <div className="absolute inset-4 rounded-lg bg-white/90" />
                {[0, 1, 2].map((item) => (
                  <div key={item} className="absolute left-8 flex items-center gap-3" style={{ top: 42 + item * 32 }}>
                    <FaCheck className="text-purple-600" size={18} />
                    <span className="h-2 w-14 rounded-full bg-indigo-200" />
                  </div>
                ))}
                <div className="absolute -right-7 bottom-4 h-24 w-5 rotate-[18deg] rounded-full bg-gradient-to-b from-purple-500 to-amber-300 shadow-lg" />
              </div>
            </div>
          </div>

          <div className="mt-20">
            <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
            <p className="mt-5 max-w-[270px] text-base leading-7 text-slate-700">
              Join Raffle Pro and start creating amazing raffles.
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

          <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-12 lg:px-20 lg:py-16">
            <div className="w-full max-w-[500px]">
              <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight">Create your account</h1>
                <p className="mt-5 text-base text-slate-500">Start your journey with Raffle Pro today.</p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="mb-3 block text-sm font-semibold text-slate-950">
                    Full name
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      className="h-14 w-full rounded-lg border border-slate-300 bg-white pl-14 pr-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

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
                  <label htmlFor="password" className="mb-3 block text-sm font-semibold text-slate-950">
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                      className="h-14 w-full rounded-lg border border-slate-300 bg-white pl-14 pr-14 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Must be at least 8 characters long</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-3 block text-sm font-semibold text-slate-950">
                    Confirm password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      className="h-14 w-full rounded-lg border border-slate-300 bg-white pl-14 pr-14 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded shadow-sm ${acceptedTerms ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-transparent'}`}>
                    {acceptedTerms && <FaCheck size={12} />}
                  </span>
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="sr-only"
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="#" className="font-semibold text-blue-600 hover:text-blue-700">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="#" className="font-semibold text-blue-600 hover:text-blue-700">Privacy Policy</Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <div className="my-9 flex items-center gap-5 text-xs text-slate-500">
                <div className="h-px flex-1 bg-slate-200" />
                <span>or sign up with</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  disabled
                  className="flex h-14 w-full cursor-not-allowed items-center justify-center gap-4 rounded-lg border border-slate-200 bg-slate-50 text-base font-medium text-slate-400 shadow-sm"
                  title="Google sign-up is not configured yet"
                >
                  <FcGoogle size={22} />
                  Continue with Google
                </button>
                <button
                  type="button"
                  disabled
                  className="flex h-14 w-full cursor-not-allowed items-center justify-center gap-4 rounded-lg border border-slate-200 bg-slate-50 text-base font-medium text-slate-400 shadow-sm"
                  title="Apple sign-up is not configured yet"
                >
                  <FaApple size={22} />
                  Continue with Apple
                </button>
              </div>

              <div className="mt-10 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign in
                </Link>
              </div>
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
