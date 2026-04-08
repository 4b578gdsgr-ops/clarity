// Shared validation for service booking forms
export function validateBooking({ name, phone, email, contact_preference, address, issues, bikes, bike_details }) {
  const errs = {};

  // Name: min 2 chars, letters/spaces/hyphens/apostrophes
  const nameTrim = (name || '').trim();
  if (nameTrim.length < 2) {
    errs.name = nameTrim.length === 0 ? 'Required' : 'At least 2 characters';
  } else if (!/^[a-zA-Z\s'\-]+$/.test(nameTrim)) {
    errs.name = 'Letters and spaces only';
  }

  // Contact preference must be chosen first
  if (!contact_preference) {
    errs.contact_preference = 'Choose how to reach you';
  }

  // Phone: required only when contact preference is text
  if (contact_preference === 'text') {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length < 10) {
      errs.phone = digits.length === 0 ? 'Required' : 'Must be at least 10 digits';
    }
  }

  // Email: required only when contact preference is email
  if (contact_preference === 'email') {
    const emailTrim = (email || '').trim();
    const atIdx = emailTrim.indexOf('@');
    if (!emailTrim) {
      errs.email = 'Required';
    } else if (atIdx < 1 || !emailTrim.slice(atIdx + 1).includes('.')) {
      errs.email = 'Enter a valid email (e.g. you@example.com)';
    }
  }

  // Address: min 5 chars
  const addrTrim = (address || '').trim();
  if (addrTrim.length < 5) {
    errs.address = addrTrim.length === 0 ? 'Required' : 'Enter a complete address';
  }

  // At least one issue (from bikes array or legacy issues field)
  const effectiveIssues = bikes?.length > 0 ? bikes.flatMap(b => b.issues || []) : issues;
  if (!effectiveIssues || effectiveIssues.length === 0) {
    errs.issues = 'Select at least one';
  }

return errs;
}

export function isFormValid(fields) {
  return Object.keys(validateBooking(fields)).length === 0;
}
