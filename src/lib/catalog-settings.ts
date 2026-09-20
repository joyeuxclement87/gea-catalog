import { createServerClient } from "./supabase";
import type { CatalogueSettings } from "./supabase-types";

// Publication defaults. Used as a fallback when Supabase settings are not
// configured yet (or the settings table is missing), so the catalogue always
// renders with real, consistent contact information.
export const CATALOGUE_DEFAULTS = {
  website_url: "https://www.globalengineeringagency.com",
  contact_phone: "+250 788 632 620",
  contact_email: "info@globalengineeringagency.com",
  contact_address: "Umukindo House, ground floor, 5 doors from BK",
  closing_message:
    "For product information, technical details, and quotations, contact Global Engineering Agency directly. This catalogue is for product reference; pricing and ordering are handled separately.",
  cover_image_url: "/images/cover/cover.jpg",
  cover_image_path: null,
};

const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function getCatalogueSettings(): Promise<CatalogueSettings> {
  const defaults: CatalogueSettings = {
    id: "default",
    ...CATALOGUE_DEFAULTS,
    updated_at: "",
  };

  if (!hasSupabase) return defaults;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("catalogue_settings").select("*").limit(1).maybeSingle();
    if (error || !data) return defaults;

    return {
      id: data.id ?? defaults.id,
      website_url: data.website_url || defaults.website_url,
      contact_phone: data.contact_phone || defaults.contact_phone,
      contact_email: data.contact_email || defaults.contact_email,
      contact_address: data.contact_address || defaults.contact_address,
      closing_message: data.closing_message || defaults.closing_message,
      cover_image_url: data.cover_image_url || defaults.cover_image_url,
      cover_image_path: data.cover_image_path ?? null,
      updated_at: data.updated_at ?? "",
    };
  } catch {
    return defaults;
  }
}