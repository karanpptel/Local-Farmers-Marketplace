"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setMessage("Invalid credentials. Please try again.");
      } else {
        setMessage("Login successful! Redirecting...");
        // Get the updated session
        const session = await getSession();
        console.log("Session after login:", session);
        
        // Redirect to dashboard or home
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setMessage("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-96 p-6 shadow-lg rounded-lg bg-white space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600 mb-2">Or sign in with:</p>
          <div className="space-y-2">
            <button
              onClick={() => handleOAuthSignIn("github")}
              className="w-full bg-gray-800 text-white p-2 rounded hover:bg-gray-900 transition"
            >
              Sign in with GitHub
            </button>
            <button
              onClick={() => handleOAuthSignIn("google")}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
            >
              Sign in with Google
            </button>
          </div>
        </div>

        {message && (
          <p className={`text-center mt-2 ${message.includes("successful") ? "text-green-500" : "text-red-500"}`}>
            {message}
          </p>
        )}

        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-500 hover:text-blue-700 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}