'use client';

export type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

export async function submitEnquiry(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
