"use client"

export interface ProductPreviewData {
  id?: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  scent: string
  images: string[]
  tags: string[]
  top_notes: string[]
  heart_notes: string[]
  base_notes: string[]
  is_active: boolean
  is_new: boolean
  is_best_seller: boolean
  is_exclusive: boolean
  ml?: string
  olfactive_family?: string
  olfactive_signature?: string
  concentration?: string
  mood_use?: string
}

interface ProductPreviewProps {
  product: ProductPreviewData | null
  isDraft: boolean
}

const STOREFRONT_BASE_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000"

function money(value: number) {
  return Number(value || 0).toLocaleString()
}

function takeFirst(items: string[], count: number) {
  return items.slice(0, count)
}

export function ProductPreview({ product, isDraft }: ProductPreviewProps) {
  if (!product) {
    return (
      <section className="preview-panel">
        <div className="empty">Select a product from the catalog or start filling the form to preview it.</div>

        <style jsx>{`
          .preview-panel {
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            background: #fff;
            padding: 14px;
          }
          .empty {
            border: 2px dashed #e5e7eb;
            border-radius: 12px;
            padding: 32px 16px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
          }
        `}</style>
      </section>
    )
  }

  const previewUrl = product.slug ? `${STOREFRONT_BASE_URL}/product/${product.slug}` : STOREFRONT_BASE_URL
  const topNotes = takeFirst(product.top_notes, 3)
  const heartNotes = takeFirst(product.heart_notes, 3)
  const baseNotes = takeFirst(product.base_notes, 3)

  return (
    <section className="preview-panel">
      <div className="panel-head">
        <div>
          <p className="kicker">Storefront Preview</p>
          <h3>How this product looks in frontend</h3>
        </div>
        {isDraft ? <span className="draft-chip">Draft</span> : <span className="live-chip">Saved</span>}
      </div>

      <article className="card-mock group">
        <div className="media">
          {product.images[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.images[0]} alt={product.name} className="primary-image" />
          ) : (
            <div className="placeholder">No Image</div>
          )}

          <div className="badges">
            {product.is_new && <span className="badge light">New Arrival</span>}
            {product.is_best_seller && <span className="badge amber">Best Seller</span>}
            {product.is_exclusive && <span className="badge dark">Exclusive</span>}
          </div>

          <button className="wish" type="button" aria-label="Preview wishlist button">
            ♡
          </button>

          <div className="cta-wrap">
            <button className="cta" type="button">Add to Bag </button>
            {/* - AED {money(product.price)} */}
          </div>
        </div>

        <div className="meta">
          <div className="meta-head">
            <div>
              <h4>{product.name || "Untitled Fragrance"}</h4>
              <p>
                {product.scent || "Scent profile not set"}
                {product.ml && ` • ${product.ml}`}
              </p>
            </div>
            <span className="price">AED {money(product.price)}</span>
          </div>
          <p className="description">{product.description || "No product description yet."}</p>
        </div>
      </article>

      <div className="meta-grid">
        <div className="meta-box">
          <p>Stock</p>
          <h5>{product.stock}</h5>
        </div>
        <div className="meta-box">
          <p>Status</p>
          <h5>{product.is_active ? "Active" : "Inactive"}</h5>
        </div>
        <div className="meta-box">
          <p>Slug</p>
          <h5>/{product.slug || "draft-slug"}</h5>
        </div>
      </div>

      <div className="notes-grid">
        <div>
          <p>Top Notes</p>
          <div>{topNotes.length ? topNotes.join(", ") : "-"}</div>
        </div>
        <div>
          <p>Heart Notes</p>
          <div>{heartNotes.length ? heartNotes.join(", ") : "-"}</div>
        </div>
        <div>
          <p>Base Notes</p>
          <div>{baseNotes.length ? baseNotes.join(", ") : "-"}</div>
        </div>
      </div>

      {product.tags.length > 0 && (
        <div className="tags">
          {product.tags.slice(0, 8).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      <a href={previewUrl} target="_blank" rel="noreferrer" className="open-link">
        Open in frontend
      </a>

      <style jsx>{`
        .preview-panel {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
          display: grid;
          gap: 12px;
          position: sticky;
          top: 20px;
        }
        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .kicker {
          margin: 0;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
        }
        .panel-head h3 {
          margin: 4px 0 0;
          font-size: 16px;
        }
        .draft-chip,
        .live-chip {
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
        }
        .draft-chip {
          border: 1px solid #f59e0b;
          color: #92400e;
          background: #fffbeb;
        }
        .live-chip {
          border: 1px solid #bbf7d0;
          color: #166534;
          background: #f0fdf4;
        }
        .card-mock {
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          padding: 10px;
          background: #fff;
        }
        .media {
          position: relative;
          aspect-ratio: 4 / 5;
          border-radius: 10px;
          overflow: hidden;
          background: #f5f5f5;
        }
        .primary-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #9ca3af;
          font-size: 13px;
          background: linear-gradient(145deg, #fafafa, #f0f0f0);
        }
        .badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: grid;
          gap: 4px;
          z-index: 2;
        }
        .badge {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
          padding: 4px 8px;
        }
        .badge.light {
          background: #fff;
          color: #111;
        }
        .badge.amber {
          background: #f59e0b;
          color: #fff;
        }
        .badge.dark {
          background: #111;
          color: #fff;
        }
        .wish {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #111;
          cursor: default;
          z-index: 2;
        }
        .cta-wrap {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 10px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
        }
        .cta {
          width: 100%;
          border: none;
          background: #fff;
          color: #111;
          border-radius: 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          padding: 10px;
        }
        .meta {
          display: grid;
          gap: 8px;
          padding: 10px 4px 4px;
        }
        .meta-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .meta h4 {
          margin: 0;
          font-size: 20px;
          line-height: 1;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 500;
        }
        .meta p {
          margin: 4px 0 0;
          font-size: 11px;
          color: #6b7280;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .price {
          font-size: 13px;
          font-weight: 600;
          color: #111;
        }
        .description {
          margin: 0;
          font-size: 12px;
          color: #4b5563;
          line-height: 1.5;
          text-transform: none;
          letter-spacing: normal;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .meta-box {
          border: 1px solid #f3f4f6;
          border-radius: 10px;
          padding: 8px;
          background: #fafafa;
        }
        .meta-box p {
          margin: 0;
          color: #6b7280;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .meta-box h5 {
          margin: 6px 0 0;
          font-size: 13px;
          line-height: 1.3;
          word-break: break-word;
        }
        .notes-grid {
          display: grid;
          gap: 6px;
        }
        .notes-grid p {
          margin: 0;
          color: #6b7280;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .notes-grid div {
          color: #111;
          font-size: 13px;
          line-height: 1.4;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tags span {
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          color: #4b5563;
          background: #fff;
        }
        .open-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #111;
          color: #111;
          border-radius: 10px;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .open-link:hover {
          background: #111;
          color: #fff;
        }
      `}</style>
    </section>
  )
}
