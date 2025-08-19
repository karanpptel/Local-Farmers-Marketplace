"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpSchema, signUpSchema } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export default function SignUpPage() {

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit,setError, formState: { errors, isSubmitting }} = useForm<SignUpSchema>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "CUSTOMER", // Default role
    },
    resolver : zodResolver(signUpSchema)
  });

  const onSubmit: SubmitHandler<SignUpSchema> = async (data) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

       if (response.ok) {
         
    // Auto-login after successful signup
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
           setError("email", {
                    type: "manual",
                    message: result.error || "Signup failed. Please try again.",
                   });
          setTimeout(() => {
            router.push("/login");
          }, 1000);
        } else {
          // Successful login, role-based redirect will run automatically
        }
      } else {
        setError("email", {
          type: "manual",
          message: "Signup failed. Please try again.",
        });
        }
    
    } catch (error) {
      console.error("Signup error:", error);
      setError("email", {
        type: "manual",
        message: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };



  // const [form, setForm] = useState({ 
  //   name: "", 
  //   email: "", 
  //   password: "",
  //   role: "CUSTOMER" // Default role
  // });
  // const [error, setError] = useState<string | null>(null);
  // const [loading, setLoading] = useState(false);
  // const [success, setSuccess] = useState<string | null>(null);
  // const { data: session, status } = useSession();
  
  // const router = useRouter();

  // useEffect(() => {
  //   if(status === 'authenticated'){
  //       const role = session.user?.role;
  //     if (role === "ADMIN") router.push("/admin");
  //     else if (role === "FARMER") router.push("/farmer");
  //     else router.push("/customer"); // default CUSTOMER

  //   }
  // },[ status, session, router ]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  //   setForm({ ...form, [e.target.name]: e.target.value });
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError(null);
  //   setSuccess(null);
  //   setLoading(true);

  //   try {
  //     // First, create the user account
  //     const res = await fetch("/api/auth/signup", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(form),
  //     });

  //     const data = await res.json();

  //     if (res.ok) {
  //       setSuccess("Account created successfully! Signing you in...");
        
  //       // Auto-login after successful signup
  //       const result = await signIn("credentials", {
  //         email: form.email,
  //         password: form.password,
  //         redirect: false,
  //       });

  //       if (result?.error) {
  //         setError("Account created but login failed. Please try signing in manually.");
  //         setTimeout(() => {
  //           router.push("/login");
  //         }, 1000);
  //       } else {
  //         // Successful login, role-based redirect will run automatically
  //       }
  //     } else {
  //       setError(data.error || "Something went wrong during signup");
  //     }
  //   } catch (error) {
  //     console.error("Signup error:", error);
  //     setError("Network error. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // // Password validation
  // const isPasswordValid = form.password.length >= 6;
  // const isFormValid = form.name && form.email && isPasswordValid;
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our local farmers marketplace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {errors.root && (
            <p className="text-red-500 text-sm">{errors.root.message}</p>
          )}


          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Enter your full name"
              {...register("name")}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="Enter your email address"
              {...register("email")}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              {...register("role")}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CUSTOMER">Customer - Buy from local farmers</option>
              <option value="FARMER">Farmer - Sell your products</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

         

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
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
