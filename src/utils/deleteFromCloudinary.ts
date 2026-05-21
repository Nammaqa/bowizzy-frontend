export const deleteFromCloudinary = async (deleteToken?: string) => {
  if (!deleteToken) return false;

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "drwntqk7r";


  try {
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
      return false;
    }

    const data = await res.json();
    return data?.result === "ok" || !!data;
  } catch (err) {
    console.error("deleteFromCloudinary error", err);
    return false;
  }
};
