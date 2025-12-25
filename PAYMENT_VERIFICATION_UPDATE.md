# Payment Verification Update - Copy & Paste

## Instructions:
Replace the `createMembership` function in your `verify-payment/index.ts` file (lines 801-854) with the updated version below.

---

## Updated `createMembership` Function:

```typescript
async function createMembership(payment: any) {
  try {
    // Get membership package details
    const { data: membershipPackage, error: packageError } = await supabase
      .from('membership_packages')
      .select('*')
      .eq('id', payment.membership_package_id)
      .single()

    if (packageError || !membershipPackage) {
      throw new Error('Membership package not found')
    }

    // Check if this is an addon upgrade (not a new membership)
    const metadata = payment.metadata || {}
    const isAddonUpgrade = metadata.is_addon_upgrade === true
    const hasDCSAddon = metadata.has_digital_cashflow_addon === true

    if (isAddonUpgrade) {
      // UPDATE existing membership with DCS addon
      console.log('Processing DCS addon upgrade for user:', payment.user_id)
      
      const { error: updateError } = await supabase
        .from('user_memberships')
        .update({
          has_digital_cashflow_addon: true
        })
        .eq('user_id', payment.user_id)
        .eq('is_active', true)

      if (updateError) {
        throw new Error(`Failed to update membership with DCS addon: ${updateError.message}`)
      }

      console.log('DCS addon added to existing membership successfully', { 
        userId: payment.user_id,
        paymentId: payment.id
      })

    } else {
      // CREATE new membership
      console.log('Creating new membership for user:', payment.user_id)
      
      // Calculate expiry date
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + membershipPackage.duration_days)

      // Create user membership with DCS addon flag
      const { error: membershipError } = await supabase
        .from('user_memberships')
        .insert({
          user_id: payment.user_id,
          membership_package_id: payment.membership_package_id,
          payment_id: payment.id,
          status: 'active',
          is_active: true,
          start_date: new Date().toISOString(),
          expires_at: expiryDate.toISOString(),
          auto_renew: false,
          has_digital_cashflow_addon: hasDCSAddon
        })

      if (membershipError) {
        throw new Error(`Failed to create membership: ${membershipError.message}`)
      }

      // Update user role if it's an affiliate membership
      if (membershipPackage.member_type === 'affiliate') {
        await supabase
          .from('profiles')
          .update({ role: 'affiliate' })
          .eq('id', payment.user_id)
      }

      console.log('Membership created successfully', { 
        userId: payment.user_id,
        packageId: payment.membership_package_id,
        paymentId: payment.id,
        hasDCSAddon: hasDCSAddon
      })
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating/updating membership:', errorMessage)
    throw error
  }
}
```

---

## What Changed:

1. **Added Addon Upgrade Detection**: Checks `metadata.is_addon_upgrade` flag
2. **Conditional Logic**: 
   - If `isAddonUpgrade === true`: Updates existing membership with `has_digital_cashflow_addon = true`
   - Otherwise: Creates new membership with the addon flag
3. **DCS Addon Flag**: Sets `has_digital_cashflow_addon` from payment metadata
4. **Better Logging**: Separate logs for upgrades vs new memberships
5. **Fixed Field Names**: Uses `is_active` and `expires_at` (matching your schema)

---

## Also Update Line 712:

Find this line (around line 712):
```typescript
if (payment.payment_type === 'membership') {
```

Replace with:
```typescript
if (payment.payment_type === 'membership' || payment.payment_type === 'addon_upgrade') {
```

This ensures addon upgrades also trigger the membership update.

---

## Summary:
- **New Membership**: Creates `user_memberships` record with `has_digital_cashflow_addon` flag
- **Addon Upgrade**: Updates existing `user_memberships` record, sets `has_digital_cashflow_addon = true`
- **Lifetime Access**: DCS addon stays active as long as the learner membership is active
