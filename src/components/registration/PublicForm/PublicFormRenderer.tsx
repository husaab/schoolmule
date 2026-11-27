'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import DOMPurify from 'dompurify';
import Link from 'next/link';
import Image from 'next/image';
import type { PublicFormChildren, PublicFormData } from '@/services/types/registration';
import { getPublicFormChildren, submitPublicForm } from '@/services/registrationPublicService';
import { formatCents } from '@/lib/paymentField';
import { priceWithTax } from '@/lib/paymentTax';
import type { ChargeTax } from '@/services/types/payments';
import FormField from './FormField';
import PaymentFieldInput from './PaymentFieldInput';
import SuccessMessage from './SuccessMessage';
import ChildPicker from './ChildPicker';
import EmbeddedStripePayment from '@/components/payments/EmbeddedStripePayment';
import { canPayHere, stripePublishableKey } from '@/lib/stripeEmbedded';

interface Props {
  form: PublicFormData;
}

export default function PublicFormRenderer({ form }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The payment field, if the form has one: optional items ticked, and how the family will pay.
  const paymentField = form.fields.find((f) => f.fieldType === 'payment' && f.payment) ?? null;
  const online = Boolean(form.payments?.online);
  const [picked, setPicked] = useState<string[]>([]);
  const [method, setMethod] = useState<'card' | 'offline'>(online || !paymentField?.payment?.allowOffline ? 'card' : 'offline');
  // What the family pays, with any added tax (the server prices it again).
  const price = paymentField ? priceWithTax(paymentField.payment, picked) : null;
  const total = price?.totalCents ?? 0;
  const cantPay = total > 0 && !online && !paymentField?.payment?.allowOffline;
  // Set when the family chose the office, for the confirmation.
  const [owedAtOffice, setOwedAtOffice] = useState<{ totalCents: number; payPath: string; taxes?: ChargeTax[] } | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  // Paying inside this page (Stripe's embedded form) after the form is sent.
  const payHere = online && canPayHere(stripePublishableKey(), form.payments?.testMode);
  const [paying, setPaying] = useState<{ token: string; totalCents: number; payPath: string } | null>(null);
  // A signed-in parent's children at this school, and the one it is for.
  const [kids, setKids] = useState<PublicFormChildren['children']>([]);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getPublicFormChildren(form.schoolSlug, form.slug).then((r) => {
      if (!live || !r.signedIn) return;
      setKids(r.children);
      if (r.children.length === 1) setStudentId(r.children[0].studentId);
    });
    return () => { live = false; };
  }, [form.schoolSlug, form.slug]);

  const { register, handleSubmit, formState: { errors } } = useForm<Record<string, string>>();

  // Check if user is logged in (has auth token)
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

  if (submitted) {
    return <SuccessMessage schoolName={form.schoolName} payAtOffice={owedAtOffice} />;
  }

  if (paying) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 border-t-4 border-t-cyan-500 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-emerald-700">Your form was received.</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Pay {formatCents(paying.totalCents)}</h1>
          <p className="mb-5 text-sm text-slate-500">{form.title} · {form.schoolName}</p>
          <EmbeddedStripePayment
            token={paying.token}
            onPaid={() => window.location.assign(paying.payPath)}
            onUnavailable={() => window.location.assign(paying.payPath)}
          />
        </div>
      </div>
    );
  }

  const onSubmit = async (data: Record<string, string>) => {
    if (cantPay) {
      setError(`This school can’t take payments online right now. Please contact ${form.schoolName}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const paysCard = total > 0 && method === 'card';
      const choice = paymentField
        ? { itemIds: picked, method: total > 0 ? method : 'card' as const, ...(paysCard && payHere ? { ui: 'embedded' as const } : {}) }
        : null;
      const res = await submitPublicForm(form.schoolSlug, form.slug, data, {}, choice, studentId);
      const payment = res.data?.payment;
      if (payment && payment.method === 'card' && payHere) {
        // Stripe's form right here; if it can't load, the family's own link offers Stripe's page.
        setPaying({ token: payment.token, totalCents: payment.totalCents, payPath: payment.payPath });
        return;
      }
      if (payment && payment.method === 'card') {
        // On to Stripe's page; if Stripe couldn't open one, the family's own link offers it again.
        setRedirecting(true);
        window.location.assign(payment.checkoutUrl || payment.payPath);
        return;
      }
      if (payment && payment.method === 'offline') {
        // The tax rows are this page's own sums; shown only when they come to the server's total.
        const taxes = price && price.totalCents === payment.totalCents ? price.taxes : [];
        setOwedAtOffice({ totalCents: payment.totalCents, payPath: payment.payPath, taxes });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sanitizedDescription = form.description
    ? DOMPurify.sanitize(
        form.description
          .replace(/&nbsp;/g, ' ')
          .replace(/\s*style="[^"]*"/g, '')
      )
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Nav */}
      <nav className="flex items-center justify-between mb-6">
        <Link href="/">
          <Image
            src="/logo/trimmedlogo.png"
            alt="SchoolMule"
            width={200}
            height={60}
            className="h-16 w-auto"
          />
        </Link>
        {isLoggedIn && (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            Dashboard &rarr;
          </Link>
        )}
      </nav>

      {/* Banner Image */}
      {form.bannerImageUrl && (
        <div className="rounded-t-2xl overflow-hidden mb-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.bannerImageUrl}
            alt={`${form.title} banner`}
            className="w-full h-48 sm:h-56 object-cover"
          />
        </div>
      )}

      {/* Title & Description Card */}
      <div className={`bg-white border border-slate-200 p-6 sm:p-8 shadow-sm ${
        form.bannerImageUrl ? 'rounded-b-2xl border-t-4 border-t-cyan-500' : 'rounded-2xl border-t-4 border-t-cyan-500'
      }`}>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {form.title}
        </h1>
        <p className="text-sm text-slate-500 mb-4">{form.schoolName}</p>

        {sanitizedDescription && (
          <div
            className="prose prose-slate max-w-none text-slate-700 [&_p]:my-4 [&_p:empty]:my-0 [&_p:has(br:only-child)]:h-5 [&_p:has(br:only-child)]:my-0"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        )}

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-red-500">* Indicates required question</p>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {/* Honeypot fields (hidden from humans, visible to bots) */}
        <div className="hidden" aria-hidden="true">
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
          <input type="text" tabIndex={-1} autoComplete="off" {...register('url')} />
          <input type="text" tabIndex={-1} autoComplete="off" {...register('homepage')} />
        </div>

        <ChildPicker childrenList={kids} value={studentId} onChange={setStudentId} />

        {form.fields.map((field, index) => (
          field.fieldType === 'payment' ? (
            <PaymentFieldInput
              key={field.fieldId}
              field={field}
              index={index}
              picked={picked}
              onPick={setPicked}
              method={method}
              onMethod={setMethod}
              online={online}
              schoolName={form.schoolName}
            />
          ) : (
            <FormField
              key={field.fieldId}
              field={field}
              register={register}
              errors={errors}
              index={index}
            />
          )
        ))}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting || redirecting || cantPay}
            className="px-8 py-3 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {redirecting
              ? 'Opening the payment page…'
              : submitting
                ? 'Submitting...'
                : total > 0 && method === 'card'
                  ? `Submit and pay ${formatCents(total)}`
                  : 'Submit'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          Powered by{' '}
          <a href="https://schoolmule.ca" className="font-medium hover:text-slate-600">
            SchoolMule
          </a>
        </p>
      </div>
    </div>
  );
}
