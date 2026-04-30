"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft, RefreshCcw, ExternalLink, MessageSquare } from "lucide-react"
import { getAdminReturnRequests, AdminReturnRequest, updateAdminReturnRequestStatus } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function ReturnsPage() {
  const [returns, setReturns] = useState<AdminReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Rejection Modal State
  const [rejectingRequest, setRejectingRequest] = useState<AdminReturnRequest | null>(null)
  const [rejectionMessage, setRejectionMessage] = useState("")

  const stats = {
    pending: returns.filter(r => !r.status || r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length
  }

  async function loadReturns() {
    try {
      setLoading(true)
      const data = await getAdminReturnRequests()
      setReturns(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load returns")
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(id: string, status: 'approved' | 'rejected', message?: string) {
    try {
      setProcessingId(id)
      await updateAdminReturnRequestStatus(id, status, message)
      setRejectingRequest(null)
      setRejectionMessage("")
      toast.success(`Request ${status === 'approved' ? 'approved' : 'rejected'}`)
      await loadReturns() // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setProcessingId(null)
    }
  }

  useEffect(() => {
    loadReturns()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="text-sm font-medium text-neutral-500 italic">Synchronizing refund requests...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard" className="text-neutral-400 hover:text-black transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Management</span>
          </div>
          <h1 className="text-4xl font-serif text-neutral-900 tracking-tight">Returns Studio</h1>
          <p className="mt-1 text-sm text-neutral-500 font-light italic">
            Process refunds and manage inventory restocks.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            onClick={loadReturns} 
            variant="outline" 
            className="rounded-full gap-2 border-neutral-200 hover:bg-neutral-50 h-10"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Sync Studio
          </Button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-neutral-100 bg-neutral-50/50">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Pending Review</p>
            <p className="text-3xl font-serif text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-100 bg-neutral-50/50">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Approved Refunds</p>
            <p className="text-3xl font-serif text-emerald-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-100 bg-neutral-50/50">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Settled/Rejected</p>
            <p className="text-3xl font-serif text-neutral-900">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {returns.length === 0 ? (
        <Card className="border-neutral-200 border-dashed bg-neutral-50/50">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-neutral-100 p-4">
              <RefreshCcw className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-serif text-neutral-900">All Quiet in the Studio</h3>
            <p className="mt-2 text-sm text-neutral-500 max-w-xs">
              There are currently no active return requests to process.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Request Timeline</h3>
          </div>
          
          {returns.map((request) => {
            return (
              <Card key={request.id} className="border-neutral-100 overflow-hidden group hover:shadow-xl hover:shadow-neutral-100/50 transition-all duration-500 border-l-4 border-l-amber-400">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Customer Block */}
                    <div className="w-full lg:w-72 p-8 border-b lg:border-b-0 lg:border-r border-neutral-50 bg-neutral-50/20">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Customer</p>
                          <p className="font-medium text-neutral-900 leading-tight">
                            {request.order?.profile ? `${request.order.profile.first_name || ''} ${request.order.profile.last_name || ''}`.trim() : "Guest Customer"}
                          </p>
                          <p className="text-xs text-neutral-500 italic mt-1 break-all">
                            {request.order?.shipping_address?.contact_email || request.order?.profile?.email || "No Contact Email"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Order</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-neutral-900">#{request.order?.order_number}</p>
                            <Link 
                              href={`/dashboard/orders/${request.order_id}`}
                              className="bg-black text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
                            >
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">AED {request.order?.total}</span>
                            <span className="h-1 w-1 rounded-full bg-neutral-300" />
                            <span className="text-[10px] font-medium text-neutral-400 capitalize">{request.order?.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message & Reason Block */}
                    <div className="flex-1 p-8 relative">
                      <div className="absolute top-8 right-8 pointer-events-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                        <MessageSquare className="h-32 w-32" />
                      </div>
                      
                      <div className="relative h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Reason for Return</p>
                              <h4 className="text-xl font-serif text-neutral-900">{request.reason}</h4>
                            </div>
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              request.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                              request.status === 'rejected' ? "bg-red-50 text-red-600" :
                              "bg-amber-50 text-amber-600"
                            )}>
                              {request.status || 'pending review'}
                            </span>
                          </div>
                          
                          {(request.message || request.status === 'rejected') && (
                            <div className="rounded-2xl bg-neutral-50/50 p-5 border border-neutral-100/50 mt-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Rejection Reason</p>
                              <p className="text-sm text-neutral-700 leading-relaxed italic font-light">
                                &quot;{request.message || "No specific reason provided by management."}&quot;
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-8">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center">
                              <RefreshCcw className="h-3.5 w-3.5 text-neutral-400" />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Logged On</p>
                              <p className="text-xs text-neutral-600 font-medium">
                                {new Date(request.created_at).toLocaleDateString(undefined, { 
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="sm:ml-auto flex gap-2">
                             <Button 
                               variant="ghost" 
                               className="text-[10px] uppercase tracking-widest font-bold h-10 px-6 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                               onClick={() => setRejectingRequest(request)}
                               disabled={processingId === request.id || (!!request.status && request.status !== 'pending')}
                             >
                               Reject Request
                             </Button>
                             <Button 
                               className="text-[10px] uppercase tracking-widest font-bold h-10 px-8 rounded-xl bg-black text-white hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
                               onClick={() => handleStatusUpdate(request.id, 'approved')}
                               disabled={processingId === request.id || (!!request.status && request.status !== 'pending')}
                             >
                               {processingId === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve Refund"}
                             </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Rejection Modal */}
      <Dialog open={!!rejectingRequest} onOpenChange={(open) => !open && setRejectingRequest(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-neutral-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Reject Return Request</DialogTitle>
            <DialogDescription className="text-neutral-500 font-light italic mt-1">
              Please provide a reason for rejecting the return for order #{rejectingRequest?.order?.order_number}. This will be emailed to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="E.g., The return window has expired or the item shows signs of use..."
              className="min-h-[120px] rounded-2xl border-neutral-200 focus:border-black transition-all text-sm resize-none"
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              className="rounded-xl border-neutral-200 font-bold text-[10px] uppercase tracking-widest"
              onClick={() => setRejectingRequest(null)}
            >
              Cancel
            </Button>
            <Button 
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-widest"
              onClick={() => rejectingRequest && handleStatusUpdate(rejectingRequest.id, 'rejected', rejectionMessage)}
              disabled={!rejectionMessage.trim() || processingId === rejectingRequest?.id}
            >
              {processingId === rejectingRequest?.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
