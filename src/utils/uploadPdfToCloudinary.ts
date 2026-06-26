export const uploadPdfToCloudinary = async (file: File) => {
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

  // Cloudinary raw upload endpoint (for non-image assets like PDF)
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

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

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      deleteToken: data.delete_token,
    };
  }

  // Unsigned upload fallback
  const fd = new FormData();
  fd.append("file", file);
  if (uploadPreset) fd.append("upload_preset", uploadPreset);
  fd.append("return_delete_token", "true");

  const res = await fetch(endpoint, {
    method: "POST",
    body: fd,
  });

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    deleteToken: data.delete_token || null,
  };
};
