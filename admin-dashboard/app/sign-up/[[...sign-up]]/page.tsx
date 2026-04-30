import { SignUp } from '@clerk/nextjs';
import { BrandWordmark } from '../../../components/BrandWordmark';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6">
      <div className="mb-8 text-center flex flex-col items-center gap-4">
        <BrandWordmark variant="splash" />
        <p className="text-sm text-muted">
          Create your Queen Operations account
        </p>
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
