import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('EXPO_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { package_type_id, customer, payment_id } = await req.json()

    // Validate input
    if (!package_type_id || !customer || !payment_id) {
      throw new Error('Missing required fields: package_type_id, customer, or payment_id')
    }

    if (!customer.email || !customer.name) {
      throw new Error('Customer email and name are required')
    }

    // Get Gloesim credentials from environment variables
    const gloesimEmail = Deno.env.get('GLOESIM_EMAIL')
    const gloesimPassword = Deno.env.get('GLOESIM_PASSWORD')

    if (!gloesimEmail || !gloesimPassword) {
      throw new Error('Gloesim credentials not configured')
    }

    // Step 1: Login to Gloesim API
    console.log('Logging into Gloesim API...')
    const loginResponse = await fetch('https://gloesim.com/api/developer/reseller/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: gloesimEmail,
        password: gloesimPassword,
      }),
    })

    if (!loginResponse.ok) {
      throw new Error(`Gloesim login failed: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    
    if (!loginData.status || !loginData.access_token) {
      throw new Error('Failed to authenticate with Gloesim: Invalid response')
    }

    console.log('Successfully authenticated with Gloesim')

    // Step 2: Purchase package from Gloesim
    console.log(`Purchasing package ${package_type_id} from Gloesim...`)
    const formData = new FormData()
    formData.append('package_type_id', package_type_id.toString())

    const purchaseResponse = await fetch('https://gloesim.com/api/developer/reseller/package/purchase', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`,
        'Accept': 'application/json',
      },
      body: formData,
    })

    if (!purchaseResponse.ok) {
      throw new Error(`Gloesim purchase failed: ${purchaseResponse.status}`)
    }

    const purchaseData = await purchaseResponse.json()

    if (!purchaseData.status) {
      const errorMessage = purchaseData.message || purchaseData.error || 'Unknown error from Gloesim'
      throw new Error(`eSIM purchase failed: ${errorMessage}`)
    }

    console.log('Successfully purchased eSIM from Gloesim')

    // Step 3: Update payment intent status
    const { error: updateError } = await supabaseClient
      .from('payment_intents')
      .update({ 
        status: 'completed',
        package_id: package_type_id,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', payment_id)

    if (updateError) {
      console.error('Failed to update payment intent status:', updateError)
      // Don't fail the entire process for this
    }

    // Step 4: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...purchaseData.data,
          customer: customer,
          payment_id: payment_id,
          purchased_at: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Purchase eSIM error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to purchase eSIM'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})