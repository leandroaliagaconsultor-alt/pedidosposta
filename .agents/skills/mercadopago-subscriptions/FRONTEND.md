# Frontend Patterns

## Contents
- CardForm component (Secure Fields tokenization)
- API service layer (subscription.ts)
- MercadoPago SDK setup
- Settings hook (useSettingsData)
- Component hierarchy

## CardForm Component

**Location**: `src/features/auth/components/CardForm.tsx`

Reusable card payment form using MercadoPago Secure Fields API. Handles tokenization only — no payment processing on frontend.

### Props

```typescript
interface CardFormProps {
  amount: number;
  onTokenReady: (data: {
    token: string;
    paymentMethodId: string;
    email: string;
    identificationType: string;
    identificationNumber: string;
  }) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  /** Compact mode hides email/document fields (for change-card flows) */
  compact?: boolean;
  submitLabel?: string;
}
```

### SDK Initialization Pattern

```typescript
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { MP_PUBLIC_KEY } from '@/lib/mercadopago/config';

// 1. Load SDK
await loadMercadoPago();
const mp = new window.MercadoPago(MP_PUBLIC_KEY!, { locale: 'es-AR' });

// 2. Create secure fields (renders iframes — PCI compliant)
const cardNumber = mp.fields.create('cardNumber', { placeholder: '1234 5678 9012 3456' });
const expirationDate = mp.fields.create('expirationDate', { placeholder: 'MM/YY' });
const securityCode = mp.fields.create('securityCode', { placeholder: '123' });

// 3. Mount to DOM containers
await cardNumber.mount('mp-card-number');
await expirationDate.mount('mp-expiration-date');
await securityCode.mount('mp-security-code');

// 4. Load identification types
const types = await mp.getIdentificationTypes();
```

### Token Generation

```typescript
// On form submit:
const tokenResponse = await mpRef.current.fields.createCardToken({
  cardholderName,
  identificationType,    // e.g., 'DNI'
  identificationNumber,  // e.g., '12345678'
});

// tokenResponse.id = card token (single-use, expires in 7 days)
onTokenReady({
  token: tokenResponse.id,
  paymentMethodId: '',
  email: cardholderEmail,
  identificationType,
  identificationNumber,
});
```

### Cleanup Pattern

Always unmount fields on component destroy:

```typescript
useEffect(() => {
  // ... init ...
  return () => {
    fieldsRef.current.cardNumber?.unmount();
    fieldsRef.current.expirationDate?.unmount();
    fieldsRef.current.securityCode?.unmount();
  };
}, []);
```

### Two Modes

| Mode | Usage | Fields shown |
|---|---|---|
| Full (`compact=false`) | Subscription creation (onboarding) | Card, expiry, CVV, cardholder, email, ID type, ID number |
| Compact (`compact=true`) | Card change (settings) | Card, expiry, CVV, cardholder only |

### DOM Structure for Secure Fields

```html
<div id="mp-card-number" class="h-10 border border-gray-200 rounded-lg px-3 bg-white [&_iframe]:!h-full" />
<div id="mp-expiration-date" class="..." />
<div id="mp-security-code" class="..." />
```

The `[&_iframe]:!h-full` Tailwind class ensures the MP iframe fills the container height.

---

## API Service Layer

**Location**: `src/lib/api/services/subscription.ts`

### Functions

```typescript
// Create subscription (calls mp-create-subscription edge function)
mpCreateSubscription(params: MpCreateSubscriptionRequest): Promise<MpCreateSubscriptionResponse>

// Manage subscription (calls mp-manage-subscription edge function)
mpManageSubscription(params: MpManageSubscriptionRequest): Promise<MpManageSubscriptionResponse>

// Get fresh status from MP API (calls mp-get-subscription-status edge function)
mpGetSubscriptionStatus(mpPreapprovalId: string): Promise<MpSubscriptionStatusResponse>

// Query DB for active subscription
getActiveSubscription(companyId: string): Promise<Subscription | null>

// Query DB for payment history
getPaymentHistory(companyId: string, limit?: number): Promise<PaymentTransaction[]>
```

### Edge Function Invocation Pattern

```typescript
// Without explicit auth (uses session cookie automatically)
const { data, error } = await supabase.functions.invoke('mp-create-subscription', {
  body: params,
});

// With explicit auth header (for functions that verify JWT)
const { data: { session } } = await supabase.auth.getSession();
const { data, error } = await supabase.functions.invoke('mp-manage-subscription', {
  body: params,
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

### DB Query Pattern

```typescript
// Get most recent subscription with relevant status
const { data } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('company_id', companyId)
  .in('status', ['active', 'suspended', 'cancelled', 'approval_pending'])
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### Mapper Pattern

All DB rows pass through mappers before reaching components:

```typescript
function mapSubscriptionFromDb(data: Record<string, unknown>): Subscription {
  return {
    id: data.id as string,
    companyId: data.company_id as string,
    mpPreapprovalId: (data.mp_preapproval_id as string) || null,
    // ... snake_case → camelCase
  };
}
```

---

## MercadoPago SDK Setup

**Config**: `src/lib/mercadopago/config.ts`

```typescript
import { env } from '@/lib/env';
export const MP_PUBLIC_KEY = env.VITE_MP_PUBLIC_KEY;
```

**Package**: `@mercadopago/sdk-js` (npm)

Always import the public key from `@/lib/mercadopago/config`, never from `import.meta.env` directly.

---

## Settings Hook Pattern

**Location**: `src/features/settings/hooks/useSettingsData.ts`

The `useSettingsData` hook manages subscription state in the Settings page:

```typescript
// On mount: fetch subscription + payment history
const subscription = await getActiveSubscription(companyId);
const payments = await getPaymentHistory(companyId, 5);

// On billing tab: sync card info from MP API
if (subscription?.mpPreapprovalId) {
  const status = await mpGetSubscriptionStatus(subscription.mpPreapprovalId);
  // status.cardLastFour, status.paymentMethodId, status.nextPaymentDate
}

// Handlers:
handleCancelSubscription()     → mpManageSubscription({ action: 'cancel', ... })
handleReactivateSubscription() → mpManageSubscription({ action: 'reactivate', ... })
handleChangePlan(newPlanKey)   → mpManageSubscription({ action: 'change_plan', ... })
handleChangeCard(tokenData)    → mpManageSubscription({ action: 'change_card', ... })
```

---

## Component Hierarchy

```
SubscriptionPage (Auth wizard step 3)
├── Plan cards (radio selection)
├── Free trial option
└── CardForm (full mode)

SettingsPage > BillingSection
├── Subscription status display
├── Plan info + ChangePlanModal
├── Payment method + CardForm (compact mode)
├── Cancel/Reactivate buttons
└── Payment history table
```
