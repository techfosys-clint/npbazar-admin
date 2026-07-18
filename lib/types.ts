export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface VariantOption {
  value: string;
  /** Optional per-option price; null/0 = product default price applies. */
  price?: number | null;
  /** Optional image specific to this option (max 1). */
  images?: string[];
}

export interface Variant {
  name: string;
  options: VariantOption[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  /** Buying cost per unit (admin-only, weighted average). */
  costPrice?: number;
  sku?: string;
  /** null = unlimited stock (never tracked/decremented). */
  stock: number | null;
  thumbnail?: string;
  images?: string[];
  brand?: { _id: string; name: string; slug: string } | string | null;
  tags?: string[];
  variants?: Variant[];
  rating?: number;
  numReviews?: number;
  sold?: number;
  isFeatured: boolean;
  isBestSelling?: boolean;
  isActive: boolean;
  createdAt?: string;

  // Organization — collections double as categories (at least one required).
  collections: ({ _id: string; name: string; slug: string } | string)[];

  // Search engine listing
  seoTitle?: string;
  seoDescription?: string;
}

export interface AdminCartItem {
  product: { _id: string; name: string; slug: string; thumbnail?: string; price: number };
  quantity: number;
  variant?: Record<string, string>;
  unitPrice: number;
}

export interface AdminCart {
  _id: string;
  user?: { _id: string; name: string; mobile: string; email?: string };
  items: AdminCartItem[];
  itemCount: number;
  value: number;
  updatedAt: string;
}

export type CourierProvider = 'pathao' | 'redx' | 'steadfast' | 'paperfly';
export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled'
  | 'failed';

export interface CourierCredentialField {
  key: string;
  label: string;
  secret?: boolean;
}

export interface CourierProviderDef {
  key: CourierProvider;
  label: string;
  credentialFields: CourierCredentialField[];
}

export interface CourierAccount {
  _id: string;
  provider: CourierProvider;
  environment: 'sandbox' | 'live';
  isActive: boolean;
  isDefault: boolean;
  hasCredentials: boolean;
  webhookUrl: string;
  lastVerifiedAt?: string | null;
  lastVerifyMessage?: string;
  createdAt?: string;
}

export interface ShipmentTrackingEvent {
  status: ShipmentStatus | string;
  note?: string;
  at: string;
}

export interface Shipment {
  provider?: CourierProvider | null;
  consignmentId?: string | null;
  trackingCode?: string;
  trackingUrl?: string;
  status?: ShipmentStatus | null;
  createdAt?: string | null;
  lastSyncedAt?: string | null;
  trackingHistory?: ShipmentTrackingEvent[];
}

export type PaymentProvider = 'sslcommerz' | 'bkash' | 'eps' | 'nagad';
export type PaymentGatewayStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface PaymentCredentialField {
  key: string;
  label: string;
  secret?: boolean;
}

export interface PaymentProviderDef {
  key: PaymentProvider;
  label: string;
  credentialFields: PaymentCredentialField[];
}

export interface PaymentGatewayAccount {
  _id: string;
  provider: PaymentProvider;
  environment: 'sandbox' | 'live';
  isActive: boolean;
  hasCredentials: boolean;
  ipnUrl: string;
  lastVerifiedAt?: string | null;
  lastVerifyMessage?: string;
  createdAt?: string;
}

export interface PaymentEvent {
  status: PaymentGatewayStatus | string;
  note?: string;
  at: string;
}

export interface Payment {
  provider?: PaymentProvider | null;
  transactionId?: string | null;
  gatewayTransactionId?: string;
  status?: PaymentGatewayStatus | null;
  amount?: number;
  paidAt?: string | null;
  history?: PaymentEvent[];
}

export interface OrderItem {
  product: string;
  name: string;
  thumbnail?: string;
  price: number;
  costPrice?: number;
  quantity: number;
  variant?: Record<string, string>;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: { _id: string; name: string; mobile: string; email?: string };
  items: OrderItem[];
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine?: string;
    area?: string;
    city?: string;
    postalCode?: string;
  };
  subtotal: number;
  discount: number;
  couponCode?: string;
  couponDiscountType?: string;
  shippingCost: number;
  total: number;
  source?: 'website' | 'admin';
  customerEmail?: string;
  invoiceSentAt?: string | null;
  paymentMethod: 'cod' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  statusHistory?: { status: string; note?: string; at: string }[];
  shipment?: Shipment;
  payment?: Payment;
  createdAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  product?: { _id: string; name: string; slug: string };
  user?: { _id: string; name: string; mobile?: string };
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: string;
}

export type CouponDiscountType = 'amount_off_order' | 'amount_off_products' | 'buy_x_get_y' | 'free_shipping';
export type CouponAppliesTo = 'all' | 'products' | 'collections';

export interface Coupon {
  _id: string;
  code: string;
  discountType: CouponDiscountType;

  valueType: 'percentage' | 'fixed';
  value: number;
  maxDiscount: number;

  appliesTo: CouponAppliesTo;
  productIds?: (string | { _id: string; name: string })[];
  collectionIds?: (string | { _id: string; name: string })[];

  buyQuantity: number;
  getQuantity: number;
  getDiscountType: 'percentage' | 'free';
  getDiscountValue: number;
  getProductIds?: (string | { _id: string; name: string })[];
  getCollectionIds?: (string | { _id: string; name: string })[];

  minOrder: number;
  usageLimit: number;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export const DISCOUNT_TYPE_INFO: { key: CouponDiscountType; label: string; hint: string }[] = [
  { key: 'amount_off_products', label: 'Amount off products', hint: 'Discount specific products or collections of products' },
  { key: 'buy_x_get_y', label: 'Buy X get Y', hint: 'Discount specific products or collections of products' },
  { key: 'amount_off_order', label: 'Amount off order', hint: 'Discount the total order amount' },
  { key: 'free_shipping', label: 'Free shipping', hint: 'Offer free shipping on an order' },
];

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff';
  permissions: string[];
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface StoreSettings {
  storeName: string;
  logo?: string;
  favicon?: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  currencySymbol: string;
  shippingCost: number;
  freeShippingThreshold: number;
  /** Storefront theme colors (hex strings), all editable from Settings → Appearance. */
  buttonColor?: string;
  primaryColor?: string;
  navbarColor?: string;
  backgroundColor?: string;
  socialLinks?: { facebook?: string; instagram?: string; youtube?: string; twitter?: string };
  /** Third-party tracking/verification codes, rendered by the storefront root layout. */
  trackingCodes?: {
    ga4MeasurementId?: string;
    gtmContainerId?: string;
    metaPixelId?: string;
    searchConsoleVerification?: string;
    bingVerification?: string;
    customHeadCode?: string;
  };
  aboutUs?: string;
  contactUs?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type BannerPlacement = 'hero_slider' | 'hero_side' | 'home_bottom';

export interface Banner {
  _id: string;
  placement: BannerPlacement;
  image: string;
  /** Optional alternate image shown on small screens instead of `image`. */
  mobileImage?: string;
  link?: string;
  title?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

/** Placement metadata shared by the banner pages (labels + recommended sizes). */
export const BANNER_PLACEMENTS: {
  key: BannerPlacement;
  label: string;
  size: string;
  hint: string;
  multiple: boolean;
}[] = [
  {
    key: 'hero_slider',
    label: 'Hero Slider',
    size: '1080 × 485 px',
    hint: 'Big left carousel in the home hero section — add multiple slides. Upload at this exact ratio (~2.2:1) so the image fills the slot with no cropping.',
    multiple: true,
  },
  {
    key: 'hero_side',
    label: 'Hero Side Advertisement',
    size: '510 × 485 px',
    hint: 'Advertisement banner on the right side of the hero grid. Upload at this exact ratio (~1.05:1) so the image fills the slot with no cropping.',
    multiple: false,
  },
  {
    key: 'home_bottom',
    label: 'Bottom Section Banner',
    size: '1400 × 400 px',
    hint: 'Wide banner strip in the lower section of the home page',
    multiple: false,
  },
];

export interface InventoryItem {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  thumbnail?: string;
  /** null = unlimited stock. */
  stock: number | null;
  sold: number;
  costPrice: number;
  price: number;
  profitPerUnit: number;
  marginPercent: number;
  stockValue: number;
  retailValue: number;
  isActive: boolean;
}

export interface InventoryTotals {
  units: number;
  stockValue: number;
  retailValue: number;
  potentialProfit: number;
}

export interface InventoryLog {
  _id: string;
  product?: { _id: string; name: string; slug: string; thumbnail?: string };
  type: 'stock_in' | 'adjustment';
  quantity: number;
  unitCost?: number | null;
  stockAfter: number;
  note?: string;
  admin?: { _id: string; fullName: string };
  createdAt: string;
}

export interface ShippingZone {
  _id: string;
  name: string;
  city: string;
  shippingCost: number;
  freeShippingThreshold: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

export type CollectionConditionField = 'price' | 'brand' | 'tag';
export type CollectionConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';

export interface CollectionCondition {
  field: CollectionConditionField;
  operator: CollectionConditionOperator;
  value: string;
}

export interface Collection {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: { _id: string; name: string; slug: string } | string | null;
  order?: number;
  type: 'manual' | 'smart';
  matchType: 'all' | 'any';
  conditions: CollectionCondition[];
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  productCount?: number;
  createdAt?: string;
}

export interface Blog {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image?: string;
  blog: { _id: string; name: string; slug: string } | string;
  author?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  visibility: 'visible' | 'hidden';
  publishedAt?: string;
  createdAt?: string;
}

export interface AnalyticsSummary {
  grossSales: number;
  discounts: number;
  returns: number;
  netSales: number;
  shippingCharges: number;
  returnFees: number;
  taxes: number;
  totalSales: number;
  orders: number;
  ordersFulfilled: number;
  returningCustomerRate: number;
}

export interface SalesPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface AovPoint {
  date: string;
  aov: number;
}

export interface SessionsPoint {
  date: string;
  sessions: number;
}

export interface ConversionPoint {
  date: string;
  rate: number;
}

export interface ChannelSales {
  channel: string;
  sales: number;
  orders: number;
}

export interface ProductSales {
  _id: string;
  name: string;
  thumbnail?: string;
  quantity: number;
  sales: number;
}

export interface CollectionSales {
  _id: string;
  name: string;
  sales: number;
  quantity: number;
}

export interface SellThroughItem {
  _id: string;
  name: string;
  thumbnail?: string;
  sold: number;
  /** null = unlimited stock. */
  stock: number | null;
  /** null when stock is unlimited (rate isn't meaningful). */
  sellThroughRate: number | null;
}

export interface DeviceBreakdown {
  device: string;
  sessions: number;
}

export interface ReferrerBreakdown {
  referrer: string;
  sessions: number;
}

export interface LandingPage {
  path: string;
  sessions: number;
}

export interface ConversionFunnel {
  sessions: number;
  addedToCart: number;
  completedCheckout: number;
  addedToCartRate: number;
  conversionRate: number;
}

export interface PageDef {
  key: string;
  label: string;
}

/** True if the admin can access a page key ('*' = all access). */
export const hasAccess = (admin: AdminUser | null, pageKey: string) =>
  !!admin && (admin.permissions.includes('*') || admin.permissions.includes(pageKey));
