import { Controller, Get, Query } from "@nestjs/common";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

@Controller("research")
export class ResearchController {
  @Get()
  async getCompanyInfo(@Query("company") company: string) {
    if (!company) return { error: "Please provide a company name." };

    try {
      const searchURL = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        company + " company"
      )}&format=json`;
      const searchRes = await fetch(searchURL);
      const searchData: any = await searchRes.json();

      const firstMatch = searchData.query?.search?.[0];
      if (!firstMatch) return { error: "No Wikipedia page found." };

      const pageTitle = firstMatch.title;
      const wikiURL = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(
        pageTitle
      )}`;

      const wikiRes = await fetch(wikiURL);
      const html = await wikiRes.text();
      const $ = cheerio.load(html);

      const infobox: Record<string, string> = {};
      $("table.infobox tr").each((_, el) => {
        const key = $(el).find("th").text().trim();
        const value = $(el).find("td").text().replace(/\[\d+\]/g, "").trim();
        if (key && value) infobox[key] = value;
      });

      let introText = "";
      $("p").each((_, el) => {
        const text = $(el).text().replace(/\[\d+\]/g, "").trim();
        if (text && text.length > 60) {
          introText = text;
          return false; 
        }
      });
      if (!introText) introText = "No company description available.";

      const rssURL = `https://www.bing.com/news/search?q=${encodeURIComponent(
        company + " company"
      )}&format=rss`;
      const rssRes = await fetch(rssURL);
      const rssText = await rssRes.text();
      const $rss = cheerio.load(rssText, { xmlMode: true });

      const topNews: any[] = [];
      $rss("item").each((_, el) => {
        if (topNews.length < 5) {
          topNews.push({
            title: $rss(el).find("title").text(),
            link: $rss(el).find("link").text(),
            date: $rss(el).find("pubDate").text(),
            description: $rss(el).find("description").text(),
          });
        }
      });

const socialLinks: Record<string, string | null> = {
  linkedin: null,
  twitter: null,
  facebook: null,
  instagram: null,
  youtube: null,
};

async function searchSocial(domain: string, company: string): Promise<string | null> {
  try {
    const q = `${company} ${domain}`;
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    const html = await res.text();
    const $ = cheerio.load(html);


    let rawLink = $("a.result__a").attr("href");
    if (!rawLink) return null;

    if (rawLink.includes("duckduckgo.com/l/?uddg=") || rawLink.startsWith("/l/?uddg=")) {
      const match = rawLink.match(/uddg=([^&]+)/);
      if (match && match[1]) {
        rawLink = decodeURIComponent(match[1]);
      }
    }

    if (rawLink.startsWith("//")) {
      rawLink = "https:" + rawLink;
    }

    if (!rawLink.includes(domain)) return null;

    return rawLink;
  } catch (e) {
    return null;
  }
}

socialLinks.linkedin  = await searchSocial("linkedin.com", company);
socialLinks.twitter   = await searchSocial("twitter.com", company);
socialLinks.facebook  = await searchSocial("facebook.com", company);
socialLinks.instagram = await searchSocial("instagram.com", company);
socialLinks.youtube   = await searchSocial("youtube.com", company);


      const name = pageTitle;
      const industry = infobox["Industry"] || "Various industries";
      const headquarters =
        infobox["Headquarters"] || infobox["Head office"] || "Unknown location";
      const founded =
        infobox["Founded"] ||
        infobox["Formation"] ||
        infobox["Established"] ||
        "Unknown date";
      const keyPeople =
        infobox["Key people"] ||
        infobox["Founder"] ||
        infobox["CEO"] ||
        "Not listed";
      const employees =
        infobox["Number of employees"] || infobox["Employees"] || "Unknown";
      const revenue = infobox["Revenue"] || "Undisclosed";

      let products: string[] = [];
      const productsRow = $("table.infobox tr")
        .filter((_, el) => {
          const header = $(el).find("th").text().trim().toLowerCase();
          return header.includes("product") || header.includes("service");
        })
        .first();

      if (productsRow.length) {
        const items = productsRow.find("li").map((_, li) => $(li).text().trim()).get();
        if (items.length > 0) products = items;
        else {
          const raw = productsRow.find("td").text().replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
          products = raw ? raw.split(/[,•;]+/).map(p => p.trim()).filter(Boolean) : [];
        }
      }

      const description = introText || "No description available.";

      let summary = `${name} is a company `;
      if (industry !== "Various industries")
        summary += `operating in the ${industry.toLowerCase()} sector. `;
      if (headquarters !== "Unknown location")
        summary += `It is headquartered in ${headquarters}. `;
      if (founded !== "Unknown date")
        summary += `Founded in ${founded}, `;
      if (employees !== "Unknown")
        summary += `it employs approximately ${employees}. `;
      if (revenue !== "Undisclosed")
        summary += `The company reports a revenue of ${revenue}. `;
      if (keyPeople !== "Not listed")
        summary += `Key people include ${keyPeople}.`;

      summary = summary.trim();
      if (!summary.endsWith(".")) summary += ".";

      const result = {
        name,
        industry,
        headquarters,
        founded,
        keyPeople,
        employees,
        revenue,
        products,
        description,
        news: topNews,
        socialMedia: socialLinks,
        wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
        summary,
      };

      return result;

    } catch (err) {
      return { error: "Failed to generate company summary." };
    }
  }
}
