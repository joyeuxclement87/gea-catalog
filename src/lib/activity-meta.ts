// Activity History metadata — pure, client-safe constants (no server deps).
// These drive display labels, the filter dropdowns, and icon selection.

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  category: 'Category',
  section: 'Section',
  media: 'Media',
  catalogue: 'Catalogue',
  settings: 'Settings',
  user: 'User',
};

export const ENTITY_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All entities' },
  { value: 'product', label: 'Products' },
  { value: 'category', label: 'Categories' },
  { value: 'section', label: 'Sections' },
  { value: 'media', label: 'Media' },
  { value: 'catalogue', label: 'Catalogue' },
  { value: 'settings', label: 'Settings' },
  { value: 'user', label: 'Users' },
];

export const ACTION_LABELS: Record<string, string> = {
  // Products
  'product.created': 'Product created',
  'product.updated': 'Product updated',
  'product.deleted': 'Product deleted',
  'product.published': 'Product published',
  'product.unpublished': 'Product unpublished',
  'product.category_changed': 'Product category changed',
  // Categories
  'category.created': 'Category created',
  'category.updated': 'Category updated',
  'category.deleted': 'Category deleted',
  'category.published': 'Category published',
  'category.unpublished': 'Category unpublished',
  'category.reordered': 'Categories reordered',
  'category.image_added': 'Category image added',
  'category.image_replaced': 'Category image replaced',
  'category.image_deleted': 'Category image deleted',
  // Sections
  'section.created': 'Section created',
  'section.updated': 'Section updated',
  'section.deleted': 'Section deleted',
  'section.published': 'Section published',
  'section.unpublished': 'Section unpublished',
  'section.image_updated': 'Section image changed',
  'section.image_removed': 'Section image removed',
  // Media
  'media.uploaded': 'Product image added',
  'media.replaced': 'Product image replaced',
  'media.deleted': 'Product image deleted',
  'media.reordered': 'Product images reordered',
  // Settings
  'settings.updated': 'Catalogue settings changed',
  'settings.cover_updated': 'Catalogue cover updated',
  'settings.cover_removed': 'Catalogue cover removed',
  // Catalogue PDF
  'pdf.generation_started': 'Catalogue PDF generation started',
  'pdf.generated': 'Catalogue PDF generated',
  'pdf.generation_failed': 'Catalogue PDF generation failed',
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function entityTypeLabel(value: string): string {
  return ENTITY_TYPE_LABELS[value] ?? value;
}

// Action groups for the "Action" filter dropdown (grouped by entity).
export const ACTION_GROUPS: { entity: string; label: string; actions: string[] }[] = [
  { entity: 'product', label: 'Products', actions: ['product.created', 'product.updated', 'product.deleted', 'product.published', 'product.unpublished', 'product.category_changed'] },
  { entity: 'category', label: 'Categories', actions: ['category.created', 'category.updated', 'category.deleted', 'category.published', 'category.unpublished', 'category.reordered', 'category.image_added', 'category.image_replaced', 'category.image_deleted'] },
  { entity: 'section', label: 'Sections', actions: ['section.created', 'section.updated', 'section.deleted', 'section.published', 'section.unpublished', 'section.image_updated', 'section.image_removed'] },
  { entity: 'media', label: 'Media', actions: ['media.uploaded', 'media.replaced', 'media.deleted', 'media.reordered'] },
  { entity: 'catalogue', label: 'Catalogue', actions: ['pdf.generation_started', 'pdf.generated', 'pdf.generation_failed'] },
  { entity: 'settings', label: 'Settings', actions: ['settings.updated', 'settings.cover_updated', 'settings.cover_removed'] },
];

export const STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  failed: 'Failed',
};