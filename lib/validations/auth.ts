import {z} from "zod";

export const signInSchema = z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
})

export type  SignInSchema = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "FARMER", "ADMIN"])
});

export type SignUpSchema = z.infer<typeof signUpSchema>;