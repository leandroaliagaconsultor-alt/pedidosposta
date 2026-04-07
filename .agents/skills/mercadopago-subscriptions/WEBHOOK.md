# Webhook Handling

## Contents
- Signature validation
- Event types
- Processing flow
- Idempotency
- Payment recording

**Location**: `supabase/functions/webhook-mercadopago/index.ts`

## Signature Validation

MercadoPago sends an `x-signature` header with format: `ts=TIMESTAMP,v1=HASH`

### Validation Steps

1. Parse `ts` and `v1` from `x-signature` header
2. Get `x-request-id` header
3. Build manifest: `id:{dataId_lowercase};request-id:{xRequestId};ts:{ts};`
4. HMAC-SHA256 the manifest with `MP_WEBHOOK_SECRET`
5. Compare resulting hash with `v1`

**Critical**: The `data.id` from the URL must be **lowercased** for hash validation (MP docs requirement).

```typescript
async function verifyWebhookSignature(
  headers: Headers,
  dataId: string,
  secret: string,
): Promise<boolean> {
  const xSignature = headers.get('x-signature');
  const xRequestId = headers.get('x-request-id');

  // Parse ts=...,v1=... from x-signature
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(',')) {
    const [key, value] = part.split('=', 2);
    if (key && value) parts[key.trim()] = value.trim();
  }

  // Build manifest with LOWERCASE data.id
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${parts.ts};`;

  // HMAC-SHA256 via Web Crypto API (Deno)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest));
  const hash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0')).join('');

  return hash === parts.v1;
}
```

## Event Types Handled

| Type | Description | Processing |
|---|---|---|
| `subscription_preapproval` | Subscription status changed | Fetch full state → sync DB |
| `subscription_authorized_payment` | Recurring payment processed | Record transaction → send receipt |

Other event types are ignored (returned 200 with `{ status: 'ignored' }`).

## Processing: subscription_preapproval

MercadoPago sends minimal payload: `{ action, type, data: { id } }`. The function **must fetch the full state**:

```typescript
GET https://api.mercadopago.com/preapproval/{id}
```

### Status Mapping

| MP Status | Internal Status | Company Update |
|---|---|---|
| `authorized` | `active` | `is_subscribed=true, subscription_status='active'` |
| `paused` | `suspended` | `is_subscribed=false, subscription_status='paused'` |
| `cancelled` | `cancelled` | `subscription_status='canceled'` |
| `pending` | `pending` | (none) |

Status changes trigger emails (cancel → `subscriptionCancelledEmail`, suspend → `subscriptionSuspendedEmail`).

## Processing: subscription_authorized_payment

1. Fetch payment: `GET /authorized_payments/{id}`
2. Find subscription by `preapproval_id`
3. Insert `payment_transactions` record:
   ```typescript
   {
     subscription_id, company_id,
     paypal_transaction_id: dataId,  // Column reused for MP transaction ID
     gross_amount: transactionAmount,
     currency: currencyId || 'ARS',
     status: paymentStatus === 'approved' ? 'completed' : 'pending',
     paid_at: dateCreated,
   }
   ```
4. Sync `next_billing_time` from preapproval state
5. If payment approved: send `paymentReceiptEmail`

## Idempotency

### Webhook Event Level

All events are logged in `mp_webhook_log` table:

```typescript
// Check if already processed
const { data: existingLog } = await supabaseAdmin
  .from('mp_webhook_log')
  .select('id, processed')
  .eq('notification_id', notificationId)
  .maybeSingle();

if (existingLog?.processed) return { status: 'already_processed' };

// Log event before processing
await supabaseAdmin.from('mp_webhook_log').insert({
  notification_id: notificationId,
  action, type, data_id: dataId, payload: body,
});

// After processing
await supabaseAdmin.from('mp_webhook_log')
  .update({ processed: true })
  .eq('notification_id', notificationId);
```

### Transaction Level

Payment transactions use additional check:

```typescript
const { data: existingTx } = await supabaseAdmin
  .from('payment_transactions')
  .select('id')
  .eq('paypal_transaction_id', dataId)
  .maybeSingle();

if (!existingTx) { /* insert */ }
```

### State Change Level

Subscription status sync skips if already in target state:

```typescript
if (existing.status === internalStatus) return; // Idempotent skip
```

## Error Handling

- Processing errors are logged to `mp_webhook_log.processing_error`
- **Always returns HTTP 200** — MercadoPago requires acknowledgment within 22 seconds
- Unprocessed events can be retried by webhook retry mechanism

```typescript
// Always return 200
return new Response(JSON.stringify({ status: 'ok' }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});
```

## Webhook Configuration

Configure in MercadoPago dashboard:
1. Go to "Tus integraciones" → select app → "Webhooks"
2. Set HTTPS URL: `https://<project-ref>.supabase.co/functions/v1/webhook-mercadopago`
3. Select event: "Order (Mercado Pago)" / "subscription_preapproval" / "subscription_authorized_payment"
4. Save → copy the generated signing secret → set as `MP_WEBHOOK_SECRET` env var
