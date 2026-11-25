'use client';

import { useId, useState } from 'react';
import type { Dict, Locale } from '@/i18n';
import { submitEnquiry, type SubmitState } from '@/lib/submit';

/** Inline appointment request shown beside a store's details. */
export default function BookingForm({
  store,
  locale,
  dict,
  formDict,
}: {
  store: string;
  locale: Locale;
  dict: Dict['stores'];
  formDict: Dict['contact'];
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SubmitState>('idle');
  const [tomorrow] = useState(() => new Date(Date.now() + 864e5).toISOString().slice(0, 10));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setState('sending');
    const data = Object.fromEntries(new FormData(form));
    const ok = await submitEnquiry({ ...data, type: 'appointment', store, locale });
    setState(ok ? 'sent' : 'error');
  }

  if (state === 'sent') return <p className="form-success" role="status">{dict.booked}</p>;

  return (
    <div className="booking">
      <button type="button" className="btn" aria-expanded={open} aria-controls={`${id}-form`} onClick={() => setOpen((v) => !v)}>
        {dict.book}
      </button>
      <form id={`${id}-form`} className="booking__form form" hidden={!open} onSubmit={onSubmit} noValidate={false}>
        <p className="eyebrow">{dict.bookTitle} · {store}</p>
        <div className="form__row">
          <Field id={`${id}-date`} label={dict.date}>
            <input id={`${id}-date`} name="date" type="date" min={tomorrow} required />
          </Field>
          <fieldset className="field">
            <legend className="field__label">{dict.time}</legend>
            <div className="radio-row">
              <label className="radio"><input type="radio" name="slot" value="morning" defaultChecked /> {dict.morning}</label>
              <label className="radio"><input type="radio" name="slot" value="afternoon" /> {dict.afternoon}</label>
            </div>
          </fieldset>
        </div>
        <div className="form__row">
          <Field id={`${id}-name`} label={formDict.name}>
            <input id={`${id}-name`} name="name" autoComplete="name" required />
          </Field>
          <Field id={`${id}-email`} label={formDict.email}>
            <input id={`${id}-email`} name="email" type="email" autoComplete="email" required />
          </Field>
        </div>
        <Field id={`${id}-phone`} label={`${formDict.phone} (${formDict.optional})`}>
          <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" />
        </Field>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? formDict.sending : dict.book}</button>
        {state === 'error' && <p className="form-error" role="alert">{formDict.error}</p>}
      </form>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
