// app/signup/page.tsx
import GenericSignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left: Marketing */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 text-white items-center justify-center p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-4">Welcome to CompanyFlash</h1>
          <p className="mb-6">
            Collaborate seamlessly, manage your team, and track progress in one place.
            Join hundreds of companies already growing with us!
          </p>
          <ul className="space-y-2">
            <li>✔️ Real-time project dashboards</li>
            <li>✔️ Secure, role-based access</li>
            <li>✔️ Effortless team invites</li>
          </ul>
        </div>
      </div>

      {/* Right: Signup form */}
      <div className="flex-grow flex items-center justify-center p-8">
        <GenericSignupForm />
      </div>
    </div>
  );
}
