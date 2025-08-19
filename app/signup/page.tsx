"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function SignUpPage() {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "",
    role: "CUSTOMER" // Default role
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { data: session, status } = useSession();
  
  const router = useRouter();

  useEffect(() => {
    if(status === 'authenticated'){
        const role = session.user?.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "FARMER") router.push("/farmer");
      else router.push("/customer"); // default CUSTOMER

    }
  },[ status, session, router ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // First, create the user account
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Account created successfully! Signing you in...");
        
        // Auto-login after successful signup
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Account created but login failed. Please try signing in manually.");
          setTimeout(() => {
            router.push("/login");
          }, 1000);
        } else {
          // Successful login, role-based redirect will run automatically
        }
      } else {
        setError(data.error || "Something went wrong during signup");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password validation
  const isPasswordValid = form.password.length >= 6;
  const isFormValid = form.name && form.email && isPasswordValid;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our local farmers marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-red-700 bg-red-100 border border-red-300 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 text-green-700 bg-green-100 border border-green-300 rounded">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Create a password (min. 6 characters)"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={6}
            />
            {form.password && !isPasswordValid && (
              <p className="text-red-500 text-sm mt-1">Password must be at least 6 characters</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CUSTOMER">Customer - Buy from local farmers</option>
              <option value="FARMER">Farmer - Sell your products</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign In
            </a>
          </p>
        </div>

        {/* <div className="text-center">
          <p className="text-gray-500 text-sm">
            Or continue with social accounts
          </p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="w-full bg-gray-800 text-white p-2 rounded-md hover:bg-gray-900 transition"
            >
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition"
            >
              Continue with Google
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}
