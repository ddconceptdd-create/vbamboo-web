'use client';

import Image from 'next/image';
import { useRef, useState, useSyncExternalStore } from 'react';
import type { Dict, Locale } from '@/i18n';
import { submitEnquiry, type SubmitState } from '@/lib/submit';

export type FormProduct = {
  slug: string;
  name: string;
  image: string | null;
  cutout?: boolean;
  collection: string | null;
  finishes: { key: string; name: string }[];
  fabrics: { key: string; name: string }[];
};

const TYPES = ['purchase', 'project', 'partnership', 'general'] as const;

const subscribe = () => () => {};

/**
 * One concise form for purchase requests, projects, partnerships and questions.
 * Arriving from "Enquire to purchase" pre-fills the product and chosen version.
 */
export default function EnquiryForm(props: {
  products: FormProduct[];
  locale: Locale;
  dict: Dict['contact'];
  labels: { finish: string; upholstery: string };
}) {
  // The query string pre-fills the form; on the server it is unknown, so the
  // form re-mounts with the right values once the browser takes over.
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => '');
  return <EnquiryFormInner key={search} {...props} search={search} />;
}

function EnquiryFormInner({
  products,
  locale,
  dict,
  labels,
  search,
}: {
  products: FormProduct[];
  locale: Locale;
  dict: Dict['contact'];
  labels: { finish: string; upholstery: string };
  search: string;
}) {
  const init = (() => {
    const sp = new URLSearchParams(search);
    const ty = sp.get('type');
    const p = products.find((x) => x.slug === sp.get('product'));
    return {
      type: ty && (TYPES as readonly string[]).includes(ty) ? ty : p ? 'purchase' : 'general',
      product: p?.slug ?? '',
      finish: p ? (p.finishes.find((f) => f.key === sp.get('finish'))?.key ?? p.finishes[0]?.key ?? '') : '',
      fabric: p ? (p.fabrics.find((f) => f.key === sp.get('fabric'))?.key ?? p.fabrics[0]?.key ?? '') : '',
    };
  })();
  const [type, setType] = useState<string>(init.type);
  const [product, setProduct] = useState<string>(init.product);
  const [finish, setFinish] = useState<string>(init.finish);
  const [fabric, setFabric] = useState<string>(init.fabric);
  const [state, setState] = useState<SubmitState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const current = products.find((p) => p.slug === product);
  const showProduct = type === 'purchase' || (type === 'project' && !!current);

  const chooseProduct = (slug: string) => {
    setProduct(slug);
    const p = products.find((x) => x.slug === slug);
    setFinish(p?.finishes[0]?.key ?? '');
    setFabric(p?.fabrics[0]?.key ?? '');
  };

  const validate = (form: HTMLFormElement) => {
    const e: Record<string, string> = {};
    for (const el of Array.from(form.elements) as HTMLInputElement[]) {
      if (!el.name || el.type === 'hidden') continue;
      if (el.validity.valueMissing) e[el.name] = dict.required;
      else if (el.type === 'email' && el.validity.typeMismatch) e[el.name] = dict.invalidEmail;
    }
    if (type === 'purchase' && !product) e.productSlug = dict.required;
    return e;
  };

  // Errors clear as soon as a field becomes valid (while typing), and only a
  // malformed email is flagged on blur, so the layout never jumps mid-click.
  const onInput = (ev: React.FormEvent<HTMLFormElement>) => {
    const el = ev.target as unknown as HTMLInputElement;
    if (!el.name || !errors[el.name]) return;
    if (!el.validity.valid) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[el.name];
      return next;
    });
  };
  const onBlur = (ev: React.FocusEvent<HTMLFormElement>) => {
    const el = ev.target as unknown as HTMLInputElement;
    if (el.type === 'email' && el.value && el.validity.typeMismatch) setErrors((prev) => ({ ...prev, [el.name]: dict.invalidEmail }));
  };

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = form.querySelector<HTMLElement>(`[name="${Object.keys(e)[0]}"]`);
      first?.focus();
      return;
    }
    setState('sending');
    const data = Object.fromEntries(new FormData(form));
    const ok = await submitEnquiry({
      ...data,
      type,
      locale,
      product: current ? { slug: current.slug, name: current.name } : null,
      finish: current?.finishes.find((f) => f.key === finish)?.name ?? null,
      fabric: current?.fabrics.find((f) => f.key === fabric)?.name ?? null,
      pageUrl: window.location.href,
    });
    setState(ok ? 'sent' : 'error');
    if (ok) window.scrollTo({ top: (formRef.current?.offsetTop ?? 0) - 120, behavior: 'smooth' });
  }

  if (state === 'sent') {
    return (
      <div className="form-done" role="status" ref={formRef as unknown as React.RefObject<HTMLDivElement>}>
        <span className="logo logo--emblem form-done__mark" aria-hidden="true" />
        <h2 className="section-head__title">{dict.sent}</h2>
        {type === 'purchase' && <p className="prose">{dict.sentNext}</p>}
      </div>
    );
  }

  const err = (n: string) =>
    errors[n] ? (
      <p className="field__error" id={`err-${n}`}>
        {errors[n]}
      </p>
    ) : null;
  const aria = (n: string) => (errors[n] ? { 'aria-invalid': true, 'aria-describedby': `err-${n}` } : {});

  return (
    <form ref={formRef} className="form enquiry" onSubmit={onSubmit} onBlur={onBlur} onInput={onInput} onChange={onInput} noValidate>
      <fieldset className="field">
        <legend className="field__label">{dict.type}</legend>
        <div className="enquiry__types">
          {TYPES.map((k) => (
            <label key={k} className="chip-radio">
              <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} />
              <span>{dict.types[k]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {showProduct && (
        <div className="enquiry__product">
          {current?.image && (
            <div className={`enquiry__thumb media${current.cutout ? ' media--contain media--silhouette' : ''}`}>
              <Image src={current.image} alt="" fill sizes="160px" unoptimized={current.image.endsWith('.svg')} />
            </div>
          )}
          <div className="enquiry__product-fields">
            <div className="field">
              <label className="field__label" htmlFor="f-product">{dict.product}</label>
              <select id="f-product" name="productSlug" value={product} onChange={(e) => chooseProduct(e.target.value)} required={type === 'purchase'} {...aria('productSlug')}>
                <option value="">—</option>
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.collection ? `${p.name} · ${p.collection}` : p.name}
                  </option>
                ))}
              </select>
              {err('productSlug')}
            </div>
            {current && (current.finishes.length > 0 || current.fabrics.length > 0) && (
              <div className="form__row">
                {current.finishes.length > 0 && (
                  <div className="field">
                    <label className="field__label" htmlFor="f-finish">{labels.finish}</label>
                    <select id="f-finish" name="finishKey" value={finish} onChange={(e) => setFinish(e.target.value)}>
                      {current.finishes.map((f) => (
                        <option key={f.key} value={f.key}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {current.fabrics.length > 0 && (
                  <div className="field">
                    <label className="field__label" htmlFor="f-fabric">{labels.upholstery}</label>
                    <select id="f-fabric" name="fabricKey" value={fabric} onChange={(e) => setFabric(e.target.value)}>
                      {current.fabrics.map((f) => (
                        <option key={f.key} value={f.key}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="f-name">{dict.name}</label>
          <input id="f-name" name="name" autoComplete="name" required {...aria('name')} />
          {err('name')}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="f-company">
            {dict.company} <span className="field__opt">({dict.optional})</span>
          </label>
          <input id="f-company" name="company" autoComplete="organization" />
        </div>
      </div>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="f-email">{dict.email}</label>
          <input id="f-email" name="email" type="email" autoComplete="email" inputMode="email" required {...aria('email')} />
          {err('email')}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="f-phone">
            {dict.phone} <span className="field__opt">({dict.optional})</span>
          </label>
          <input id="f-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>
      {type === 'purchase' && (
        <div className="form__row">
          <div className="field">
            <label className="field__label" htmlFor="f-country">{dict.country}</label>
            <input id="f-country" name="delivery" autoComplete="country-name" required {...aria('delivery')} />
            {err('delivery')}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="f-qty">{dict.quantity}</label>
            <input id="f-qty" name="quantity" type="number" min={1} defaultValue={1} inputMode="numeric" />
          </div>
        </div>
      )}
      <div className="field">
        <label className="field__label" htmlFor="f-message">
          {dict.message} {type === 'purchase' && <span className="field__opt">({dict.optional})</span>}
        </label>
        <textarea id="f-message" name="message" rows={5} placeholder={dict.messagePh} required={type !== 'purchase'} {...aria('message')} />
        {err('message')}
      </div>
      <label className="check">
        <input type="checkbox" name="consent" required {...aria('consent')} />
        <span>{dict.consent}</span>
      </label>
      {err('consent')}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <div className="form__submit">
        <button className="btn" disabled={state === 'sending'}>
          {state === 'sending' ? dict.sending : dict.send}
        </button>
        {state === 'error' && <p className="form-error" role="alert">{dict.error}</p>}
      </div>
    </form>
  );
}
