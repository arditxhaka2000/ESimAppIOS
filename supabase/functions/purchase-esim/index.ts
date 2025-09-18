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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const { package_type_id, customer, payment_id, use_sandbox = true } = await req.json()

    // Validate input
    if (!package_type_id || !customer || !payment_id) {
      throw new Error('Missing required fields: package_type_id, customer, or payment_id')
    }

    if (!customer.email || !customer.name) {
      throw new Error('Customer email and name are required')
    }

    // Determine which environment and credentials to use
    const useSandbox = use_sandbox || Deno.env.get('USE_SANDBOX') === 'true'
    const baseUrl = useSandbox 
      ? 'https://sandbox.gloesim.com/api/' 
      : 'https://gloesim.com/api/'
    
    const gloesimEmail = useSandbox 
      ? Deno.env.get('GLOESIM_SANDBOX_EMAIL') || Deno.env.get('GLOESIM_EMAIL')
      : Deno.env.get('GLOESIM_EMAIL')
      
    const gloesimPassword = useSandbox 
      ? Deno.env.get('GLOESIM_SANDBOX_PASSWORD') || Deno.env.get('GLOESIM_PASSWORD')
      : Deno.env.get('GLOESIM_PASSWORD')
    
    console.log(`Using ${useSandbox ? 'SANDBOX' : 'PRODUCTION'} environment`)
    console.log(`Base URL: ${baseUrl}`)
    console.log('Gloesim email exists:', !!gloesimEmail)
    console.log('Gloesim password exists:', !!gloesimPassword)

    if (!gloesimEmail || !gloesimPassword) {
      throw new Error(`Gloesim ${useSandbox ? 'sandbox' : 'production'} credentials not configured`)
    }

    // Step 1: Login to Gloesim API
    console.log(`Logging into Gloesim ${useSandbox ? 'SANDBOX' : 'PRODUCTION'} API...`)
    const loginResponse = await fetch(`${baseUrl}developer/reseller/login`, {
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
      const loginError = await loginResponse.text()
      console.error('Login response error:', loginError)
      throw new Error(`Gloesim login failed: ${loginResponse.status} - ${loginError}`)
    }

    const loginData = await loginResponse.json()
    
    if (!loginData.status || !loginData.access_token) {
      console.error('Login response:', loginData)
      throw new Error('Failed to authenticate with Gloesim: Invalid response')
    }

    console.log(`Successfully authenticated with Gloesim ${useSandbox ? 'SANDBOX' : 'PRODUCTION'}`)

    // Step 2: Purchase package from Gloesim
    console.log(`Purchasing package ${package_type_id} from Gloesim ${useSandbox ? 'SANDBOX' : 'PRODUCTION'}...`)
    const formData = new FormData()
    formData.append('package_type_id', package_type_id.toString())

    const purchaseResponse = await fetch(`${baseUrl}developer/reseller/package/purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`,
        'Accept': 'application/json',
      },
      body: formData,
    })

    if (!purchaseResponse.ok) {
      const purchaseError = await purchaseResponse.text()
      console.error('Purchase response error:', purchaseError)
      throw new Error(`Gloesim purchase failed: ${purchaseResponse.status} - ${purchaseError}`)
    }

    const purchaseData = await purchaseResponse.json()

    if (!purchaseData.status) {
      const errorMessage = purchaseData.message || purchaseData.error || 'Unknown error from Gloesim'
      console.error('Purchase failed with data:', purchaseData)
      
      // If it's a wallet balance issue and we're not in sandbox, suggest using sandbox
      if (errorMessage.includes('Insufficient Wallet Balance') && !useSandbox) {
        throw new Error(`${errorMessage}. Consider using sandbox environment for testing.`)
      }
      
      throw new Error(`eSIM purchase failed: ${errorMessage}`)
    }

    console.log(`Successfully purchased eSIM from Gloesim ${useSandbox ? 'SANDBOX' : 'PRODUCTION'}`)
    console.log('Purchase data:', purchaseData)

    // Step 3: Update purchase record
    try {
      const { error: updateError } = await supabaseClient
        .from('purchases')
        .update({ 
          status: 'completed',
          esim_data: {
            ...purchaseData.data,
            environment: useSandbox ? 'sandbox' : 'production'
          },
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', payment_id)

      if (updateError) {
        console.error('Failed to update purchase status:', updateError)
      } else {
        console.log('Purchase record updated successfully')
      }
    } catch (dbError) {
      console.error('Database update error:', dbError)
    }

    // Step 4: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...purchaseData.data,
          customer: customer,
          payment_id: payment_id,
          environment: useSandbox ? 'sandbox' : 'production',
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
        error: error.message || 'Failed to purchase eSIM',
        details: error.stack || 'No stack trace available'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})