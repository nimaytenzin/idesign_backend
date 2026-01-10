import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsMessageFormatter {
  /**
   * Sanitize text to prevent encoding issues in SMS
   * Removes problematic characters while keeping basic punctuation
   */
  private sanitizeText(text: string): string {
    if (!text) return '';
    return text
      // Remove emojis and special Unicode characters
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      // Remove other problematic characters that cause encoding issues
      .replace(/[^\x00-\x7F]/g, '') // Remove all non-ASCII characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Format order confirmation SMS message (simple and compact)
   */
  formatOrderConfirmation(order: any): string {
    try {
      const orderNumber = order.orderNumber || `Order #${order.id}`;
      const totalAmount = order.totalPayable || 0;

      // Simple, compact message
      const message = `Thank you for placing your order with us. Your order ID is ${orderNumber} and amount is BTN ${totalAmount.toFixed(2)}.`;
      
      // Final sanitization to ensure no encoding issues
      return this.sanitizeText(message);
    } catch (error) {
      console.error('Error formatting order confirmation SMS:', error.message);
      // Return a fallback message if formatting fails
      const fallbackMessage = `Thank you for placing your order. Order ID: ${order?.orderNumber || order?.id || 'N/A'}. Amount: BTN ${order?.totalAmount || 0}.`;
      return this.sanitizeText(fallbackMessage);
    }
  }

  /**
   * Format order status change SMS message
   */
  formatStatusChange(order: any, statusType: 'fulfillment' | 'payment', oldStatus?: string, newStatus?: string): string {
    try {
      const orderNumber = order.orderNumber || `Order #${order.id}`;
      const customerName = this.sanitizeText(order.customer?.name || 'Customer');

      let message = '';

      if (statusType === 'fulfillment') {
        switch (order.fulfillmentStatus) {
          case 'CONFIRMED':
            message = `Hi ${customerName}, Order ${orderNumber} is confirmed. We're verifying your payment details.`;
            break;
          case 'PROCESSING':
            message = `Hi ${customerName}, Order ${orderNumber} is being processed. We're preparing your items.`;
            break;
          case 'SHIPPING':
            message = `Hi ${customerName}, Order ${orderNumber} has been shipped! Tracking: ${orderNumber}.`;
            break;
          case 'DELIVERED':
            message = `Hi ${customerName}, Order ${orderNumber} has been delivered! Thank you for your order.`;
            break;
          case 'CANCELED':
            message = `Hi ${customerName}, Order ${orderNumber} has been canceled. Please contact support if you have questions.`;
            break;
          default:
            message = `Hi ${customerName}, Order ${orderNumber} status updated.`;
        }
      } else if (statusType === 'payment') {
        switch (order.paymentStatus) {
          case 'PAID':
            message = `Hi ${customerName}, Payment for Order ${orderNumber} has been confirmed. Thank you!`;
            break;
          case 'FAILED':
            message = `Hi ${customerName}, Payment verification for Order ${orderNumber} failed. Please contact support.`;
            break;
          default:
            message = `Hi ${customerName}, Payment status for Order ${orderNumber} updated.`;
        }
      }

      return this.sanitizeText(message);
    } catch (error) {
      console.error('Error formatting status change SMS:', error.message);
      const fallbackCustomerName = this.sanitizeText(order?.customer?.name || 'Customer');
      return this.sanitizeText(`Hi ${fallbackCustomerName}, Order ${order?.orderNumber || order?.id || 'N/A'} status updated.`);
    }
  }

  /**
   * Format order verification SMS message
   */
  formatVerification(order: any): string {
    try {
      const orderNumber = order.orderNumber || `Order #${order.id}`;
      const customerName = this.sanitizeText(order.customer?.name || 'Customer');
      const message = `Hi ${customerName}, Order ${orderNumber} has been verified and is now being processed.`;
      return this.sanitizeText(message);
    } catch (error) {
      console.error('Error formatting verification SMS:', error.message);
      const fallbackCustomerName = this.sanitizeText(order?.customer?.name || 'Customer');
      return this.sanitizeText(`Hi ${fallbackCustomerName}, Order ${order?.orderNumber || order?.id || 'N/A'} verified.`);
    }
  }

  /**
   * Validate SMS message before sending
   */
  validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { isValid: false, error: 'Message is empty' };
    }

    if (message.length > 320) {
      // 2 SMS limit
      return { isValid: false, error: 'Message too long (max 320 characters)' };
    }

    return { isValid: true };
  }
}
