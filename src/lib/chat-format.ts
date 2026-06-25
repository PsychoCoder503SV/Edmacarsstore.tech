export type ChatLink = {
  href: string;
  label: string;
};

const PRODUCT_RE = /\/producto\/[a-z0-9-]+/gi;
const CATEGORY_RE = /\/categoria\/[a-z0-9-]+/gi;
const CATALOG_RE = /\/catalogo(?:\?[^\s]*)?/gi;

function uniquePaths(text: string, regex: RegExp): string[] {
  return [...new Set([...text.matchAll(regex)].map((m) => m[0].split("?")[0]))];
}

function stripProductMentions(text: string): string {
  return text
    .replace(
      /\s*(?:puedes encontrar(?:lo| más información)?(?: sobre este producto)?\s+)?(?:en la\s+|en el\s+)?URL\s*:?\s*\/producto\/[a-z0-9-]+\.?/gi,
      ""
    )
    .replace(/\s*(?:en la\s+|en el\s+)?URL\s*:?\s*\/producto\/[a-z0-9-]+\.?/gi, "")
    .replace(/\s*\/producto\/[a-z0-9-]+\.?/gi, "");
}

function stripCategoryMentions(text: string): string {
  return text
    .replace(/\s*(?:en la\s+)?URL\s*:?\s*\/categoria\/[a-z0-9-]+\.?/gi, "")
    .replace(/\s*\/categoria\/[a-z0-9-]+\.?/gi, "");
}

function stripCatalogMentions(text: string): string {
  return text.replace(/\s*(?:en el\s+)?URL\s*:?\s*\/catalogo(?:\?[^\s]*)?\.?/gi, "").replace(/\s*\/catalogo(?:\?[^\s]*)?\.?/gi, "");
}

function tidyText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .trim();
}

export function parseAssistantChat(text: string): { body: string; links: ChatLink[] } {
  const products = uniquePaths(text, PRODUCT_RE);
  const categories = uniquePaths(text, CATEGORY_RE);
  const catalogs = uniquePaths(text, CATALOG_RE);

  let body = text;
  body = stripProductMentions(body);
  body = stripCategoryMentions(body);
  body = stripCatalogMentions(body);
  body = tidyText(body);

  const links: ChatLink[] = [
    ...products.map((href) => ({ href, label: "Ver producto →" })),
    ...categories.map((href) => ({ href, label: "Ver categoría →" })),
    ...catalogs.map((href) => ({ href, label: "Ver catálogo →" })),
  ];

  return { body, links };
}