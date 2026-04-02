export type ProductFormState = {
  id?: string
  name: string
  slug: string
  description: string
  price: string
  stock: string
  scent: string
  olfactive_family: string
  olfactive_signature: string
  concentration: string
  mood_use: string
  images: string
  tags: string
  top_notes: string
  heart_notes: string
  base_notes: string
  is_active: boolean
  is_new: boolean
  is_best_seller: boolean
  is_exclusive: boolean
  category_id: string
  ml: string
}

export type ProductViewFilter = "all" | "active" | "inactive" | "low_stock" | "featured"

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "",
  scent: "",
  olfactive_family: "",
  olfactive_signature: "",
  concentration: "",
  mood_use: "",
  images: "",
  tags: "",
  top_notes: "",
  heart_notes: "",
  base_notes: "",
  is_active: true,
  is_new: false,
  is_best_seller: false,
  is_exclusive: false,
  category_id: "",
  ml: "",
}

export function joinCsv(values?: string[]) {
  return (values || []).join(", ")
}

export function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}
