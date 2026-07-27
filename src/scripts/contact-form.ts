/**
 * Contact form → Framer Forms API (same backend as viniciusramos.com/contact).
 * Requires proof-of-work headers + FormData field names Name / Email / Message.
 */

const POW_SALT = 'framer';
const POW_DIFFICULTY = 3;
const POW_TOKEN_LENGTH = 30;
const POW_MAX_TIME_MS = 10_000;
const HONEYPOT_PREFIX = '__framer';
const HONEYPOT_NAMES = [
  'website',
  'company',
  'message',
  'subject',
  'title',
  'description',
  'feedback',
  'notes',
  'details',
  'remarks',
  'comments',
] as const;

type FormStatus = 'idle' | 'pending' | 'success' | 'error';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

/** Framer POW: SHA-256(salt + `${Date.now()}:${token}`) starts with N zeros. */
async function calculateProofOfWork(): Promise<string> {
  const target = '0'.repeat(POW_DIFFICULTY);
  const start = performance.now();

  while (performance.now() - start < POW_MAX_TIME_MS) {
    const secret = `${Date.now()}:${randomToken(POW_TOKEN_LENGTH)}`;
    const hash = await sha256Hex(POW_SALT + secret);
    if (hash.startsWith(target)) return secret;
  }

  throw new Error('Failed to calculate proof of work');
}

function setStatus(form: HTMLFormElement, status: FormStatus, message?: string) {
  form.dataset.status = status;
  form.setAttribute('aria-busy', status === 'pending' ? 'true' : 'false');

  const submit = form.querySelector<HTMLButtonElement>('[data-contact-submit]');
  const label = form.querySelector<HTMLElement>('[data-contact-submit-label]');
  const statusEl = form.querySelector<HTMLElement>('[data-contact-status]');

  if (submit) {
    // Keep enabled for magnetic hit-area sizing; block re-submit via status check.
    // Framer disables interaction on pending/success via variant, not :disabled.
    submit.disabled = false;
    submit.setAttribute(
      'aria-disabled',
      status === 'pending' || status === 'success' ? 'true' : 'false',
    );
    submit.setAttribute(
      'aria-label',
      status === 'pending'
        ? 'Sending'
        : status === 'success'
          ? 'Message sent'
          : status === 'error'
            ? 'Try again'
            : 'Submit',
    );
  }

  // Label stays "Submit" visually; pending/success morph hides it via CSS.
  if (label) {
    label.textContent = status === 'error' ? 'Try again' : 'Submit';
  }

  if (statusEl) {
    // Visible only on error — success feedback is the check circle.
    if (status === 'error') {
      statusEl.hidden = false;
      statusEl.dataset.tone = 'error';
      statusEl.textContent =
        message ?? 'Something went wrong. Please try again.';
    } else if (status === 'success') {
      statusEl.hidden = false;
      statusEl.dataset.tone = 'success';
      statusEl.textContent = message ?? 'Message sent.';
    } else {
      statusEl.hidden = true;
      statusEl.textContent = '';
      delete statusEl.dataset.tone;
    }
  }
}

async function submitForm(form: HTMLFormElement): Promise<void> {
  const action = form.dataset.action;
  const siteId = form.dataset.siteId;
  if (!action || !siteId) {
    throw new Error('Missing form action or site id');
  }

  // Honeypot: if filled, pretend success (bot trap)
  const traps = form.querySelectorAll<HTMLInputElement>('[data-honeypot]');
  for (const trap of traps) {
    if (trap.value.trim()) {
      setStatus(form, 'success');
      form.reset();
      return;
    }
  }

  setStatus(form, 'pending');

  const fd = new FormData();
  const name = (form.elements.namedItem('Name') as HTMLInputElement)?.value?.trim() ?? '';
  const email = (form.elements.namedItem('Email') as HTMLInputElement)?.value?.trim() ?? '';
  const message =
    (form.elements.namedItem('Message') as HTMLTextAreaElement)?.value?.trim() ?? '';

  fd.append('Name', name);
  fd.append('Email', email);
  fd.append('Message', message);

  for (const key of HONEYPOT_NAMES) {
    fd.append(`${HONEYPOT_PREFIX}_${key}`, '');
  }

  const secret = await calculateProofOfWork();
  const fields = Array.from(fd.keys()).map(encodeURIComponent).join(',');

  const res = await fetch(action, {
    method: 'POST',
    body: fd,
    headers: {
      'Framer-Site-Id': siteId,
      'Framer-POW': secret,
      'Framer-Form-Fields': fields,
    },
  });

  if (!res.ok) {
    let detail = 'Failed to submit form';
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) detail = body.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  setStatus(form, 'success');
  form.reset();
}

function bindForm(form: HTMLFormElement) {
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = form.dataset.status;
    if (status === 'pending' || status === 'success') return;

    void submitForm(form).catch((err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setStatus(form, 'error', message);
    });
  });
}

export function initContactForm(root: ParentNode = document) {
  root.querySelectorAll<HTMLFormElement>('[data-contact-form]').forEach(bindForm);
}

initContactForm();
document.addEventListener('astro:page-load', () => initContactForm());
