import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PaymentRequest {
  email: string
  amount: number
  currency?: string
  metadata?: {
    user_id?: string
    payment_type?: string
    full_name?: string
    phone_number?: string
    country?: string
    payment_gateway?: string
    original_amount_usd?: number
    course_id?: string
    affiliate_code?: string
  }
}

serve(async (req) => {
  console.log('🚀 Edge Function - Payment initialization started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔀 Edge Function - CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.error('❌ Edge Function - Method not allowed:', req.method);
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    // Check environment variables
    console.log('🔧 Edge Function - Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasPaystackSecretKey: !!paystackSecretKey,
      paystackKeyLength: paystackSecretKey?.length || 0
    });

    if (!supabaseUrl || !supabaseServiceKey || !paystackSecretKey) {
      console.error('❌ Edge Function - Missing environment variables');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error',
        message: 'Missing required environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    console.log('🔐 Edge Function - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('❌ Edge Function - No authorization header');
      return new Response('No authorization header', {
        status: 401,
        headers: corsHeaders
      })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Edge Function - Token length:', token.length);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError) {
      console.error('❌ Edge Function - Auth error:', authError.message);
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders
      })
    }

    if (!user) {
      console.error('❌ Edge Function - No user found');
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders
      })
    }

    console.log('✅ Edge Function - User authenticated:', user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📥 Edge Function - Request body:', requestBody);
    } catch (parseError) {
      console.error('❌ Edge Function - Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, amount, currency = 'NGN', metadata = {} } = requestBody

    if (!email || !amount) {
      console.error('❌ Edge Function - Missing required fields:', { email, amount });
      return new Response(JSON.stringify({ error: 'Email and amount are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate unique reference
    const reference = `digiafriq_${Date.now()}_${user.id.substring(0, 8)}`
    console.log('🆔 Edge Function - Generated reference:', reference);

    // Create payment record in database FIRST
    console.log('💾 Edge Function - Creating payment record...');
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount: amount / 100, // Convert back from kobo/cents to decimal
        currency: currency,
        paystack_reference: reference,
        status: 'pending',
        payment_method: 'paystack',
        email: email,
        metadata: metadata
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Edge Function - Failed to create payment record:', paymentError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create payment record',
        details: paymentError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Edge Function - Payment record created:', paymentRecord.id);

    // Initialize Paystack payment
    console.log('💳 Edge Function - Calling Paystack API...');
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount, // Already in kobo/cents
        reference,
        currency,
        callback_url: `${req.headers.get('origin')}/payment/callback`,
        metadata: {
          ...metadata,
          user_id: user.id,
          payment_id: paymentRecord.id, // Store payment ID for verification
          reference
        }
      })
    })

    console.log('📥 Edge Function - Paystack response received:', paystackResponse.status);
    
    let paystackData;
    try {
      paystackData = await paystackResponse.json();
      console.log('📊 Edge Function - Paystack response:', {
        status: paystackData.status,
        hasData: !!paystackData.data,
        hasAuthUrl: !!paystackData.data?.authorization_url,
        message: paystackData.message
      });
    } catch (parseError) {
      console.error('❌ Edge Function - Failed to parse Paystack response:', parseError);
      const responseText = await paystackResponse.text();
      console.log('📄 Edge Function - Raw Paystack response:', responseText);
      return new Response(JSON.stringify({ 
        error: 'Payment service error',
        details: 'Invalid response from payment gateway'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!paystackData.status) {
      console.error('❌ Edge Function - Paystack initialization failed:', paystackData);
      return new Response(JSON.stringify({ 
        error: 'Payment initialization failed',
        details: paystackData.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Edge Function - Payment initialized successfully');
    
    // Return success response
    return new Response(JSON.stringify({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: reference
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Edge Function - Payment initialization error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
