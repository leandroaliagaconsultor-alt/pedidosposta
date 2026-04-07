# Type Definitions & DB Schema

## Contents
- TypeScript types (src/types/subscription.ts)
- Database tables
- MercadoPago API types

## TypeScript Types

**Location**: `src/types/subscription.ts`

```typescript
type SubscriptionStatus =
  | 'pending'
  | 'approval_pending'
  | 'active'
  | 'suspended'
  | 'cancelled'
  | 'expired';

interface Subscription {
  readonly id: string;
  companyId: string;
  mpPreapprovalId: string | null;
  mpPlanId: string | null;
  planKey: string;
  planName: string;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  subscriberEmail: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextBillingTime: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  suspendedAt: string | null;
  failedPaymentsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentTransaction {
  readonly id: string;
  subscriptionId: string | null;
  companyId: string;
  transactionId: string;
  grossAmount: number;
  feeAmount: number | null;
  netAmount: number | null;
  currency: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  paidAt: string | null;
  createdAt: string;
}

// --- Request/Response types ---

interface MpCreateSubscriptionRequest {
  planKey: string;
  companyId: string;
  cardTokenId: string;
  payerEmail: string;
}

interface MpCreateSubscriptionResponse {
  success: boolean;
  subscriptionId: string;
  status: string;
}

type MpManageAction = 'change_plan' | 'change_card' | 'cancel' | 'pause' | 'reactivate';

interface MpManageSubscriptionRequest {
  action: MpManageAction;
  mpPreapprovalId: string;
  newPlanKey?: string;
  cardTokenId?: string;
  reason?: string;
}

interface MpManageSubscriptionResponse {
  success: boolean;
  action: string;
  status: string;
}

interface MpSubscriptionStatusResponse {
  nextPaymentDate: string | null;
  paymentMethodId: string | null;
  cardLastFour: string | null;
}
```

---

## Database Tables

### subscriptions

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `company_id` | uuid FK | → companies.id |
| `payment_provider` | text | Always `'mercadopago'` |
| `mp_preapproval_id` | text | Unique, indexed. MercadoPago preapproval ID |
| `mp_plan_id` | text | MercadoPago plan ID (from env var) |
| `plan_key` | text | `'basic'` / `'standard'` / `'premium'` |
| `plan_name` | text | Human-readable name |
| `amount` | numeric | Plan amount (e.g., 25000) |
| `currency` | text | `'ARS'` |
| `status` | text | pending, approval_pending, active, suspended, cancelled, expired |
| `subscriber_email` | text | Payer email |
| `current_period_start` | timestamptz | Period start |
| `current_period_end` | timestamptz | Period end (grace period boundary) |
| `next_billing_time` | timestamptz | Synced from MP API |
| `activated_at` | timestamptz | When subscription became active |
| `cancelled_at` | timestamptz | When cancelled |
| `suspended_at` | timestamptz | When paused |
| `failed_payments_count` | int | Tracks retry failures |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### payment_transactions

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `subscription_id` | uuid FK | → subscriptions.id |
| `company_id` | uuid FK | → companies.id |
| `paypal_transaction_id` | text | **Reused column** — stores MP authorized_payment ID |
| `gross_amount` | numeric | Amount charged |
| `fee_amount` | numeric | MP fee (nullable) |
| `net_amount` | numeric | Net after fees (nullable) |
| `currency` | text | `'ARS'` |
| `status` | text | completed, pending, refunded, failed |
| `paid_at` | timestamptz | Payment date |
| `created_at` | timestamptz | Auto |

### mp_webhook_log

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `notification_id` | text | Unique, indexed. MP notification ID |
| `action` | text | e.g., `'payment.created'` |
| `type` | text | `'subscription_preapproval'` or `'subscription_authorized_payment'` |
| `data_id` | text | MP entity ID |
| `payload` | jsonb | Full webhook payload |
| `processed` | boolean | Default false |
| `processing_error` | text | Error message if processing failed |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### companies (subscription-related columns)

| Column | Type | Notes |
|---|---|---|
| `is_subscribed` | boolean | Access gate |
| `subscription_status` | text | active, canceled, paused, trial |
| `selected_plan` | text | Plan key |
| `subscription_renewal_date` | timestamptz | Next billing date |

---

## DB Column ↔ TypeScript Mapping

The mapper functions in `subscription.ts` convert snake_case DB columns to camelCase:

| DB Column | TypeScript Field |
|---|---|
| `company_id` | `companyId` |
| `mp_preapproval_id` | `mpPreapprovalId` |
| `mp_plan_id` | `mpPlanId` |
| `plan_key` | `planKey` |
| `plan_name` | `planName` |
| `subscriber_email` | `subscriberEmail` |
| `current_period_start` | `currentPeriodStart` |
| `current_period_end` | `currentPeriodEnd` |
| `next_billing_time` | `nextBillingTime` |
| `activated_at` | `activatedAt` |
| `cancelled_at` | `cancelledAt` |
| `suspended_at` | `suspendedAt` |
| `failed_payments_count` | `failedPaymentsCount` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `paypal_transaction_id` | `transactionId` |
| `gross_amount` | `grossAmount` |
| `fee_amount` | `feeAmount` |
| `net_amount` | `netAmount` |
| `paid_at` | `paidAt` |

---

## MercadoPago API Types (informal)

### Preapproval (from MP API)

```typescript
interface MpPreapproval {
  id: string;
  status: 'pending' | 'authorized' | 'paused' | 'cancelled';
  init_point: string;
  date_created: string;
  next_payment_date?: string;
  payer_id?: number;
  card_id?: string;
  auto_recurring: {
    frequency: number;
    frequency_type: 'months' | 'days';
    transaction_amount: number;
    currency_id: string;
  };
}
```

### Authorized Payment (from MP API)

```typescript
interface MpAuthorizedPayment {
  id: string;
  preapproval_id: string;
  transaction_amount: number;
  currency_id: string;
  status: 'approved' | 'pending' | 'rejected';
  date_created: string;
}
```
