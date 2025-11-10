import { useState } from 'react';
import { useAuth } from '@lib/context/auth-context';
import { CustomIcon } from '@components/ui/custom-icon';
import { Button } from '@components/ui/button';
import { BackgroundCarousel } from './background-carousel';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function LoginMain(): JSX.Element {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        toast.success('Account created! Please check your email to verify.');
      } else {
        await signInWithEmail(email, password);
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (showEmailForm) {
    return (
      <main className='grid lg:grid-cols-[1fr,45vw]'>
        <div className='relative hidden items-center justify-center overflow-hidden lg:flex'>
          <BackgroundCarousel />
          <i className='absolute z-10'>
            <CustomIcon className='h-[600px] w-[600px] text-white' iconName='WhistlrIcon' />
          </i>
        </div>
        <div className='flex flex-col items-center justify-center gap-6 p-8'>
          <div className='w-full max-w-md'>
            <button
              onClick={() => setShowEmailForm(false)}
              className='mb-4 text-accent-blue hover:underline'
            >
              ← Back
            </button>
            <h2 className='mb-6 text-3xl font-bold'>
              Discover.<span className='animated-gradient'>Connect</span> Explore
            </h2>
            <h3 className='mb-6 text-xl font-semibold'>
              {isSignUp ? 'Create your account' : 'Sign in to Whistlr'}
            </h3>
            <form onSubmit={handleEmailAuth} className='flex flex-col gap-4'>
              {isSignUp && (
                <input
                  type='text'
                  placeholder='Name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className='rounded-md border border-light-border bg-transparent px-4 py-3 focus:border-accent-blue focus:outline-none dark:border-dark-border'
                />
              )}
              <input
                type='email'
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='rounded-md border border-light-border bg-transparent px-4 py-3 focus:border-accent-blue focus:outline-none dark:border-dark-border'
              />
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className='w-full rounded-md border border-light-border bg-transparent px-4 py-3 pr-12 focus:border-accent-blue focus:outline-none dark:border-dark-border'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary'
                >
                  {showPassword ? (
                    <EyeSlashIcon className='h-5 w-5' />
                  ) : (
                    <EyeIcon className='h-5 w-5' />
                  )}
                </button>
              </div>
              {!isSignUp && (
                <div className='flex justify-end'>
                  <button
                    type='button'
                    className='text-sm text-accent-blue hover:underline'
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              <Button
                type='submit'
                disabled={loading}
                className='bg-accent-blue py-3 text-white transition hover:brightness-90 focus-visible:!ring-accent-blue/80 focus-visible:brightness-90 active:brightness-75 disabled:opacity-50'
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
              </Button>
            </form>
            <p className='mt-4 text-center'>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className='text-accent-blue hover:underline'
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='grid lg:grid-cols-[1fr,45vw]'>
      <div className='relative hidden items-center justify-center overflow-hidden lg:flex'>
        <BackgroundCarousel />
        <i className='absolute z-10'>
          <CustomIcon className='h-[600px] w-[600px] text-white' iconName='WhistlrIcon' />
        </i>
      </div>
      <div className='flex flex-col items-center justify-between gap-6 p-8 lg:items-start lg:justify-center'>
        <div className='flex max-w-xs flex-col gap-4 lg:max-w-none lg:gap-16'>
          <h1 className='text-3xl lg:text-6xl font-bold'>
            Discover.
            <span className='animated-gradient'>Connect</span> Explore
          </h1>
          <h2 className='text-xl lg:text-3xl font-bold'>
            Join Whistlr today.
          </h2>
        </div>
        <div className='flex max-w-xs flex-col gap-6 [&_button]:py-2'>
          <div className='grid gap-3 font-bold'>
            <Button
              className='flex justify-center gap-2 border border-light-line-reply font-bold text-light-primary transition
                         hover:bg-[#e6e6e6] focus-visible:bg-[#e6e6e6] active:bg-[#cccccc] dark:border-0 dark:bg-white
                         dark:hover:brightness-90 dark:focus-visible:brightness-90 dark:active:brightness-75'
              onClick={signInWithGoogle}
            >
              <CustomIcon iconName='GoogleIcon' /> Sign up with Google
            </Button>
            <div className='grid w-full grid-cols-[1fr,auto,1fr] items-center gap-2'>
              <i className='border-b border-light-border dark:border-dark-border' />
              <p>or</p>
              <i className='border-b border-light-border dark:border-dark-border' />
            </div>
            <Button
              className='bg-accent-blue text-white transition hover:brightness-90
                         focus-visible:!ring-accent-blue/80 focus-visible:brightness-90 active:brightness-75'
              onClick={() => {
                setIsSignUp(true);
                setShowEmailForm(true);
              }}
            >
              Sign up with email
            </Button>
            <p
              className='inner:custom-underline inner:custom-underline text-center text-xs
                         text-light-secondary inner:text-accent-blue dark:text-dark-secondary'
            >
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
          <div className='flex flex-col gap-3'>
            <p className='font-bold'>Already have an account? </p>
            <Button
              className='border border-light-line-reply font-bold text-accent-blue hover:bg-accent-blue/10
                         focus-visible:bg-accent-blue/10 focus-visible:!ring-accent-blue/80 active:bg-accent-blue/20
                         dark:border-light-secondary'
              onClick={() => {
                setIsSignUp(false);
                setShowEmailForm(true);
              }}
            >
              Sign in
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
