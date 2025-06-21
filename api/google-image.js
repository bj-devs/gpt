import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Missing 'query' parameter" });

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    const usp = new URLSearchParams({
      as_st: 'y',
      as_q: query,
      imgsz: 'l',
      imgtype: 'jpg',
      udm: '2',
    });

    await page.goto(`https://www.google.com/search?${usp}`, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('img');

    const images = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('img'));
      return items.slice(0, 50).map(img => ({
        title: img.alt || null,
        imageUrl: img.src || null,
        width: img.naturalWidth || null,
        height: img.naturalHeight || null,
        imageSize: null,
        referer: document.location.href,
        aboutUrl: img.closest('a')?.href || null
      }));
    });

    res.status(200).json({ query, total: images.length, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
}
