"use client"

import { AdminProduct } from "@/lib/admin-api"
import { ProductViewFilter } from "@/components/products/types"

interface ProductListProps {
  products: AdminProduct[]
  loading: boolean
  selectedProductId: string | null
  onSelect: (product: AdminProduct) => void
  onEdit: (product: AdminProduct) => void
  onDelete: (productId: string) => void
  query: string
  setQuery: (query: string) => void
  viewFilter: ProductViewFilter
  setViewFilter: (filter: ProductViewFilter) => void
}

const FILTER_ITEMS: Array<{ value: ProductViewFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "low_stock", label: "Low Stock" },
  { value: "featured", label: "Featured" },
]

function money(value: number) {
  return Number(value || 0).toLocaleString()
}

function statusLabel(product: AdminProduct) {
  if (product.is_active === false) return "Inactive"
  if (Number(product.stock || 0) < 10) return "Low stock"
  return "Active"
}

export function ProductList({
  products,
  loading,
  selectedProductId,
  onSelect,
  onEdit,
  onDelete,
  query,
  setQuery,
  viewFilter,
  setViewFilter,
}: ProductListProps) {
  return (
    <section className="list-shell">
      <div className="top-row">
        <div>
          <h2>Catalog</h2>
          <p>Click product to preview. Use Edit for quick updates.</p>
        </div>
        <span className="result-count">{products.length} items</span>
      </div>

      <div className="controls-row">
        <input
          className="search-input"
          placeholder="Search by name, slug, scent, tag"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="button" className="clear-search" onClick={() => setQuery("")} disabled={!query.trim()}>
          Clear
        </button>
      </div>

      <div className="filter-row">
        {FILTER_ITEMS.map((item) => (
          <button
            type="button"
            key={item.value}
            className={`filter-chip ${viewFilter === item.value ? "active" : ""}`}
            onClick={() => setViewFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">Loading catalog...</div>
      ) : products.length === 0 ? (
        <div className="empty empty-dashed">No products found matching your search or filter.</div>
      ) : (
        <>
          <div className="mobile-list">
            {products.map((product) => {
              const isSelected = selectedProductId === product.id
              return (
                <article
                  key={product.id}
                  className={`mobile-card ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelect(product)}
                >
                  <div className="mobile-head">
                    <div className="thumb-wrap">
                      {product.images?.[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={product.images[0]} alt={product.name} className="thumb" />
                      ) : (
                        <div className="thumb placeholder">No image</div>
                      )}
                    </div>
                    <div>
                      <h3>{product.name}</h3>
                      <p>/{product.slug}</p>
                      <p className="small">{product.scent || "No scent profile"}</p>
                    </div>
                  </div>

                  <div className="mobile-meta">
                    <span>AED {money(product.price || 0)}</span>
                    <span>Stock: {product.stock || 0}</span>
                    {product.ml && <span>{product.ml}</span>}
                    <span>{statusLabel(product)}</span>
                  </div>

                  <div className="mobile-badges">
                    {product.is_new && <span className="badge bg-green-100 text-green-700">NEW</span>}
                    {product.is_best_seller && <span className="badge bg-amber-100 text-amber-700">BEST</span>}
                    {product.is_exclusive && <span className="badge bg-neutral-900 text-white">EXCL</span>}
                  </div>

                  <div className="mobile-actions">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(product)
                      }}
                      className="link-btn"
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onDelete(product.id)
                      }}
                      className="link-btn danger"
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="desktop-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Badges</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>ml</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isSelected = selectedProductId === product.id
                  return (
                    <tr
                      key={product.id}
                      className={isSelected ? "selected-row" : ""}
                      onClick={() => onSelect(product)}
                    >
                      <td>
                        <div className="product-cell">
                          <div className="thumb-wrap">
                            {product.images?.[0] ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={product.images[0]} alt={product.name} className="thumb" />
                            ) : (
                              <div className="thumb placeholder">No image</div>
                            )}
                          </div>
                          <div>
                            <div className="name">{product.name}</div>
                            <div className="slug">/{product.slug}</div>
                            <div className="scent">{product.scent || "No profile"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="badges-wrap">
                          {product.is_new && <span className="badge bg-green-100 text-green-700">NEW</span>}
                          {product.is_best_seller && <span className="badge bg-amber-100 text-amber-700">BEST</span>}
                          {product.is_exclusive && <span className="badge bg-neutral-900 text-white">EXCL</span>}
                          {product.is_active === false && <span className="badge bg-red-100 text-red-700">OFF</span>}
                        </div>
                      </td>
                      <td className="value">AED {money(product.price || 0)}</td>
                      <td>
                        <span
                          className={`stock-chip ${
                            Number(product.stock || 0) < 10 ? "danger-stock" : "normal-stock"
                          }`}
                        >
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className="value">{statusLabel(product)}</td>
                      <td className="value">{product.ml || "-"}</td>
                      <td>
                        <div className="action-wrap">
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              onEdit(product)
                            }}
                            className="link-btn"
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              onDelete(product.id)
                            }}
                            className="link-btn danger"
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx>{`
        .list-shell {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
          display: grid;
          gap: 12px;
        }
        .top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .top-row h2 {
          margin: 0;
          font-size: 20px;
        }
        .top-row p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 12px;
        }
        .result-count {
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          color: #4b5563;
          background: #fafafa;
        }
        .controls-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }
        .search-input,
        .clear-search {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 13px;
          background: #fff;
          padding: 8px 10px;
        }
        .search-input:focus {
          outline: none;
          border-color: #111;
          box-shadow: 0 0 0 2px rgba(17, 17, 17, 0.08);
        }
        .clear-search {
          font-weight: 600;
          cursor: pointer;
        }
        .clear-search:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .filter-chip {
          border: 1px solid #d1d5db;
          background: #fff;
          color: #374151;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
        }
        .filter-chip.active {
          border-color: #111;
          background: #111;
          color: #fff;
        }
        .empty {
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
          padding: 28px 10px;
        }
        .empty-dashed {
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
        }
        .mobile-list {
          display: grid;
          gap: 8px;
        }
        .mobile-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px;
          display: grid;
          gap: 8px;
          cursor: pointer;
          background: #fff;
        }
        .mobile-card.selected {
          border-color: #111;
          box-shadow: 0 0 0 1px #111;
        }
        .mobile-head {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 10px;
        }
        .mobile-head h3 {
          margin: 0;
          font-size: 14px;
        }
        .mobile-head p {
          margin: 2px 0 0;
          font-size: 11px;
          color: #6b7280;
          word-break: break-all;
        }
        .mobile-head .small {
          font-style: italic;
          color: #4b5563;
        }
        .mobile-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .mobile-meta span {
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          color: #374151;
        }
        .mobile-badges,
        .badges-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .badge {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .mobile-actions {
          display: flex;
          gap: 10px;
        }
        .link-btn {
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 700;
          color: #111;
          padding: 0;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .link-btn.danger {
          color: #dc2626;
        }
        .desktop-table {
          display: none;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 880px;
        }
        th {
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #6b7280;
          padding: 0 10px 10px 0;
        }
        td {
          border-bottom: 1px solid #f3f4f6;
          padding: 12px 10px 12px 0;
          vertical-align: top;
        }
        tbody tr {
          cursor: pointer;
          transition: background 0.15s ease;
        }
        tbody tr:hover {
          background: #fafafa;
        }
        .selected-row {
          background: #f5f5f5;
        }
        .product-cell {
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 10px;
          align-items: start;
        }
        .thumb-wrap {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          background: #f3f4f6;
        }
        .thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          color: #9ca3af;
          font-size: 10px;
        }
        .thumb.placeholder {
          display: grid;
          place-items: center;
          padding: 4px;
          text-align: center;
        }
        .name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }
        .slug {
          font-size: 11px;
          color: #9ca3af;
          font-family: monospace;
          margin-top: 2px;
          word-break: break-all;
        }
        .scent {
          font-size: 11px;
          color: #4b5563;
          margin-top: 4px;
          font-style: italic;
        }
        .value {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }
        .stock-chip {
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .normal-stock {
          background: #f3f4f6;
          color: #374151;
        }
        .danger-stock {
          background: #fef2f2;
          color: #dc2626;
        }
        .action-wrap {
          display: flex;
          gap: 10px;
        }
        @media (min-width: 900px) {
          .mobile-list {
            display: none;
          }
          .desktop-table {
            display: block;
          }
        }
      `}</style>
    </section>
  )
}
