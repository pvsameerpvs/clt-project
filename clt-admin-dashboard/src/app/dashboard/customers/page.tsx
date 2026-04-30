"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminCustomer, getAdminCustomers } from "@/lib/admin-api"
import { toast } from "sonner"

function fullName(customer: AdminCustomer) {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim()
  return name || "Unnamed Customer"
}

function formatUtcDate(dateString: string | null) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "—"
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function spendingTier(totalSpent: number) {
  if (totalSpent >= 2500) return "VIP"
  if (totalSpent >= 1000) return "High"
  if (totalSpent >= 300) return "Medium"
  return "New"
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  async function loadCustomers() {
    try {
      setLoading(true)
      setCustomers(await getAdminCustomers())
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : "Unable to load customers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filteredCustomers = useMemo(() => {
    const text = query.trim().toLowerCase()
    return customers.filter((customer) => {
      const haystack = [
        fullName(customer),
        customer.email || "",
        customer.phone || "",
        customer.role || "",
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = !text || haystack.includes(text)
      const matchesRole = roleFilter === "all" || customer.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [customers, query, roleFilter])

  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const withOrders = customers.filter((customer) => customer.orderCount > 0).length
    const totalSpent = customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0)
    const averageSpend = withOrders > 0 ? totalSpent / withOrders : 0
    const vipCustomers = customers.filter((customer) => Number(customer.totalSpent || 0) >= 2500).length

    return {
      totalCustomers,
      withOrders,
      totalSpent,
      averageSpend,
      vipCustomers,
    }
  }, [customers])

  const goToCustomerDetails = (customerId: string) => {
    router.push(`/dashboard/customers/${encodeURIComponent(customerId)}`)
  }

  return (
    <div className="customers-page">
      <header className="customers-header">
        <div>
          <h1>Customers</h1>
          <p>Monitor customer profiles, spending behavior, and order engagement.</p>
        </div>
        <button className="ghost-btn" onClick={loadCustomers} type="button">
          Refresh
        </button>
      </header>


      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Customers</p>
          <h3>{stats.totalCustomers}</h3>
        </article>
        <article className="stat-card">
          <p>Customers With Orders</p>
          <h3>{stats.withOrders}</h3>
        </article>
        <article className="stat-card">
          <p>Total Customer Spend</p>
          <h3>AED {Math.round(stats.totalSpent).toLocaleString()}</h3>
        </article>
        <article className="stat-card">
          <p>Avg Spend (buyers)</p>
          <h3>AED {Math.round(stats.averageSpend).toLocaleString()}</h3>
        </article>
      </section>

      <section className="panel controls">
        <input
          className="search"
          placeholder="Search by name, email, phone, role"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="role-filter"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">All roles</option>
          <option value="customer">customer</option>
          <option value="admin">admin</option>
        </select>
      </section>

      <section className="panel table-panel">
        <div className="table-topline">
          <span>{filteredCustomers.length} shown</span>
          <span>{stats.vipCustomers} VIP customers</span>
        </div>

        {loading ? (
          <div className="empty">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty">No customers match your filters.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Tier</th>
                  <th>Last Order</th>
                  <th>Joined</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const name = fullName(customer)
                  const spent = Number(customer.totalSpent || 0)
                  const tier = spendingTier(spent)
                  return (
                    <tr
                      key={customer.id}
                      className="clickable-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => goToCustomerDetails(customer.id)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return
                        event.preventDefault()
                        goToCustomerDetails(customer.id)
                      }}
                    >
                      <td>
                        <div className="customer-id-block">
                          <div className="avatar">{name[0]?.toUpperCase() || "C"}</div>
                          <div>
                            <div className="name">{name}</div>
                            <div className="sub">{customer.email || "No email"}</div>
                            <div className="sub id">{customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role ${customer.role === "admin" ? "admin" : "customer"}`}>
                          {customer.role}
                        </span>
                      </td>
                      <td className="sub">{customer.phone || "—"}</td>
                      <td className="name">{customer.orderCount}</td>
                      <td className="name">AED {spent.toLocaleString()}</td>
                      <td>
                        <span className={`tier ${tier.toLowerCase()}`}>{tier}</span>
                      </td>
                      <td className="sub">{formatUtcDate(customer.lastOrderAt)}</td>
                      <td className="sub">{formatUtcDate(customer.createdAt)}</td>
                      <td>
                        <Link
                          href={`/dashboard/customers/${encodeURIComponent(customer.id)}`}
                          className="details-link"
                          onClick={(event) => event.stopPropagation()}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .customers-page {
          display: grid;
          gap: 14px;
        }
        .customers-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .customers-header h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: -0.02em;
        }
        .customers-header p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
        }
        .error-box {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .stat-card {
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 12px;
          padding: 12px;
        }
        .stat-card p {
          margin: 0;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .stat-card h3 {
          margin: 8px 0 0;
          font-size: 22px;
          letter-spacing: -0.02em;
        }
        .panel {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
        }
        .controls {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 10px;
          padding: 12px;
        }
        .search,
        .role-filter {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 14px;
          background: #fff;
        }
        .table-panel {
          padding: 12px;
        }
        .table-topline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          color: #6b7280;
          font-size: 12px;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          min-width: 1120px;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        td {
          padding: 12px 8px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          vertical-align: top;
        }
        .clickable-row {
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .clickable-row:hover {
          background: #fafafa;
        }
        .clickable-row:focus-visible {
          outline: 2px solid #111827;
          outline-offset: -2px;
        }
        .customer-id-block {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 10px;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #111;
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 700;
        }
        .name {
          font-weight: 600;
        }
        .sub {
          color: #6b7280;
          font-size: 12px;
          margin-top: 2px;
          word-break: break-word;
        }
        .sub.id {
          max-width: 320px;
        }
        .details-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #111827;
          text-decoration: none;
          background: #fff;
        }
        .details-link:hover {
          border-color: #111827;
        }
        .role,
        .tier {
          display: inline-block;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .role.customer {
          background: #f3f4f6;
          color: #111827;
        }
        .role.admin {
          background: #eef2ff;
          color: #4338ca;
        }
        .tier.new {
          background: #f3f4f6;
          color: #374151;
        }
        .tier.medium {
          background: #ecfeff;
          color: #155e75;
        }
        .tier.high {
          background: #fff7ed;
          color: #9a3412;
        }
        .tier.vip {
          background: #fef3c7;
          color: #92400e;
        }
        .empty {
          border: 1px dashed #e5e7eb;
          border-radius: 12px;
          text-align: center;
          padding: 32px;
          color: #6b7280;
          font-size: 14px;
        }
        .ghost-btn {
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          cursor: pointer;
        }
        @media (max-width: 980px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .controls {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .customers-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
