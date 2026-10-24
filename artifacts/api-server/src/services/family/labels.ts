/**
 * Plain-English words for merchant categories, used in activity sentences
 * and policy lines. Unknown categories fall back to the raw category name.
 */
const CATEGORY_LABELS: Record<string, { plural: string; spentOn: string }> = {
  grocery: { plural: "Groceries", spentOn: "groceries" },
  bookstore: { plural: "Bookstores", spentOn: "books and supplies" },
  bar: { plural: "Bars", spentOn: "drinks" },
  liquor: { plural: "Liquor stores", spentOn: "alcohol" },
  gambling: { plural: "Gambling", spentOn: "gambling" },
  nightclub: { plural: "Nightclubs", spentOn: "a night out" },
  gaming: { plural: "Gaming", spentOn: "games" },
  rideshare: { plural: "Rideshare", spentOn: "a ride" },
  electronics: { plural: "Electronics", spentOn: "electronics" },
  movies: { plural: "Movies", spentOn: "a movie" },
};

/** "Liquor stores", "Gaming", … for a category list or chip. */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category]?.plural ?? category.charAt(0).toUpperCase() + category.slice(1);
}

/** What a purchase in this category was "spent on": "groceries", "a movie", … */
export function spentOnPhrase(category: string): string {
  return CATEGORY_LABELS[category]?.spentOn ?? category;
}

/** "a, b and c" */
export function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
