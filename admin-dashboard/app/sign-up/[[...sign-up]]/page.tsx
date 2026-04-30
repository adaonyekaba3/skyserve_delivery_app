import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <span className="text-xl font-bold text-accent">S</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text">SkyServe Admin</h1>
        <p className="mt-1 text-sm text-muted">Create your operator account</p>
      </div>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#1E3A8A',
            colorText: '#0F172A',
            colorTextSecondary: '#64748B',
            colorBackground: '#FFFFFF',
            colorInputBackground: '#FFFFFF',
            colorInputText: '#0F172A',
            borderRadius: '10px',
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
          },
          elements: {
            card: 'shadow-card border border-border',
            formButtonPrimary:
              'bg-primary hover:bg-primary-hover text-white font-semibold',
            headerTitle: 'text-text font-bold',
            headerSubtitle: 'text-muted',
            socialButtonsBlockButton: 'border-border hover:bg-bg',
            footerActionLink: 'text-primary hover:text-primary-hover',
          },
        }}
      />
    </div>
  );
}
