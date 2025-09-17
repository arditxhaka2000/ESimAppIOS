import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    console.log('Stripe key exists:', !!stripeKey)
    console.log('Stripe key starts with sk_:', stripeKey?.startsWith('sk_'))
    
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { amount, currency, customer, package_id, package_name } = await req.json()

    // Validate input
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    if (!customer || !customer.email || !customer.name) {
      throw new Error('Customer information is required')
    }

    if (!package_id || !package_name) {
      throw new Error('Package information is required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customer.email)) {
      throw new Error('Invalid email format')
    }

    console.log('Creating payment intent for:', {
      amount,
      currency: currency || 'usd',
      customer_email: customer.email,
      package_id,
      package_name
    })

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount should already be in cents
      currency: currency || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        package_id: package_id,
        package_name: package_name,
      },
    })

    console.log('Payment intent created:', paymentIntent.id)

    // Store payment intent in purchases table for tracking
    const { error: dbError } = await supabaseClient
      .from('purchases')
      .insert([
        {
          customer_email: customer.email,
          customer_name: customer.name,
          customer_phone: customer.phone || null,
          package_id: package_id,
          package_name: package_name,
          amount_paid: amount / 100, // Convert from cents to dollars
          currency: currency || 'usd',
          payment_id: paymentIntent.id,
          esim_data: null, // Will be populated later when eSIM is activated
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the payment intent creation, just log the error
      // You might want to handle this differently based on your needs
    } else {
      console.log('Purchase record created in database')
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        status: 'success'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Create payment intent error:', error)
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent'
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError'
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        error_type: errorType,
        status: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})