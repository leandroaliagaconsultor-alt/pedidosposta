# Email Notifications

## Contents
- Template functions
- Sending pattern
- Template list with triggers

**Location**: `supabase/functions/_shared/email-templates.ts`

## Sending Pattern

All emails sent via Resend API through `sendEmailSafe()`:

```typescript
import { sendEmailSafe } from '../_shared/resend.ts';
import { subscriptionActivatedEmail } from '../_shared/email-templates.ts';

await sendEmailSafe({
  to: email,
  subject: '¡Tu suscripción a Escuela Segura está activa!',
  html: subscriptionActivatedEmail(userName, planName, amount, currency),
});
```

`sendEmailSafe()` wraps Resend API calls with error handling — never throws, logs errors instead.

## Templates

All templates share a consistent branded HTML layout (`layout()` wrapper) with header/footer. Content is in Spanish (es-AR).

### subscriptionActivatedEmail

```typescript
subscriptionActivatedEmail(name: string, planName: string, amount: number, currency: string): string
```

**Trigger**: `mp-create-subscription` on successful activation
**Subject**: `¡Tu suscripción a Escuela Segura está activa!`
**Content**: Plan name, monthly amount

### paymentReceiptEmail

```typescript
paymentReceiptEmail(name: string, amount: number, currency: string, date: string, planName: string): string
```

**Trigger**: `webhook-mercadopago` on approved `subscription_authorized_payment`
**Subject**: `Recibo de pago — Escuela Segura`
**Content**: Plan, amount, date

### cardChangedEmail

```typescript
cardChangedEmail(name: string, last4: string): string
```

**Trigger**: `mp-manage-subscription` on `change_card` action
**Subject**: `Medio de pago actualizado — Escuela Segura`
**Content**: Card last 4 digits

### planChangedEmail

```typescript
planChangedEmail(name: string, oldPlan: string, newPlan: string, newAmount: number, currency: string): string
```

**Trigger**: `mp-manage-subscription` on `change_plan` action
**Subject**: `Cambio de plan — Escuela Segura`
**Content**: Old plan, new plan, new monthly amount

### subscriptionCancelledEmail

```typescript
subscriptionCancelledEmail(name: string, periodEnd: string | null): string
```

**Trigger**: `mp-manage-subscription` on `cancel` / `webhook-mercadopago` on cancelled state
**Subject**: `Tu suscripción a Escuela Segura fue cancelada`
**Content**: Access-until date (from `current_period_end`)

### subscriptionSuspendedEmail

```typescript
subscriptionSuspendedEmail(name: string): string
```

**Trigger**: `mp-manage-subscription` on `pause` / `webhook-mercadopago` on paused state
**Subject**: `Tu suscripción a Escuela Segura fue suspendida`
**Content**: Reactivation prompt

### subscriptionReactivatedEmail

```typescript
subscriptionReactivatedEmail(name: string, planName: string): string
```

**Trigger**: `mp-manage-subscription` on `reactivate` action
**Subject**: `¡Tu suscripción a Escuela Segura fue reactivada!`
**Content**: Plan name

## Trigger Map

| Event | Edge Function | Email Template |
|---|---|---|
| New subscription activated | mp-create-subscription | `subscriptionActivatedEmail` |
| Recurring payment approved | webhook-mercadopago | `paymentReceiptEmail` |
| Card changed | mp-manage-subscription | `cardChangedEmail` |
| Plan changed | mp-manage-subscription | `planChangedEmail` |
| Subscription cancelled | mp-manage-subscription / webhook | `subscriptionCancelledEmail` |
| Subscription suspended | mp-manage-subscription / webhook | `subscriptionSuspendedEmail` |
| Subscription reactivated | mp-manage-subscription | `subscriptionReactivatedEmail` |

## Shared Helpers

```typescript
// Layout wrapper
function layout(title: string, content: string): string

// Greeting line
function greeting(name: string): string
// → "Hola <strong>Name</strong>,"

// Info table row
function infoRow(label: string, value: string): string

// Info table wrapper
function infoTable(rows: string): string

// Currency formatting
function formatCurrency(amount: number, currency: string): string
// ARS → "$25,000"  |  USD → "US$100.00"

// Date formatting
function formatDate(dateStr: string): string
// → "24 de febrero de 2026" (es-AR locale)
```
