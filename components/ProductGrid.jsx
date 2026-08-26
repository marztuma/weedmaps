import Reveal from "./Reveal";
import ProductCard from "./ProductCard";
import Icon from "./Icons";

export default function ProductGrid({ products, emptyTitle, emptyBody, emptyAction }) {
  if (!products.length) {
    return (
      <div className="border-t border-rule py-20 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rule text-fade">
          <Icon name="search" size={24} />
        </span>
        <p className="u-heading mt-5 text-[1.35rem]">{emptyTitle ?? "Nothing here yet."}</p>
        <p className="u-prose mx-auto mt-2 text-[0.95rem] text-shade">
          {emptyBody ?? "No products match that combination right now."}
        </p>
        {emptyAction}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => (
        <Reveal as="li" key={p.id} index={Math.min(i % 5, 4)} className="h-full">
          <ProductCard product={p} />
        </Reveal>
      ))}
    </ul>
  );
}
