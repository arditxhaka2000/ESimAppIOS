import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { payment_id, amount, reason } = await req.json()

    // Validate input
    if (!payment_id) {
      throw new Error('Payment ID is required')
    }

    console.log(`Processing refund for payment: ${payment_id}`)

    // Create refund with Stripe
    const refundData: any = {
      payment_intent: payment_id,
      reason: reason || 'requested_by_customer',
    }

    // Add amount if specified (for partial refunds)
    if (amount && amount > 0) {
      refundData.amount = amount
    }

    const refund = await stripe.refunds.create(refundData)

    console.log(`Stripe refund created: ${refund.id}`)

    // Store refund record in database
    const { error: dbError } = await supabaseClient
      .from('refunds')
      .insert([
        {
          payment_id: payment_id,
          stripe_refund_id: refund.id,
          amount: refund.amount,
          reason: reason || 'esim_activation_failed',
          status: refund.status,
        }
      ])

    if (dbError) {
      console.error('Failed to store refund record:', dbError)
      // Don't fail the refund process, just log the error
    }

    // Update payment intent status
    const { error: updateError } = await supabaseClient
      .from('payment_intents')
      .update({ 
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', payment_id)

    if (updateError) {
      console.error('Failed to update payment intent status:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        amount: refund.amount,
        status: refund.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Refund payment error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process refund',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})