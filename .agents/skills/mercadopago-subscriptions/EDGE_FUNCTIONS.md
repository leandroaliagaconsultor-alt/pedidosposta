# Edge Functions

## Contents
- Shared utilities (mp-auth, mp-plans, supabase-admin)
- mp-create-subscription
- mp-manage-subscription
- mp-get-subscription-status
- cron-check-subscriptions

## Shared Utilities

### mp-auth.ts

**Location**: `supabase/functions/_shared/mp-auth.ts`

```typescript
// MercadoPagoError — typed error with code, message, statusCode, details
class MercadoPagoError extends Error {
  constructor(code: string, message: string, statusCode?: number, details?: unknown[]) { ... }
}

// Config from env vars
function getMpConfig(): { mode, accessToken, baseUrl, webhookSecret }

// Standard headers with Bearer token
function getMpHeaders(extra?: Record<string, string>): Record<string, string>

// Fetch wrapper with retry (3x for 5xx/429, exponential backoff 1s→2s→4s, cap 10s)
async function mpFetch<T>(url: string, options: RequestInit, maxRetries = 3): Promise<T>
```

**Retry logic**: Only retries 5xx server errors and 429 rate limits. Client errors (4xx) are thrown immediately with details.

### mp-plans.ts

**Location**: `supabase/functions/_shared/mp-plans.ts`

```typescript
const MP_PLAN_METADATA = {
  basic:    { name: 'Basic',    amount: 25000, currency: 'ARS' },
  standard: { name: 'Standard', amount: 49000, currency: 'ARS' },
  premium:  { name: 'Premium',  amount: 89000, currency: 'ARS' },
};

function isValidMpPlanKey(key: string): boolean
function getMpPlanId(planKey: string): string  // reads MP_PLAN_ID_* env var
```

### supabase-admin.ts

Admin client with service role key — used for cross-user DB updates:

```typescript
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
```

---

## mp-create-subscription

**Location**: `supabase/functions/mp-create-subscription/index.ts`

### Request

```typescript
POST /functions/v1/mp-create-subscription
Authorization: Bearer <user-jwt>

{
  planKey: 'basic' | 'standard' | 'premium',
  companyId: string,
  cardTokenId: string,
  payerEmail: string,
}
```

### Flow

1. Authenticate user via JWT
2. Verify user owns company
3. Validate planKey against `MP_PLAN_METADATA`
4. Cancel any existing active MP subscription for this company
5. Create MercadoPago preapproval:
   ```
   POST https://api.mercadopago.com/preapproval
   Headers: Authorization, X-Idempotency-Key: mp-sub-{companyId}-{planKey}-{timestamp}
   Body: {
     preapproval_plan_id, payer_email, card_token_id,
     auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount, currency_id },
     status: 'authorized',   // ← triggers immediate charge
     back_url, external_reference: companyId,
     reason: 'Escuela Segura - Plan {name}'
   }
   ```
6. Insert subscription record in DB
7. Update company: `is_subscribed=true`, `subscription_status='active'`, `selected_plan`
8. Send activation email via Resend

### Response

```json
{ "success": true, "subscriptionId": "preapproval-id", "status": "active" }
```

### Key Detail: Cancelling Existing Subscription

When creating a new subscription, any existing active subscription for the same company is cancelled first:

```typescript
// Cancel via MP API
PUT /preapproval/{old_id} → { status: 'cancelled', reason: 'Plan change from X to Y' }
// Update DB
UPDATE subscriptions SET status='cancelled', cancelled_at=now WHERE mp_preapproval_id=old_id
```

---

## mp-manage-subscription

**Location**: `supabase/functions/mp-manage-subscription/index.ts`

### Request

```typescript
POST /functions/v1/mp-manage-subscription
Authorization: Bearer <user-jwt>

{
  action: 'change_plan' | 'change_card' | 'cancel' | 'pause' | 'reactivate',
  mpPreapprovalId: string,
  newPlanKey?: string,      // required for change_plan
  cardTokenId?: string,     // required for change_card, optional for change_plan
  reason?: string,          // optional context
}
```

### Action Dispatch

All actions call `PUT /preapproval/{id}` with different bodies:

| Action | MP PUT body | DB subscription update | DB company update |
|---|---|---|---|
| `change_plan` | `{ auto_recurring: { transaction_amount: newAmount } }` + optional `card_token_id` | plan_key, plan_name, amount, currency | selected_plan |
| `change_card` | `{ card_token_id: token }` | (none) | (none) |
| `cancel` | `{ status: 'cancelled' }` | status=cancelled, cancelled_at | subscription_status=canceled |
| `pause` | `{ status: 'paused' }` | status=suspended, suspended_at | is_subscribed=false, subscription_status=paused |
| `reactivate` | `{ status: 'authorized' }` | status=active, suspended_at=null | is_subscribed=true, subscription_status=active |

### Idempotency Key Pattern

```
X-Idempotency-Key: mp-manage-{mpPreapprovalId}-{action}-{Date.now()}
```

### Email Notifications

Each action triggers a specific email template:

| Action | Email function | Key data |
|---|---|---|
| change_plan | `planChangedEmail` | old plan name, new plan name, new amount |
| change_card | `cardChangedEmail` | last 4 digits (placeholder '****') |
| cancel | `subscriptionCancelledEmail` | access-until date (current_period_end) |
| pause | `subscriptionSuspendedEmail` | user name |
| reactivate | `subscriptionReactivatedEmail` | plan name |

---

## mp-get-subscription-status

**Location**: `supabase/functions/mp-get-subscription-status/index.ts`

### Request

```typescript
POST /functions/v1/mp-get-subscription-status
Authorization: Bearer <user-jwt>

{ mpPreapprovalId: string }
```

### Response

```typescript
{
  nextPaymentDate: string | null,
  paymentMethodId: string | null,  // e.g., 'visa', 'master'
  cardLastFour: string | null,     // e.g., '4567'
}
```

### Flow

1. Authenticate user, verify subscription ownership
2. `GET /preapproval/{id}` from MP API
3. Sync `next_billing_time` in DB
4. Fetch card details:
   - Try: `GET /v1/customers/{payer_id}/cards/{card_id}` → extract `last_four_digits`
   - Fallback: search authorized payments → extract card from latest payment

---

## cron-check-subscriptions

**Location**: `supabase/functions/cron-check-subscriptions/index.ts`

### Auth

Service role key only (not user JWT):

```typescript
const authHeader = req.headers.get('Authorization');
if (authHeader !== `Bearer ${serviceRoleKey}`) → 401
```

### Flow

1. Fetch all active MP subscriptions from DB
2. For each where `next_billing_time` has passed:
   - `GET /preapproval/{id}` from MP API
   - If still authorized: sync `next_billing_time`
   - If cancelled/paused: update local status
3. Fetch cancelled subscriptions past grace period (`current_period_end < now`)
4. Revoke access: set `is_subscribed=false` on companies

### Response

```json
{ "success": true, "synced": 3, "revoked": 1 }
```

### Scheduling

Configure in `supabase/config.toml` or via Supabase dashboard as a daily CRON job.

---

## Edge Function Boilerplate

All edge functions follow this pattern:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getMpConfig, getMpHeaders, mpFetch, MercadoPagoError } from '../_shared/mp-auth.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify JWT (for user-facing functions)
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Validate input
    // 3. Verify ownership
    // 4. Call MercadoPago API via mpFetch()
    // 5. Update DB via supabaseAdmin
    // 6. Send email via sendEmailSafe()
    // 7. Return success response

    return new Response(JSON.stringify({ success: true, ... }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof MercadoPagoError ? error.message : 'Error genérico';
    const status = error instanceof MercadoPagoError ? error.statusCode || 500 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```
