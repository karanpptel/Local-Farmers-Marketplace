// "use client";

// import * as React from "react";
// import { useRouter } from "next/navigation";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { SubmitHandler, useForm } from "react-hook-form";
// import {productCreateSchema, type ProductCreateInput} from "@/lib/validations/product";

// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormControl,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { toast } from "react-toastify";


// type ProductFormProps = {
//   mode: "create" | "edit";
//   productId?: string; // required for edit
//   defaultValues?: Partial<ProductCreateInput>;

// };

// const CATEGORY_OPTIONS = ["FRUITS", "VEGETABLES", "GRAINS", "DAIRY"] as const;

// export default function ProductForm({
//   mode,
//   productId,
//   defaultValues,
// }: ProductFormProps) {
//   const router = useRouter();
  
    

//   const form = useForm<ProductCreateInput>({
//     resolver: zodResolver(productCreateSchema),
//     defaultValues: {
//       name: "",
//       description: "",
//       price: undefined as unknown as number,
//       quantity: undefined as unknown as number,
//       category: undefined as unknown as ProductCreateInput["category"],
//       location: "",
//       image: "",
//       ...defaultValues,
//     },
//   });

//    const { control, handleSubmit, formState  } = form;
//   const { isSubmitting } = formState;

//   const onSubmit: SubmitHandler<ProductCreateInput> = async (values) => {
//     try {
//       const endpoint =
//         mode === "create"
//           ? "/api/products"
//           : `/api/products/${productId}`;

//       const method = mode === "create" ? "POST" : "PUT";

//       const res = await fetch(endpoint, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(values),
//       });

//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         throw new Error(data?.error || "Request failed");
//       }

//      toast.success(
//         mode === "create" ? "Product created successfully!" : "Product updated successfully!"
//       );


//       router.push("/farmer/products");
//       router.refresh();
//     } catch (err: any) {
//       toast.error(err?.message ?? "Please try again.");
//         console.error("ProductForm error:", err);
//     }
//   };



//   return (
//     <Form {...form}>
//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//         <div className="grid gap-6 md:grid-cols-2">
//           {/* Name */}
//           <FormField
//             control={control}
//             name="name"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Name</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g., Organic Mangoes" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Category */}
//           <FormField
//             control={control}
//             name="category"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Category</FormLabel>
//                 <FormControl>
//                   <Select
//                     onValueChange={field.onChange}
//                     defaultValue={field.value}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a category" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {CATEGORY_OPTIONS.map((c) => (
//                         <SelectItem key={c} value={c}>
//                           {c}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Price */}
//           <FormField
//             control={control}
//             name="price"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Price</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="number"
//                     step="0.01"
//                     placeholder="e.g., 199.99"
//                     {...field}
//                     onChange={(e) =>
//                       field.onChange(
//                         e.target.value === "" ? "" : Number(e.target.value)
//                       )
//                     }
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Quantity */}
//           <FormField
//             control={control}
//             name="quantity"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Quantity</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="number"
//                     placeholder="e.g., 50"
//                     {...field}
//                     onChange={(e) =>
//                       field.onChange(
//                         e.target.value === "" ? "" : Number(e.target.value)
//                       )
//                     }
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Location */}
//           <FormField
//             control={control}
//             name="location"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Location</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g., Vadodara, Gujarat" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Image URL (optional) */}
//           <FormField
//             control={control}
//             name="image"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Image URL (optional)</FormLabel>
//                 <FormControl>
//                   <Input placeholder="https://..." {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>

//         {/* Description */}
//         <FormField
//           control={control}
//           name="description"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Description (optional)</FormLabel>
//               <FormControl>
//                 <Textarea
//                   rows={4}
//                   placeholder="Write a short description about your product..."
//                   {...field}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <div className="flex gap-3">
//           <Button type="submit" disabled={isSubmitting}>
//             {mode === "create" ? "Create Product" : "Save Changes"}
//           </Button>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => router.push("/farmer/products")}
//           >
//             Cancel
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// }
