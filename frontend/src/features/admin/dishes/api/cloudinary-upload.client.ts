import { env } from "@/shared/config/env";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  format?: string;
  error?: {
    message?: string;
  };
};

function assertCloudinaryConfig() {
  if (!env.cloudinaryCloudName || !env.cloudinaryUploadPreset) {
    throw new Error(
      "Chưa cấu hình Cloudinary. Vui lòng thêm NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }
}

function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("File tải lên phải là ảnh.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Ảnh không được vượt quá 5MB.");
  }
}

export async function uploadDishImageToCloudinary(file: File): Promise<string> {
  assertCloudinaryConfig();
  validateImageFile(file);

  const formData = new FormData();
  formData.set("file", file);
  formData.set("upload_preset", env.cloudinaryUploadPreset);
  formData.set("folder", "qr-food/dishes");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.cloudinaryCloudName)}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || "Không thể upload ảnh lên Cloudinary.");
  }

  if (!data.secure_url) {
    throw new Error("Cloudinary không trả về secure_url.");
  }

  return data.secure_url;
}
