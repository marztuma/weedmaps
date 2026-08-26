/* Emit a JSON-LD block.

   Rendered as a script tag rather than injected on the client, so crawlers that
   never run JavaScript still see it. Nulls are skipped so a caller can pass the
   result of a builder that decided there was nothing worth publishing. */
export default function JsonLd({ data }) {
  const blocks = (Array.isArray(data) ? data : [data]).filter(Boolean);
  if (!blocks.length) return null;

  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Content is built server-side from our own database, never from user
          // input. The escape guards against a "</script>" sequence inside a
          // product description closing the tag early.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
