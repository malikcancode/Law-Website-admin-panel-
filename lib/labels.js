export const caseTypeLabels = {
  financial_fraud: 'Financial & commercial fraud',
  embezzlement: 'Embezzlement of company funds',
  funds_recovery: 'Recovery of owed funds',
  financial_disputes: 'Large financial disputes',
  other: 'Other',
};

export const labelForCaseType = (value, dynamicTypes = []) => {
  const fromSettings = dynamicTypes.find((c) => c.value === value);
  if (fromSettings) return fromSettings.label;
  return caseTypeLabels[value] || value || '—';
};

export const amountLabels = {
  unspecified: 'Not specified',
  under_100k: 'Under SAR 100k',
  '100k_500k': 'SAR 100k – 500k',
  '500k_1m': 'SAR 500k – 1M',
  over_1m: 'Over SAR 1M',
};

export const contactLabels = {
  call: 'Phone call',
  whatsapp: 'WhatsApp',
  email: 'Email',
};

export const statusLabels = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In progress',
  closed: 'Closed',
  rejected: 'Rejected',
};

export const statusOrder = ['new', 'contacted', 'in_progress', 'closed', 'rejected'];

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Riyadh',
});

export const formatDate = (d) => (d ? dateFmt.format(new Date(d)) : '—');

export const whatsappUrl = (phone) => `https://wa.me/${String(phone || '').replace(/\D/g, '')}`;
