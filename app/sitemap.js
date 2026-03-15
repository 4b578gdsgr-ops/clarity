import { getAllCompanies } from '../lib/companies';

const BASE_URL = 'https://loveovermoney.oneloveoutdoors.org';

export default function sitemap() {
  const companies = getAllCompanies();

  const companyUrls = companies.map(company => ({
    url: `${BASE_URL}/company/${company.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/find-a-shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/fix-or-ride`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/custom-builds`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/membership`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/corporate`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    ...companyUrls,
  ];
}
