/* Tessera's pricing, as data: the four plans, the full comparison, the FAQ.
   Prices are per member per month; yearly billing is ten months for twelve. */

export type Plan = {
  n: string;
  d: string;
  monthly: number | null;
  badge?: string;
  hot?: boolean;
  lead: string;
  f: { t: string; tag?: string }[];
  cta: string;
  note: string;
};

export const PLANS: Plan[] = [
  {
    n: 'Free', d: 'For one person, or a few friends, getting organised.', monthly: 0,
    lead: 'Get started with',
    f: [{ t: 'Unlimited pages and blocks' }, { t: 'Up to 10 guests' }, { t: '7-day page history' }, { t: 'Web clipper, desktop and mobile apps' }, { t: 'Import from Markdown, HTML and other wikis' }],
    cta: 'Get started', note: 'Free for as long as you like',
  },
  {
    n: 'Team', d: 'For teams that want docs, projects and decisions in one place.', monthly: 12, badge: 'Most popular', hot: true,
    lead: 'Everything in Free, plus',
    f: [{ t: 'Unlimited members and teamspaces' }, { t: 'Unlimited file uploads' }, { t: '90-day page history' }, { t: 'Verified pages', tag: 'New' }, { t: 'Permission groups' }, { t: 'Up to 100 guests' }],
    cta: 'Start free trial', note: '14 days free · no card needed',
  },
  {
    n: 'Business', d: 'For companies that need control over who sees what.', monthly: 24, badge: 'Best for 50+ people',
    lead: 'Everything in Team, plus',
    f: [{ t: 'SAML single sign-on' }, { t: 'Private teamspaces' }, { t: '1-year page history' }, { t: 'Page analytics and stale-page alerts' }, { t: 'Bulk PDF and HTML export' }, { t: 'Up to 250 guests' }],
    cta: 'Start free trial', note: '14 days free · no card needed',
  },
  {
    n: 'Enterprise', d: 'For organisations with security, compliance and scale needs.', monthly: null,
    lead: 'Everything in Business, plus',
    f: [{ t: 'SCIM user provisioning' }, { t: 'Audit log with SIEM export' }, { t: 'EU or US data residency' }, { t: 'Unlimited page history' }, { t: 'Workspace analytics' }, { t: 'A named success manager and 99.9% SLA' }],
    cta: 'Talk to sales', note: 'Annual contract · from 100 seats',
  },
];

/* true = included, false = not, a string = the limit */
export type Cell = boolean | string;
export const COMPARE: { g: string; rows: { t: string; hint?: string; v: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    g: 'Content',
    rows: [
      { t: 'Pages and blocks', v: ['Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { t: 'File uploads', v: ['5 MB each', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { t: 'Page history', v: ['7 days', '90 days', '1 year', 'Unlimited'] },
      { t: 'Databases, boards and timelines', v: [true, true, true, true] },
      { t: 'Synced blocks', hint: 'Edit once, update everywhere', v: [false, true, true, true] },
      { t: 'Verified pages', hint: 'An owner and a review date on every page', v: [false, true, true, true] },
    ],
  },
  {
    g: 'Collaboration',
    rows: [
      { t: 'Members', v: ['Up to 2', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { t: 'Guests', v: ['10', '100', '250', 'Custom'] },
      { t: 'Comments, mentions and reminders', v: [true, true, true, true] },
      { t: 'Teamspaces', v: ['1', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { t: 'Page analytics', v: [false, false, true, true] },
    ],
  },
  {
    g: 'Sharing and permissions',
    rows: [
      { t: 'Publish pages to the web', v: [true, true, true, true] },
      { t: 'Permission groups', v: [false, true, true, true] },
      { t: 'Private teamspaces', v: [false, false, true, true] },
      { t: 'Disable export, copy and guest invites', v: [false, false, false, true] },
    ],
  },
  {
    g: 'Admin and security',
    rows: [
      { t: 'Domain verification', v: [false, true, true, true] },
      { t: 'SAML single sign-on', v: [false, false, true, true] },
      { t: 'SCIM user provisioning', v: [false, false, false, true] },
      { t: 'Audit log', v: [false, false, '90 days', 'Unlimited, SIEM export'] },
      { t: 'Data residency', v: [false, false, false, 'EU or US'] },
    ],
  },
  {
    g: 'Support',
    rows: [
      { t: 'Help centre and community', v: [true, true, true, true] },
      { t: 'Email support', v: [false, '48 h', 'Priority, 8 h', 'Priority, 1 h'] },
      { t: 'Uptime SLA', v: [false, false, false, '99.9%'] },
      { t: 'Named success manager', v: [false, false, false, true] },
    ],
  },
];

export const FAQ: [string, string][] = [
  ['How does the free trial work?', 'Team and Business come with 14 days free for your whole workspace — no card needed. When the trial ends, choose a plan or drop back to Free. Nothing you wrote is deleted.'],
  ['Who counts as a member?', 'Anyone who can edit across your workspace. Guests — people you invite to individual pages, like a client or a contractor — are free up to your plan’s guest limit.'],
  ['Can I switch between monthly and yearly?', 'Yes, any time from Settings › Billing. Moving to yearly applies straight away with a prorated credit; moving to monthly takes effect at your renewal date.'],
  ['What happens to my pages if I downgrade?', 'Nothing is deleted. Features from the higher plan go read-only, and page history beyond your new plan’s window is kept for 30 days in case you change your mind.'],
  ['Do you have discounts for nonprofits and schools?', 'Registered nonprofits get 50% off Team and Business. Students and teachers get Team free with a school email address.'],
  ['Is Tessera AI included?', 'Tessera AI is an add-on at $8 per member per month on any paid plan. Every workspace gets 20 AI answers free to try it first.'],
  ['Where is my data stored?', 'In the US by default, or in the EU (Frankfurt) on Enterprise. Everything is encrypted at rest with AES-256 and in transit with TLS 1.2 or later.'],
  ['Can we pay by invoice?', 'Yes — yearly Business and Enterprise plans can pay by invoice in USD, EUR or GBP, with a purchase order if your finance team needs one.'],
];
