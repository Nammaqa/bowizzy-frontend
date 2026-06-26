export const deleteFromCloudinary = async (
  deleteToken?: string | null,
  publicId?: string | null,
  resourceType: "image" | "raw" | "video" = "image"
) => {
  if (!deleteToken && !publicId) return false;

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "drwntqk7r";


  try {
    if (deleteToken) {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`;

      const body = new URLSearchParams();
      body.append("token", deleteToken);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Cloudinary delete_by_token failed:", txt);
      } else {
        const data = await res.json();
        if (data?.result === "ok" || !!data) return true;
      }
    }

    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
    if (!apiKey || !apiSecret || !publicId) return false;

    const sha1hex = async (str: string) => {
      const enc = new TextEncoder().encode(str);
      const buf = await crypto.subtle.digest("SHA-1", enc);
      const arr = Array.from(new Uint8Array(buf));
      return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sha1hex(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`);
    const body = new URLSearchParams();
    body.append("public_id", publicId);
    body.append("api_key", apiKey);
    body.append("timestamp", String(timestamp));
    body.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Cloudinary destroy failed:", txt);
      return false;
    }

    const data = await res.json();
    return data?.result === "ok" || data?.result === "not found";
  } catch (err) {
    console.error("deleteFromCloudinary error", err);
    return false;
  }
};
