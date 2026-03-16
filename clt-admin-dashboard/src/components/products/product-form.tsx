"use client"

import { Dispatch, FormEvent, SetStateAction } from "react"
import { ImageUpload } from "@/components/image-upload"
import { ProductFormState, joinCsv, splitCsv } from "@/components/products/types"
import { Category } from "@/lib/admin-api"

interface ProductFormProps {
  form: ProductFormState
  setForm: Dispatch<SetStateAction<ProductFormState>>
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onClear: () => void
  saving: boolean
  categories: Category[]
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function ProductForm({ form, setForm, onSubmit, onClear, saving, categories }: ProductFormProps) {
  const isEditing = Boolean(form.id)
  const generatedSlug = slugify(form.name)

  return (
    <form className="form-shell" onSubmit={onSubmit}>
      <div className="panel-head">
        <div>
          <h2>{isEditing ? "Edit Product" : "Create Product"}</h2>
          <p>{isEditing ? "Update details and publish changes." : "Add a new catalog item with frontend-ready metadata."}</p>
        </div>
        {isEditing && (
          <button className="ghost-btn" onClick={onClear} type="button">
            New Product
          </button>
        )}
      </div>

      <section className="block">
        <h3>Basic Details</h3>
        <div className="field-grid">
          <div className="form-section full">
            <label>Product Name</label>
            <input
              className="field-input"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Midnight Smock"
            />
          </div>

          <div className="form-section full">
            <label>Collection / Category</label>
            <select 
              className="field-input cursor-pointer"
              value={form.category_id}
              onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
            >
              <option value="">Uncategorized</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-section full">
            <label>Slug</label>
            <div className="slug-row">
              <input
                className="field-input"
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="midnight-smock"
              />
              <button
                type="button"
                className="inline-btn"
                disabled={!generatedSlug}
                onClick={() => setForm((prev) => ({ ...prev, slug: generatedSlug }))}
              >
                Generate
              </button>
            </div>
            <p className="hint">Frontend URL: /product/{form.slug || generatedSlug || "your-slug"}</p>
          </div>

          <div className="form-section full">
            <label>Description</label>
            <textarea
              className="field-input field-textarea"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Write product description..."
            />
          </div>
        </div>
      </section>

      <section className="block">
        <h3>Commercial</h3>
        <div className="field-grid two">
          <div className="form-section">
            <label>Price (AED)</label>
            <input
              className="field-input"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            />
          </div>

          <div className="form-section">
            <label>Stock</label>
            <input
              className="field-input"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="block">
        <h3>Fragrance Profile</h3>
        <div className="field-grid two">
          <div className="form-section full">
            <label>Scent Profile</label>
            <input
              className="field-input"
              value={form.scent}
              onChange={(event) => setForm((prev) => ({ ...prev, scent: event.target.value }))}
              placeholder="Woody & Spicy"
            />
          </div>

          <div className="form-section full">
            <label>Tags (comma separated)</label>
            <input
              className="field-input"
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="night, luxury, oud"
            />
          </div>

          <div className="form-section">
            <label>Top Notes</label>
            <input
              className="field-input"
              value={form.top_notes}
              onChange={(event) => setForm((prev) => ({ ...prev, top_notes: event.target.value }))}
              placeholder="Bergamot, Lavender"
            />
          </div>

          <div className="form-section">
            <label>Heart Notes</label>
            <input
              className="field-input"
              value={form.heart_notes}
              onChange={(event) => setForm((prev) => ({ ...prev, heart_notes: event.target.value }))}
              placeholder="Rose, Geranium"
            />
          </div>

          <div className="form-section full">
            <label>Base Notes</label>
            <input
              className="field-input"
              value={form.base_notes}
              onChange={(event) => setForm((prev) => ({ ...prev, base_notes: event.target.value }))}
              placeholder="Musk, Amber"
            />
          </div>
        </div>
      </section>

      <section className="block">
        <h3>Media</h3>
        <div className="form-section">
          <label>Product Images</label>
          <ImageUpload
            images={splitCsv(form.images)}
            onUpload={(url) =>
              setForm((prev) => ({
                ...prev,
                images: joinCsv([...splitCsv(prev.images), url]),
              }))
            }
            onRemove={(url) =>
              setForm((prev) => ({
                ...prev,
                images: joinCsv(splitCsv(prev.images).filter((imageUrl) => imageUrl !== url)),
              }))
            }
          />
        </div>
      </section>

      <section className="block">
        <h3>Visibility & Labels</h3>
        <div className="flags-grid">
          <label className="flag-item">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            <span>Active</span>
          </label>
          <label className="flag-item">
            <input
              type="checkbox"
              checked={form.is_new}
              onChange={(event) => setForm((prev) => ({ ...prev, is_new: event.target.checked }))}
            />
            <span>New Arrival</span>
          </label>
          <label className="flag-item">
            <input
              type="checkbox"
              checked={form.is_best_seller}
              onChange={(event) => setForm((prev) => ({ ...prev, is_best_seller: event.target.checked }))}
            />
            <span>Best Seller</span>
          </label>
          <label className="flag-item">
            <input
              type="checkbox"
              checked={form.is_exclusive}
              onChange={(event) => setForm((prev) => ({ ...prev, is_exclusive: event.target.checked }))}
            />
            <span>Exclusive</span>
          </label>
        </div>
      </section>

      <div className="actions">
        <button className="ghost-btn" onClick={onClear} type="button" disabled={saving}>
          Clear
        </button>
        <button className="submit-btn" disabled={saving} type="submit">
          {saving ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </button>
      </div>

      <style jsx>{`
        .form-shell {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
          display: grid;
          gap: 12px;
        }
        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .panel-head h2 {
          margin: 0;
          font-size: 18px;
        }
        .panel-head p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.45;
        }
        .ghost-btn,
        .submit-btn,
        .inline-btn {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ghost-btn:hover,
        .inline-btn:hover {
          background: #f9fafb;
        }
        .ghost-btn:disabled,
        .submit-btn:disabled,
        .inline-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .submit-btn {
          border-color: #111;
          background: #111;
          color: #fff;
        }
        .submit-btn:hover {
          background: #000;
        }
        .block {
          border: 1px solid #f3f4f6;
          background: #fcfcfc;
          border-radius: 12px;
          padding: 12px;
          display: grid;
          gap: 10px;
        }
        .block h3 {
          margin: 0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #6b7280;
        }
        .field-grid {
          display: grid;
          gap: 10px;
        }
        .field-grid.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .form-section {
          display: grid;
          gap: 5px;
        }
        .full {
          grid-column: 1 / -1;
        }
        .form-section label {
          font-size: 10px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .field-input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 9px 10px;
          font-size: 13px;
          background: #fff;
        }
        .field-input:focus {
          outline: none;
          border-color: #111;
          box-shadow: 0 0 0 2px rgba(17, 17, 17, 0.08);
        }
        .field-textarea {
          min-height: 84px;
          resize: vertical;
        }
        .slug-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }
        .hint {
          margin: 0;
          color: #6b7280;
          font-size: 11px;
        }
        .flags-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .flag-item {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          background: #fff;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-top: 4px;
        }
        @media (max-width: 900px) {
          .field-grid.two,
          .flags-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  )
}
