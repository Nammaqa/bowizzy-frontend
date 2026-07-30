/**
 * Cloudinary answers failures with a 4xx/5xx and an `error` body rather than a
 * `secure_url`. Without this guard the caller silently receives
 * `{ url: undefined }` and appears to "upload" an image that never existed.
 */
const readUploadResponse = async (res: Response) => {
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.secure_url) {
    throw new Error(
      data?.error?.message || `Cloudinary upload failed (${res.status})`
    );
  }

  return data;
};

export const uploadToCloudinary = async (file: File) => {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || undefined;
  const apiKey = (import.meta.env.VITE_CLOUDINARY_API_KEY as string) || undefined;
  const apiSecret = (import.meta.env.VITE_CLOUDINARY_API_SECRET as string) || undefined;
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || undefined;

  const sha1hex = async (str: string) => {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-1", enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = {
      return_delete_token: "true",
      timestamp,
    };

    const paramsString = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    const toSign = paramsString + apiSecret;
    const signature = await sha1hex(toSign);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("return_delete_token", "true");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await readUploadResponse(res);
    return {
      url: data.secure_url,
      publicId: data.public_id,
      deleteToken: data.delete_token,
    };
  }
  console.warn("Cloudinary API secret not found in client env — performing unsigned upload (no delete_token returned). Set VITE_CLOUDINARY_API_SECRET to enable signed uploads (insecure).");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });

  const data = await readUploadResponse(res);
  return {
    url: data.secure_url,
    publicId: data.public_id,
    deleteToken: data.delete_token || null,
  };
};
