// Shared validation for service booking forms
export function validateBooking({ name, phone, email, contact_preference, address, issues, bike_details }) {
  const errs = {};

  // Name: min 2 chars, letters/spaces/hyphens/apostrophes
  const nameTrim = (name || '').trim();
  if (nameTrim.length < 2) {
    errs.name = nameTrim.length === 0 ? 'Required' : 'At least 2 characters';
  } else if (!/^[a-zA-Z\s'\-]+$/.test(nameTrim)) {
    errs.name = 'Letters and spaces only';
  }

  // Phone: strip non-digits, must be >= 10 digits
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10) {
    errs.phone = digits.length === 0 ? 'Required' : 'Must be at least 10 digits';
  }

  // Email: must have @ and a dot after the @
  const emailTrim = (email || '').trim();
  const atIdx = emailTrim.indexOf('@');
  if (!emailTrim) {
    errs.email = 'Required';
  } else if (atIdx < 1 || !emailTrim.slice(atIdx + 1).includes('.')) {
    errs.email = 'Enter a valid email (e.g. you@example.com)';
  }

  // Contact preference
  if (!contact_preference) {
    errs.contact_preference = 'Choose how to reach you';
  }

  // Address: min 5 chars
  const addrTrim = (address || '').trim();
  if (addrTrim.length < 5) {
    errs.address = addrTrim.length === 0 ? 'Required' : 'Enter a complete address';
  }

  // At least one issue
  if (!issues || issues.length === 0) {
    errs.issues = 'Select at least one';
  }

  // Bike details required for new bike assembly
  if (issues && issues.includes('New bike assembly')) {
    if (!(bike_details || '').trim()) {
      errs.bike_details = 'Please tell us about the bike';
    }
  }

  return errs;
}

export function isFormValid(fields) {
  return Object.keys(validateBooking(fields)).length === 0;
}
