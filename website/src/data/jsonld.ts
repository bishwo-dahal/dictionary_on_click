import { site } from './site';

export function orgGraph(pagePath: string, extras: Record<string, unknown>[] = []) {
  const pageUrl = pagePath === '/' ? site.url : `${site.url}${pagePath}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site.url}/#org`,
        name: site.name,
        url: site.url,
        founder: { '@type': 'Person', name: site.author },
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        name: site.name,
        url: site.url,
        publisher: { '@id': `${site.url}/#org` },
        inLanguage: 'en',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${site.url}/#app`,
        name: site.name,
        applicationCategory: 'BrowserApplication',
        operatingSystem: 'Firefox, Chrome',
        softwareVersion: site.version,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: site.url,
        downloadUrl: [site.firefox, site.chrome],
        author: { '@type': 'Person', name: site.author },
        license: 'https://www.mozilla.org/MPL/2.0/',
      },
      ...extras,
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        isPartOf: { '@id': `${site.url}/#website` },
      },
    ],
  };
}

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.path === '/' ? site.url : `${site.url}${item.path}`,
    })),
  };
}
