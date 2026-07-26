import { createClient } from "@/lib/supabase/client";

const BUCKET = "template_images";
const MAX_BYTES = 5 * 1024 * 1024;

export interface UploadTemplateImageResult {
  publicUrl: string;
  path: string;
}

export async function uploadTemplateImage(
  file: File,
): Promise<UploadTemplateImageResult> {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new Error("Not signed in.");
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr || !profile?.account_id) {
    throw new Error("Could not resolve your account.");
  }

  const hasExt = /\.[^.]+$/.test(file.name);
  const ext = hasExt ? file.name.split(".").pop()!.toLowerCase() : "png";
  const safeBase =
    file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 40) || "image";
  const path = `account-${profile.account_id}/${Date.now()}-${safeBase}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
  if (upErr) throw new Error(upErr.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { publicUrl, path };
}

export async function listTemplateImages(): Promise<
  { publicUrl: string; path: string; name: string; created_at: string }[]
> {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new Error("Not signed in.");
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr || !profile?.account_id) {
    throw new Error("Could not resolve your account.");
  }

  const prefix = `account-${profile.account_id}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, {
      sortBy: { column: "created_at", order: "desc" },
    });
  if (error) throw new Error(error.message);

  return (data || []).map((item) => {
    const objectPath = `${prefix}/${item.name}`;
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return {
      publicUrl,
      path: objectPath,
      name: item.name,
      created_at: item.created_at ?? '',
    };
  });
}

export async function deleteTemplateImage(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export { BUCKET, MAX_BYTES };
