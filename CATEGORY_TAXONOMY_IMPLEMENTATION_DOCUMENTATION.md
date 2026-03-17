# Category Taxonomy Implementation Documentation

## 1. Goal
Implement a standard ecommerce taxonomy like the shared image:

- `Category` -> `Subcategory` -> `Sub-subcategory` -> `Product`
- Optional attribute layer for filtering and product specification

This document is tailored to this repository:

- `clt-admin-dashboard` (admin authoring)
- `clt-perfume-backend` (API + Supabase integration)
- `clt-perfume-frontend` (storefront rendering)

---

## 2. Current Status In This Project

Already available:

- `categories` table with self-reference (`parent_id`) supports hierarchy.
- Products already store `category_id`.
- Navbar and mega menu already use top-level + child categories.
- Admin category form already supports parent selection.

Current gap:

- UI/logic is mostly optimized for 2 levels, not full tree UX.
- `Shop By Notes` is managed from `site_settings.navigation`, separate from taxonomy.
- Product form allows selecting category but does not enforce "leaf only" assignment.

---

## 3. Target Taxonomy Model

Recommended model for this project:

1. `Top Category` (L1): shown in navbar.
2. `Subcategory` (L2): shown inside mega menu.
3. `Sub-subcategory` (L3): shown in collection filters or nested menu panel.
4. `Product`: assigned to one leaf category (L2 or L3 leaf node).

Perfume example:

- `Men` (L1)
- `Perfume` (L2)
- `Oud` (L3)
- Product `Noir de Soir` assigned to `Oud`

---

## 4. Database Design (Supabase)

## 4.1 Categories Table

Keep using one table with parent-child relation:

- `id` UUID PK
- `name` TEXT
- `slug` TEXT UNIQUE
- `parent_id` UUID NULL REFERENCES `categories(id)` ON DELETE SET NULL
- `description`, `image_url`, `scent_notes` (already used in project)

Optional hardening columns:

- `sort_order` INT DEFAULT 0
- `is_active` BOOLEAN DEFAULT true

## 4.2 Product Assignment Rule

- `products.category_id` must point to a leaf category.
- Parent categories should not directly receive products unless intentionally treated as leaf.

## 4.3 Attributes Layer (Optional but Recommended)

If you want "attributes" from the image (like material/fit/length), add:

- `category_attribute_templates`
  - `id`, `category_id`, `name`, `type`, `is_required`, `options_json`
- `product_attribute_values`
  - `id`, `product_id`, `template_id`, `value_text`, `value_json`

For perfume, these can represent:

- concentration (`EDP`, `EDT`, `Parfum`)
- longevity (`6h`, `8h+`)
- occasion (`Office`, `Night`)
- season (`Summer`, `Winter`)

---

## 5. Backend API Behavior

## 5.1 Categories

Expose both flat and tree responses:

- Flat list: for simple dropdowns.
- Tree endpoint: for recursive UI (`children[]` nested).

Required operations:

- Create category with optional `parent_id`.
- Move category (change `parent_id`).
- Delete category safely.

Delete safety rules:

- Prevent delete if category has children or products, unless explicit "force move".
- Provide "move products to another category" workflow before delete.

## 5.2 Products

- Product create/update must validate selected `category_id`.
- Optional validation: enforce selected category is leaf node.
- Collection query should support:
  - Exact category
  - Include descendants (for L1/L2 landing pages)
  - Facet filters (best seller/new/attributes)

---

## 6. Admin Dashboard Behavior

## 6.1 Category Management

Create/edit flow:

1. Add category name + slug.
2. Choose parent (optional) from existing categories.
3. If no parent: category becomes navbar-level.
4. If parent selected: category appears under parent branch.

UI recommendations:

- Show hierarchy in picker as `Men > Perfume > Oud`.
- Add "level badge" and "child count" in category list.
- Disable selecting the same category as its own parent.

## 6.2 Product Form

Collection/category field must:

- Show full path labels: `Men > Perfume > Oud`.
- Prefer leaf categories first (or only allow leaf).
- Keep `Best Seller`, `New Arrival`, `Exclusive` as product flags (not taxonomy levels).

---

## 7. Frontend Behavior

## 7.1 Navbar + Mega Menu

- Navbar shows only L1 categories.
- Mega menu `Shop By Category` shows L2 links.
- If L2 has L3 children, show one of:
  - Flyout panel for L3
  - Expandable list in mega menu

## 7.2 Collection Pages

`/collections/[slug]` behavior:

- If slug is parent, show all descendant products.
- If `?sub=...`, filter to that branch.
- Keep smart links:
  - `best-seller` -> filter by `is_best_seller`
  - `new-arrivals` -> filter by `is_new`

## 7.3 Shop By Notes

Current project keeps notes in `site_settings.navigation`.
That is valid and can remain independent from taxonomy.

---

## 8. Recommended Rollout Plan

## Phase 1 (Immediate)

1. Keep current schema with `parent_id` and `scent_notes`.
2. Keep top-level navbar + child mega menu.
3. Enforce clean parent selection and slug consistency.

## Phase 2 (Tree UX)

1. Add tree API response in backend.
2. Add recursive category tree UI in admin.
3. Update product category picker to show full hierarchy path.

## Phase 3 (Advanced Ecommerce)

1. Add attribute templates by category.
2. Add attribute values per product.
3. Add frontend facet filters based on attributes.

---

## 9. Acceptance Criteria

Implementation is successful when:

1. Admin can create category depth up to at least 3 levels.
2. Product can be assigned to correct leaf and appears in expected collection.
3. Navbar and mega menu update automatically after taxonomy change.
4. Deleting/moving categories does not orphan products unexpectedly.
5. Smart links (`Best Seller`, `New Arrivals`) continue to work.

---

## 10. Example Taxonomy For This Project

- `Men` (L1)
  - `Perfume` (L2)
    - `Oud` (L3)
    - `Woody` (L3)
  - `Gift Sets` (L2)
- `Women` (L1)
  - `Perfume` (L2)
    - `Floral` (L3)
    - `Fruity` (L3)

Products are attached to leaves like `Oud`, `Woody`, `Floral`.

