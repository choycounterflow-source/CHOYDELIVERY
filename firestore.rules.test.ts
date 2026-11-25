/**
 * Phase 0 TDD Security Rules Verification Spec ("Dirty Dozen" Payloads)
 * Verifies that all 12 adversarial payloads against ChoyFood collections
 * violate the invariants enforced in firestore.rules.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list';
  actor: { uid: string; email: string; email_verified: boolean; role: string };
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
  enforcedByRule: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Admin Role on Signup',
    collection: '/users/attacker_1',
    operation: 'create',
    actor: { uid: 'attacker_1', email: 'evil@example.com', email_verified: true, role: 'customer' },
    payload: { role: 'admin', walletBalance: 150, kycStatus: 'unverified', choyProActive: false },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'users.create requires incoming().role == "customer" unless isBootstrapAdmin()',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Profile Update',
    collection: '/users/customer_1',
    operation: 'update',
    actor: { uid: 'customer_1', email: 'c1@example.com', email_verified: true, role: 'customer' },
    payload: { displayName: 'Legit', isSuperAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidUserProfile().keys().hasOnly(...) and affectedKeys().hasOnly(...)',
  },
  {
    id: 3,
    name: 'Cross-User KYC Vault Read (PII Leak)',
    collection: '/kyc_vault/victim_1',
    operation: 'get',
    actor: { uid: 'store_owner_1', email: 'store@example.com', email_verified: true, role: 'store' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'kyc_vault.get restricts strictly to isOwner(userId) || isAdmin()',
  },
  {
    id: 4,
    name: 'Unverified Email Admin Spoof',
    collection: '/kyc_vault',
    operation: 'list',
    actor: { uid: 'spoof_1', email: 'choyjiez07@gmail.com', email_verified: false, role: 'customer' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isBootstrapAdmin() requires isVerifiedUser() (email_verified == true)',
  },
  {
    id: 5,
    name: 'KYC Submission Without Privacy Consent',
    collection: '/kyc_vault/customer_1',
    operation: 'create',
    actor: { uid: 'customer_1', email: 'c1@example.com', email_verified: true, role: 'customer' },
    payload: { privacyConsentAccepted: false, status: 'pending' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidKycRecord() requires data.privacyConsentAccepted == true',
  },
  {
    id: 6,
    name: 'Self-Approving Own KYC',
    collection: '/kyc_vault/customer_1',
    operation: 'update',
    actor: { uid: 'customer_1', email: 'c1@example.com', email_verified: true, role: 'customer' },
    payload: { status: 'verified' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'kyc_vault.update allows status == "verified" exclusively for isAdmin()',
  },
  {
    id: 7,
    name: 'Order Identity Spoofing',
    collection: '/orders/order_fake_1',
    operation: 'create',
    actor: { uid: 'customer_1', email: 'c1@example.com', email_verified: true, role: 'customer' },
    payload: { customerId: 'victim_2', step: 1, status: 'picked' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'orders.create enforces incoming().customerId == request.auth.uid',
  },
  {
    id: 8,
    name: 'Order Step Shortcutting on Create',
    collection: '/orders/order_skip_1',
    operation: 'create',
    actor: { uid: 'customer_1', email: 'c1@example.com', email_verified: true, role: 'customer' },
    payload: { customerId: 'customer_1', step: 7, status: 'delivered' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'orders.create enforces incoming().step == 1 && incoming().status == "picked"',
  },
  {
    id: 9,
    name: 'Terminal State Tampering After Delivery',
    collection: '/orders/order_done_1',
    operation: 'update',
    actor: { uid: 'rider_1', email: 'rider@example.com', email_verified: true, role: 'rider' },
    payload: { status: 'cancelled' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'orders.update blocks non-admin writes when existing().status in ["delivered", "cancelled"]',
  },
  {
    id: 10,
    name: 'Client-Forged Timestamp',
    collection: '/orders/order_time_1',
    operation: 'create',
    actor: { uid: 'customer_1', email: 'c1@example.com', email_verified: true, role: 'customer' },
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'orders.create enforces incoming().createdAt == request.time',
  },
  {
    id: 11,
    name: 'ID Poisoning & Volumetric String Exhaustion',
    collection: `/dishes/${'x'.repeat(250)}`,
    operation: 'create',
    actor: { uid: 'store_1', email: 'store@example.com', email_verified: true, role: 'store' },
    payload: { name: 'a'.repeat(500) },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidId(dishId) max 128 chars & isValidDish() name.size() <= 100',
  },
  {
    id: 12,
    name: 'Dish Price Tampering During Like',
    collection: '/dishes/dish_1',
    operation: 'update',
    actor: { uid: 'customer_1', email: 'c1@example.com', email_verified: true, role: 'customer' },
    payload: { likes: 343, price: 1 },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'dishes.update like branch enforces affectedKeys().hasOnly(["likes", "updatedAt"])',
  },
];
