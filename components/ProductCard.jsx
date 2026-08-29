import Link from "next/link";
import { QuickAdd } from "./AddToCart";
import ProductLabel from "./ProductLabel";
import Icon from "./Icons";
import { price } from "@/lib/money";

export function PriceTicket({ price: value, was, size = "md" }) {
  const off = was ? Math.round(((was - value) / was) * 100) : 0;
  return (
    <div className="flex items-baseline gap-2">
      <span className={`u-data font-semibold text-ink ${size === "lg" ? "text-[2rem]" : "text-[1.15rem]"}`}>
        {price(value)}
      </span>
      {was && (
        <>
          <s className="u-data text-[0.8rem] text-mute decoration-mute/70">{price(was)}</s>
          <span className="u-meta text-orange-text">−{off}%</span>
        </>
      )}
    </div>
  );
}

export default function ProductCard({ product, category, quickAdd = true }) {
  return (
    <div className="flex h-full flex-col">
    <Link href={`/product/${product.slug}`} className="group flex flex-1 flex-col">
      <div className="transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-y-1.5">
        <ProductLabel product={product} category={category ?? product.category} />
      </div>

      <div className="mt-3">
        <p className="u-meta truncate text-mute">{product.brand}</p>
        <h4 className="mt-1 truncate text-[0.95rem] font-bold leading-snug tracking-[-0.02em] text-ink decoration-orange/60 underline-offset-4 group-hover:underline">
          {product.name}
        </h4>
        <div className="mt-1.5">
          <PriceTicket price={product.price} was={product.was} />
        </div>
        <p className="u-meta mt-2 flex items-start gap-1.5 leading-relaxed text-shade">
          <Icon name="truck" size={12} className="mt-[3px] shrink-0 text-fade" />
          <span>
            {product.shop}
            <span className="text-fade"> · </span>
            <span className="whitespace-nowrap">{product.eta}</span>
          </span>
        </p>
      </div>
    </Link>
    {quickAdd && product.shopLive !== false && (
      <div className="mt-3 pt-0">
        <QuickAdd product={product} />
      </div>
    )}
    </div>
  );
}
