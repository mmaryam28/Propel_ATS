// backend/src/coverletters/coverletters.research.service.ts
import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch'; // or native fetch if Node supports

@Injectable()
export class CompanyResearchService {
  async getCompanyInsights(companyName: string): Promise<string> {
    if (!companyName) return '';

    // 1) Try NewsAPI (optional, requires NEWS_API_KEY)
    const newsKey = process.env.NEWS_API_KEY;
    if (newsKey) {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
          companyName
        )}&sortBy=publishedAt&pageSize=3&apiKey=${newsKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.articles?.length) {
            const summaries = data.articles
              .slice(0, 3)
              .map((a: any) => `• ${a.title} (${a.source?.name || 'news'})`);
            return `Recent updates about ${companyName}:\n${summaries.join('\n')}`;
          }
        } else {
          console.warn('NewsAPI fetch failed', res.status);
        }
      } catch (err) {
        console.warn('NewsAPI error', err);
      }
    }

    // 2) Fallback: Wikipedia summary (no signup)
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        companyName
      )}`;
      const wres = await fetch(wikiUrl);
      if (wres.ok) {
        const wdata = await wres.json();
        const extract = wdata.extract || wdata.title || '';
        if (extract) {
          return `Background: ${extract}`;
        }
      }
    } catch (err) {
      console.warn('Wikipedia fetch failed', err);
    }

    // 3) Final fallback: canned sample (good for demo)
    return `${companyName} is a leader in its industry. Recent activity includes product launches and business expansion in its market.`;
  }
}
