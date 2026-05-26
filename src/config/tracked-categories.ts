export type TrackedCategory = "business_feature" | "product_request";

export const TRACKED_CATEGORIES: {
  id: TrackedCategory;
  label: string;
}[] = [
  { id: "business_feature", label: "Business Feature" },
  { id: "product_request", label: "Product request" },
];

export function getTrackedCategoryLabel(id: string): string {
  return (
    TRACKED_CATEGORIES.find((c) => c.id === id)?.label ?? id
  );
}

export function isTrackedCategory(id: string): id is TrackedCategory {
  return TRACKED_CATEGORIES.some((c) => c.id === id);
}
