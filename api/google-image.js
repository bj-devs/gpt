import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: "Missing 'query' parameter" });
  }

  let browser, page;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
    });
    page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)…Chrome/136.0.0.0 Safari/537.36'
    });
    const usp = new URLSearchParams({
      as_st: 'y', as_q: query, imgsz: 'l', imgtype: 'jpg', udm: '2'
    });
    await page.goto(`https://www.google.com/search?${usp}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('img'); // wait for images to render

    const images = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('img'));
      return items.slice(0, 50).map(img => {
        return {
          title: img.alt || null,
          imageUrl: img.src || null,
          width: img.naturalWidth || null,
          height: img.naturalHeight || null,
          imageSize: null, // Goog doesn’t expose this directly in DOM
          referer: document.location.href,
          aboutUrl: img.closest('a')?.href || null
        };
      });
    });

    res.status(200).json({ query, total: images.length, images });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}
