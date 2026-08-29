"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { SubmitButton, StateNotice } from "./FormState";
import ConfirmSubmit from "./ConfirmSubmit";
import ImagePicker from "./ImagePicker";

const STRAINS = ["Indica", "Sativa", "Hybrid", "Topical", "Accessory"];
const COLORWAYS = [
  ["linen", "Linen"], ["ink", "Ink"], ["orange", "Orange"],
  ["purple", "Purple"], ["green", "Green"],
];

export default function ProductForm({
  action, product, brands, categories, subcategories, shops, deleteAction, manifest = {},
}) {
  const [state, formAction] = useActionState(action, {});
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [colorway, setColorway] = useState(product?.colorway ?? "linen");
  const [price, setPrice] = useState(product ? (product.priceCents / 100).toString() : "");
  const [was, setWas] = useState(product?.wasPriceCents ? (product.wasPriceCents / 100).toString() : "");

  const subs = useMemo(
    () => subcategories.filter((s) => String(s.categoryId) === String(categoryId)),
    [subcategories, categoryId]
  );

  const discount = useMemo(() => {
    const p = Number(price), w = Number(was);
    if (!p || !w || w <= p) return null;
    return Math.round(((w - p) / w) * 100);
  }, [price, was]);

  return (
    <form action={formAction}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <StateNotice state={state} />

      <div className="wp-grid" style={{ gridTemplateColumns: "minmax(0,1fr)", gap: 20 }}>
        <div className="wp-box">
          <div className="wp-box-head">Product details</div>
          <div className="wp-box-body">
            <div className="wp-field">
              <label className="wp-label" htmlFor="name">
                Product name <span className="wp-required">*</span>
              </label>
              <input
                id="name" name="name" className="wp-input" required
                defaultValue={product?.name ?? state?.values?.name ?? ""}
                placeholder="e.g. Lemon Cherry Gelato"
              />
              <p className="wp-help">The strain or product name as it appears on the shelf.</p>
            </div>

            <div className="wp-form-row wp-form-row-3">
              <div className="wp-field">
                <label className="wp-label" htmlFor="brandId">Brand <span className="wp-required">*</span></label>
                <select id="brandId" name="brandId" className="wp-select" required defaultValue={product?.brandId ?? ""}>
                  <option value="">— Select —</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="wp-field">
                <label className="wp-label" htmlFor="categoryId">Category <span className="wp-required">*</span></label>
                <select
                  id="categoryId" name="categoryId" className="wp-select" required
                  value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="wp-field">
                <label className="wp-label" htmlFor="subcategoryId">Subcategory</label>
                <select
                  id="subcategoryId" name="subcategoryId" className="wp-select"
                  defaultValue={product?.subcategoryId ?? ""} disabled={!subs.length}
                >
                  <option value="">{subs.length ? "— None —" : "Pick a category first"}</option>
                  {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="wp-field">
              <label className="wp-label" htmlFor="shopId">
                Delivered by <span className="wp-required">*</span>
              </label>
              <select id="shopId" name="shopId" className="wp-select" required defaultValue={product?.shopId ?? ""}>
                <option value="">— Select a delivery service —</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.deliveringNow ? "" : " (paused)"}
                  </option>
                ))}
              </select>
              <p className="wp-help">
                Every product belongs to one delivery service. This product has no pickup.
              </p>
            </div>
          </div>
        </div>

        <div className="wp-box">
          <div className="wp-box-head">Pricing</div>
          <div className="wp-box-body">
            <div className="wp-form-row wp-form-row-3">
              <div className="wp-field">
                <label className="wp-label" htmlFor="price">Price ($) <span className="wp-required">*</span></label>
                <input
                  id="price" name="price" className="wp-input" required inputMode="decimal"
                  value={price} onChange={(e) => setPrice(e.target.value)} placeholder="42"
                />
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="was">Was ($)</label>
                <input
                  id="was" name="was" className="wp-input" inputMode="decimal"
                  value={was} onChange={(e) => setWas(e.target.value)} placeholder="Leave empty if not on sale"
                />
                <p className="wp-help">
                  {discount != null
                    ? `Shows as −${discount}% on the storefront.`
                    : "Set higher than the price to put this product on sale."}
                </p>
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="weight">Weight / size</label>
                <input id="weight" name="weight" className="wp-input" defaultValue={product?.weight ?? "3.5g"} />
              </div>
            </div>
          </div>
        </div>

        <div className="wp-box">
          <div className="wp-box-head">Stock</div>
          <div className="wp-box-body">
            <div className="wp-form-row wp-form-row-2">
              <div className="wp-field">
                <label className="wp-label" htmlFor="stockQty">Units on hand</label>
                <input
                  id="stockQty"
                  name="stockQty"
                  className="wp-input"
                  inputMode="numeric"
                  placeholder="Leave blank if you do not count this"
                  defaultValue={product?.stockQty ?? ""}
                />
                <p className="wp-help">
                  Blank means untracked and never blocks an order. Zero marks it out of
                  stock and removes the add button.
                </p>
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="lowStockAt">Warn at</label>
                <input
                  id="lowStockAt"
                  name="lowStockAt"
                  className="wp-input"
                  inputMode="numeric"
                  defaultValue={product?.lowStockAt ?? 5}
                />
                <p className="wp-help">
                  At or below this, the product is flagged low here and on the shelf.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="wp-box">
          <div className="wp-box-head">Potency &amp; classification</div>
          <div className="wp-box-body">
            <div className="wp-form-row wp-form-row-3">
              <div className="wp-field">
                <label className="wp-label" htmlFor="thc">THC %</label>
                <input id="thc" name="thc" className="wp-input" inputMode="decimal" defaultValue={product ? Number(product.thc) : 0} />
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="cbd">CBD %</label>
                <input id="cbd" name="cbd" className="wp-input" inputMode="decimal" defaultValue={product ? Number(product.cbd) : 0} />
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="strainType">Strain type</label>
                <select id="strainType" name="strainType" className="wp-select" defaultValue={product?.strainType ?? "Hybrid"}>
                  {STRAINS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="wp-field">
              <label className="wp-label" htmlFor="description">Description</label>
              <textarea
                id="description" name="description" className="wp-textarea"
                defaultValue={product?.description ?? ""}
                style={{ minHeight: 120 }}
              />
              <p className="wp-help">Shown on the product page. Written for this catalogue.</p>
            </div>

            <div className="wp-form-row wp-form-row-2">
              <div className="wp-field">
                <label className="wp-label" htmlFor="effects">Reported effects</label>
                <input id="effects" name="effects" className="wp-input"
                  defaultValue={(product?.effects ?? []).join(", ")} placeholder="Relaxed, Happy" />
                <p className="wp-help">Comma separated.</p>
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="flavors">Tastes like</label>
                <input id="flavors" name="flavors" className="wp-input"
                  defaultValue={(product?.flavors ?? []).join(", ")} placeholder="citrus, sweet cream" />
                <p className="wp-help">Comma separated.</p>
              </div>
            </div>

            <div className="wp-field">
              <label className="wp-label" htmlFor="tags">Tags</label>
              <input
                id="tags" name="tags" className="wp-input"
                defaultValue={(product?.tags ?? []).join(", ")}
                placeholder="Top shelf, New drop, Deal"
              />
              <p className="wp-help">Comma separated. Shown as pills on the product page.</p>
            </div>
          </div>
        </div>

        <ImagePicker
          manifest={manifest}
          category={categories.find((c) => String(c.id) === String(categoryId))?.slug ?? ""}
          current={product?.imageAvif ?? ""}
        />

        <div className="wp-box">
          <div className="wp-box-head">Label appearance (used when no photo is chosen)</div>
          <div className="wp-box-body">
            <p className="wp-help" style={{ marginTop: 0, marginBottom: 10 }}>
              No product photography ships in this build — each product renders as an authored
              package label in one of five colourways.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {COLORWAYS.map(([value, labelText]) => (
                <label key={value} className="wp-check" style={{
                  border: `1px solid ${colorway === value ? "var(--wp-blue)" : "var(--wp-border)"}`,
                  borderRadius: 3, padding: "8px 10px", cursor: "pointer",
                  boxShadow: colorway === value ? "0 0 0 1px var(--wp-blue)" : "none",
                }}>
                  <input
                    type="radio" name="colorway" value={value}
                    checked={colorway === value} onChange={() => setColorway(value)}
                  />
                  <span aria-hidden="true" style={{
                    width: 16, height: 20, borderRadius: 2, display: "inline-block",
                    background: { linen: "#f2ece7", ink: "#141314", orange: "#f15a26", purple: "#7755a3", green: "#419b45" }[value],
                    border: "1px solid var(--wp-border)",
                  }} />
                  {labelText}
                </label>
              ))}
            </div>

            <label className="wp-check" style={{ marginTop: 16 }}>
              <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} />
              Feature this product on the homepage shelf
            </label>

            <input type="hidden" name="distance" value={product ? Number(product.distanceMi) : 2} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 4 }}>
        <SubmitButton pendingLabel={product ? "Updating…" : "Publishing…"}>
          {product ? "Update Product" : "Publish Product"}
        </SubmitButton>
        <Link href="/admin/products" className="wp-btn wp-btn-lg">Cancel</Link>

        {product && deleteAction && (
          <span style={{ marginLeft: "auto" }}>
            <ConfirmSubmit
              className="wp-btn wp-btn-danger wp-btn-lg"
              message={`Delete “${product.name}” permanently? This cannot be undone.`}
              form="delete-this-product"
            >
              Move to Trash
            </ConfirmSubmit>
          </span>
        )}
      </div>
    </form>
  );
}
