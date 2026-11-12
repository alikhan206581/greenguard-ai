import React from "react";

export type SchemaType =
  | "WebSite"
  | "Organization"
  | "SoftwareApplication"
  | "BreadcrumbList"
  | "FAQPage";

interface SchemaMarkupProps {
  type?: SchemaType;
  data: Record<string, unknown>;
}

export function SchemaMarkup({ type, data }: SchemaMarkupProps) {
  const schema = {
    "@context": "https://schema.org",
    ...(type ? { "@type": type } : {}),
    ...data,
  };

  const jsonString = JSON.stringify(schema).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
