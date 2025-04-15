import LoginForm from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Staff Login</h1>
          <p className="text-gray-500 mt-2">Enter your credentials to access the system</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
