
import { supabaseAdmin } from '../config/supabase';
import { sendReturnStatusEmail } from './email.service';

export interface ReturnStatusUpdateResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class ReturnService {
  /**
   * Updates a return request status, syncs with the order, and notifies the customer.
   * This is the "Gold Standard" way to handle returns.
   */
  static async updateRequestStatus(
    requestId: string, 
    newStatus: 'approved' | 'rejected' | 'pending'
  ): Promise<ReturnStatusUpdateResult> {
    try {
      // 1. Update the return request itself
      const { data: request, error: updateError } = await supabaseAdmin
        .from('order_return_requests')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId)
        .select('*, order:orders(*)')
        .single();

      if (updateError || !request) {
        return { success: false, error: updateError?.message || 'Request not found' };
      }

      const updatedRequest = request as any;

      // 2. Sync with Main Order Status (Only if approved)
      if (newStatus === 'approved' && updatedRequest.order_id) {
        const { error: syncError } = await supabaseAdmin
          .from('orders')
          .update({ status: 'refunded' })
          .eq('id', updatedRequest.order_id);
        
        if (syncError) {
          console.error(`[ReturnService] Failed to sync order status for order ${updatedRequest.order_id}:`, syncError.message);
          // We don't fail the whole operation, but we log the issue
        }
      }

      // 3. Automated Customer Notification
      const contactEmail = updatedRequest.order?.shipping_address?.contact_email;
      if (contactEmail && (newStatus === 'approved' || newStatus === 'rejected')) {
        // We run this in the background to keep the response fast
        sendReturnStatusEmail(
          updatedRequest.order?.order_number || 'Order',
          newStatus,
          updatedRequest.reason || 'No reason provided',
          contactEmail
        ).catch(err => console.error('[ReturnService] Email notification failed:', err.message));
      }

      return { success: true, data: updatedRequest };
    } catch (err: any) {
      console.error('[ReturnService] Unexpected error:', err.message);
      return { success: false, error: 'An unexpected error occurred during the status update.' };
    }
  }
}
