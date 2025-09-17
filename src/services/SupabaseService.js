import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  static instance = null;
  
  constructor() {
    this.client = supabase;
  }

  static getInstance() {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Create payment intent via Supabase Edge Function
  async createPaymentIntent(amount, currency, customerInfo, packageId, packageName) {
    try {
      console.log('Creating payment intent:', { amount, currency, customerInfo, packageId, packageName });

      const { data, error } = await this.client.functions.invoke('create-payment-intent', {
        body: {
          amount: amount, // amount should already be in cents from PaymentModal
          currency: currency.toLowerCase(),
          customer: customerInfo,
          package_id: packageId,
          package_name: packageName,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      return {
        success: true,
        client_secret: data.client_secret,
        payment_intent_id: data.payment_intent_id,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment intent',
      };
    }
  }

  // Purchase eSIM via Supabase Edge Function (keeps Gloesim credentials secure)
  async purchaseESimPackage(packageTypeId, customerInfo, paymentId) {
    try {
      console.log('Purchasing eSIM package:', { packageTypeId, customerInfo, paymentId });

      const { data, error } = await this.client.functions.invoke('purchase-esim', {
        body: {
          package_type_id: packageTypeId,
          customer: customerInfo,
          payment_id: paymentId,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'eSIM purchase failed');
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Error purchasing eSIM:', error);
      return {
        success: false,
        error: error.message || 'Failed to purchase eSIM',
      };
    }
  }

  // Update existing purchase record with eSIM data (since record is created in payment intent)
  async updatePurchaseWithESimData(paymentId, esimData) {
    try {
      console.log('Updating purchase with eSIM data:', { paymentId, esimData });

      const { data, error } = await this.client
        .from('purchases')
        .update({
          esim_data: esimData,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', paymentId)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Purchase updated successfully:', data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating purchase record:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update purchase record'
      };
    }
  }

  // Store purchase record (keeping this for backward compatibility)
  async storePurchaseRecord(purchaseData) {
    try {
      console.log('Storing purchase record:', purchaseData);

      const { data, error } = await this.client
        .from('purchases')
        .insert([
          {
            customer_email: purchaseData.customer.email,
            customer_name: purchaseData.customer.name,
            customer_phone: purchaseData.customer.phone || null,
            package_id: purchaseData.packageId,
            package_name: purchaseData.packageName,
            amount_paid: purchaseData.amount,
            currency: purchaseData.currency,
            payment_id: purchaseData.paymentId,
            esim_data: purchaseData.esimData,
            status: 'completed',
          }
        ])
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Purchase record stored successfully:', data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error storing purchase record:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to store purchase record'
      };
    }
  }

  // Refund payment via Supabase Edge Function
  async refundPayment(paymentId, reason = null, amount = null) {
    try {
      console.log('Processing refund:', { paymentId, reason, amount });

      // First, get the purchase to find the amount if not provided
      if (!amount) {
        const { data: purchaseData, error: fetchError } = await this.client
          .from('purchases')
          .select('amount_paid')
          .eq('payment_id', paymentId)
          .single();

        if (fetchError || !purchaseData) {
          console.error('Error fetching purchase for refund:', fetchError);
          throw new Error('Could not find purchase record');
        }

        amount = purchaseData.amount_paid;
      }

      // Create refund record first
      const { data: refundRecord, error: refundInsertError } = await this.client
        .from('refunds')
        .insert([
          {
            payment_id: paymentId,
            amount: Math.round(amount * 100), // Convert to cents
            reason: reason || 'Customer requested refund',
            status: 'pending',
          }
        ])
        .select()
        .single();

      if (refundInsertError) {
        console.error('Error creating refund record:', refundInsertError);
        throw refundInsertError;
      }

      // Update purchase status
      const { error: updateError } = await this.client
        .from('purchases')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', paymentId);

      if (updateError) {
        console.error('Error updating purchase status:', updateError);
        // Don't throw here, the refund record was created
      }

      // TODO: Call Stripe refund API via Edge Function
      // You'll need to create a 'refund-payment' Edge Function for this
      // For now, we'll just mark it as pending and process manually

      console.log('Refund initiated successfully:', refundRecord);
      return {
        success: true,
        refund_id: refundRecord.id,
        message: 'Refund has been initiated and will be processed within 24 hours',
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error.message || 'Failed to process refund',
      };
    }
  }

  // Get user's purchase history
  async getUserPurchases(userEmail) {
    try {
      console.log('Fetching purchases for user:', userEmail);

      const { data, error } = await this.client
        .from('purchases')
        .select('*')
        .eq('customer_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch purchases'
      };
    }
  }

  // Get purchase by payment ID
  async getPurchaseByPaymentId(paymentId) {
    try {
      console.log('Fetching purchase by payment ID:', paymentId);

      const { data, error } = await this.client
        .from('purchases')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching purchase:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch purchase'
      };
    }
  }

  // Update purchase status
  async updatePurchaseStatus(paymentId, status) {
    try {
      const { data, error } = await this.client
        .from('purchases')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('payment_id', paymentId)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating purchase status:', error);
      return { success: false, error: error.message };
    }
  }

  // Track payment intent creation (if you still need this for analytics)
  async trackPaymentIntent(paymentIntentData) {
    try {
      const { data, error } = await this.client
        .from('payment_intents')
        .insert([paymentIntentData])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error tracking payment intent:', error);
      return { success: false, error: error.message };
    }
  }

  // Update payment intent status
  async updatePaymentIntentStatus(paymentIntentId, status) {
    try {
      const { data, error } = await this.client
        .from('payment_intents')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating payment intent status:', error);
      return { success: false, error: error.message };
    }
  }
}