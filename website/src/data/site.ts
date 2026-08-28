export const site = {
  name: 'Dictionary on Click',
  url: 'https://dictionary-on-click.bishwodahal.com',
  version: '0.1.2',
  author: 'Bishwo Dahal',
  description:
    'Look up word definitions without leaving the page. Double-click any word for a definition bubble. Free Firefox and Chrome extension with no API keys and local-only data.',
  github: 'https://github.com/bishwo-dahal/dictionary_on_click',
  githubIssues: 'https://github.com/bishwo-dahal/dictionary_on_click/issues',
  buildMd:
    'https://github.com/bishwo-dahal/dictionary_on_click/blob/main/BUILD.md',
  licenseUrl: 'https://www.mozilla.org/MPL/2.0/',
  firefox:
    'https://addons.mozilla.org/en-US/firefox/addon/dictionary-on-click/',
  chrome:
    'https://chromewebstore.google.com/detail/dictionary-on-click/hmjpafbglgihbbfamlljmcempfhfchjm',
  firefoxMin: '142',
  chromeMin: '120',
  license: 'MPL-2.0',
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/features', label: 'Features' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/install', label: 'Install' },
  { href: '/about', label: 'About' },
] as const;

export const faqs = [
  {
    q: 'Does it work on Firefox and Chrome?',
    a: 'Yes. Firefox 142 and newer, and Chrome 120 and newer. Same lookup behavior in both. Install from Firefox Add-ons or the Chrome Web Store.',
  },
  {
    q: 'Does it need an API key?',
    a: 'No. It uses public dictionary APIs (Wiktionary, Free Dictionary API, and Datamuse) with a fallback chain. You do not create an account.',
  },
  {
    q: 'Does it work offline?',
    a: 'Words you have already looked up can come from the local IndexedDB cache. It does not ship a full dictionary, so a first lookup still needs a network request.',
  },
  {
    q: 'What permissions does it ask for?',
    a: 'Storage, plus narrow host permissions for the dictionary APIs. It does not ask to read every site you visit as a broad "<all_urls>" data-collection product. See the Privacy page for the full list.',
  },
  {
    q: 'Where do definitions come from?',
    a: 'Wiktionary is first, then Free Dictionary API, then Datamuse. Wiktionary text is available under CC BY-SA. Attribution lives on the Privacy page.',
  },
] as const;
