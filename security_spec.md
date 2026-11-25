# ChoyFood Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict PII Isolation (Super Admin KYC Vault)**: Private legal names, phone numbers, and Valid ID references live exclusively in `/kyc_vault/{userId}`. Partner stores, delivery riders, and other customers can NEVER read or list another user's `/kyc_vault/{userId}` document. Only the owning verified user (`request.auth.uid == userId`) or a verified Super Admin (`isAdmin()`) may access it.
2. **No Self-Assigned Privilege Escalation**: Users creating `/users/{userId}` MUST start with `role == 'customer'`, `kycStatus == 'unverified'`, `walletBalance == 150` (welcome credit), and `choyProActive == false`. Non-admin updates cannot mutate `role` or `kycStatus` to `'verified'`.
3. **Mandatory Privacy Consent**: Creating a `/kyc_vault/{userId}` record strictly requires `privacyConsentAccepted == true` and `status == 'pending'`.
4. **7-Step Order Integrity & Terminal State Locking**: New orders must start at `step == 1` and `status == 'picked'` with `customerId == request.auth.uid`. Once an order reaches `status == 'delivered'` or `status == 'cancelled'`, no non-admin updates are permitted.
5. **Temporal Integrity**: All `createdAt` fields on create and `updatedAt` fields on create/update must equal `request.time`. `createdAt` and ownership fields (`uid`, `customerId`, `actorId`) are immutable after creation.
6. **Path Variable Hardening & Volumetric Limits**: Every single-document target checks `isValidId(...)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars), and every string and array field enforces strict `.size()` boundaries.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Self-Assigned Admin Role on Signup**: `POST /users/{uid}` with `{ role: "admin", ... }` as non-admin customer.
2. **Shadow Field Injection on Profile Update**: `PATCH /users/{uid}` adding ghost field `{ isSuperAdmin: true }`.
3. **Cross-User KYC Vault Read (PII Leak)**: Authenticated Rider or Store attempting `GET /kyc_vault/{victimUid}`.
4. **Unverified Email Admin Spoof**: User with `email: "choyjiez07@gmail.com"` and `email_verified: false` attempting `LIST /kyc_vault`.
5. **KYC Submission Without Privacy Consent**: `POST /kyc_vault/{uid}` with `privacyConsentAccepted: false`.
6. **Self-Approving Own KYC**: User attempting `PATCH /kyc_vault/{uid}` with `{ status: "verified" }`.
7. **Order Identity Spoofing**: Customer creating `/orders/{id}` with `customerId: "other_user_uid"`.
8. **Order Step Shortcutting**: Customer creating `/orders/{id}` directly at `step: 7, status: "delivered"`.
9. **Terminal State Tampering**: Rider or Customer updating `/orders/{id}` after `status == "delivered"`.
10. **Client-Forged Timestamp**: Creating `/orders/{id}` with `createdAt` set to a past/future timestamp instead of `request.time`.
11. **ID Poisoning / Resource Exhaustion**: Creating `/dishes/{1500_char_junk_id}` or injecting a 50KB `name` string.
12. **Dish Price Tampering During Like**: Customer updating `/dishes/{dishId}` with `{ likes: 513, price: 1 }` instead of only incrementing `likes` by 1.
