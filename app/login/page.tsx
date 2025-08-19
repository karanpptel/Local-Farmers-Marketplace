"use client";
import {SubmitHandler, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {SignInSchema, signInSchema} from "@/lib/validations/auth";
import { useState } from "react";
import { signIn} from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<SignInSchema> = async (data) => {
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("email", {
          type: "manual",
          message: "Invalid email or password. Please try again.",
        });
      } else {
        // Successful login, redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("email", {
        type: "manual",
        message: "Login failed. Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  }
  // const [form, setForm] = useState({
  //   email: "",
  //   password: "",
  // });
  // const [message, setMessage] = useState("");
  // const [loading, setLoading] = useState(false);
  // const router = useRouter();

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setForm({
  //     ...form,
  //     [e.target.name]: e.target.value,
  //   });
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setMessage("");
  //   setLoading(true);

  //   try {
  //     const result = await signIn("credentials", {
  //       email: form.email,
  //       password: form.password,
  //       redirect: false,
  //     });

  //     if (result?.error) {
  //       setMessage("Invalid credentials. Please try again.");
  //     } else {
  //       setMessage("Login successful! Redirecting...");
  //       // Get the updated session
  //       const session = await getSession();
  //       console.log("Session after login:", session);
        
  //       // Redirect to dashboard or home
  //       router.push("/dashboard");
  //     }
  //   } catch (error) {
  //     console.error("Error during login:", error);
  //     setMessage("Something went wrong. Please try again later.");
  //   } finally {
  //     setLoading(false);
  //   }
  

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-96 p-6 shadow-lg rounded-lg bg-white space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

           {errors.root && (
            <p className="text-red-500 text-sm">{errors.root.message}</p>
          )}

          <Input
            type="email"
            placeholder="Email"
            {...register("email")}
            className="w-full p-2 border rounded"
        
          />
            {errors.email && (<p className="text-red-500 text-sm">{errors.email.message}</p> )}
          <Input
            type="password"
            placeholder="Password"
            {...register("password")}
            className="w-full p-2 border rounded"
            
          />
          {errors.password && (<p className="text-red-500 text-sm">{errors.password.message}</p> )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

         
        </form>

        <div className="text-center">
          <p className="text-gray-600 mb-2">Or sign in with:</p>
          <div className="space-y-2">
            <Button
              onClick={() => handleOAuthSignIn("github")}
              className="w-full bg-gray-800 text-white p-2 rounded hover:bg-gray-900 transition"
            >
              Sign in with GitHub
            </Button>
            <Button
              onClick={() => handleOAuthSignIn("google")}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
            >
              Sign in with Google
            </Button>
          </div>
        </div>

       

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