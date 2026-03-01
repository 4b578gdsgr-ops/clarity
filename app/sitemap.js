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
    ...companyUrls,
  ];
}
