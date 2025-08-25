// app/farmer/products/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productCreateSchema, ProductCreateInput } from "@/lib/validations/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      quantity: 0,
      category: "FRUITS",
      location: "",
      image: "",
    },
  });

  // ✅ Cloudinary Upload Handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const secureUrl = data.secure_url || data.url;

      setUploadedImage(secureUrl);
      setValue("image", secureUrl, { shouldValidate: true });
    } catch (err) {
      console.error(err);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Form Submit
  const onSubmit: SubmitHandler<ProductCreateInput> = async (values) => {
    try {
      setLoading(true);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to create product");

      router.push("/farmer/products");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while creating product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Add New Product</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block mb-1 text-sm font-medium">Name</label>
              <Input type="text" {...register("name")} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 text-sm font-medium">Description</label>
              <Textarea rows={3} {...register("description")} />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block mb-1 text-sm font-medium">Price</label>
              <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
              {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block mb-1 text-sm font-medium">Quantity</label>
              <Input type="number" {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block mb-1 text-sm font-medium">Category</label>
              <select {...register("category")} className="border rounded-md px-3 py-2 w-full">
                <option value="FRUITS">Fruits</option>
                <option value="VEGETABLES">Vegetables</option>
                <option value="GRAINS">Grains</option>
                <option value="DAIRY">Dairy</option>
              </select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block mb-1 text-sm font-medium">Location</label>
              <Input type="text" {...register("location")} />
              {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
            </div>

            {/* Image Upload or URL */}
            <div>
              <label className="block mb-1 text-sm font-medium">Product Image</label>

              {/* Upload from Device */}
              <Input type="file" accept="image/*" onChange={handleUpload} />
              {uploading && <p className="text-sm text-gray-500">Uploading...</p>}

              {/* OR paste URL */}
              <p className="mt-2 text-sm text-gray-600">Or paste image URL:</p>
              <Input
                type="text"
                placeholder="https://example.com/image.jpg"
                {...register("image")}
                onChange={(e) => {
                  setUploadedImage(e.target.value);
                  setValue("image", e.target.value, { shouldValidate: true });
                }}
              />

              {/* Preview */}
              {uploadedImage && (
                <img
                  src={uploadedImage}
                  alt="Preview"
                  className="mt-2 w-32 h-32 object-cover rounded-md"
                />
              )}

              {errors.image && <p className="text-red-500 text-sm">{errors.image.message}</p>}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting || uploading} className="w-full">
              {loading ? "Creating..." : "Create Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
