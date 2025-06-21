// Vercel Serverless API Route
export default async function handler(req, res) {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: "Missing 'query' parameter" });
  }

  const usp = {
    as_st: "y",
    as_q: query,
    as_epq: "",
    as_oq: "",
    as_eq: "",
    imgsz: "l",
    imgar: "",
    imgcolor: "",
    imgtype: "jpg",
    cr: "",
    as_sitesearch: "",
    as_filetype: "",
    tbs: "",
    udm: "2"
  };

  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
  };

  try {
    const searchUrl = `https://www.google.com/search?${new URLSearchParams(
      usp
    ).toString()}`;

    const response = await fetch(searchUrl, { headers });
    const html = await response.text();

    const match = html.match(/var m=(.*?);var a=m/);
    if (!match) throw new Error("no match found");

    const json = JSON.parse(match[1]);

    const images = Object.entries(json)
      .filter((v) => v[1]?.[1]?.[3]?.[0])
      .map((v) => ({
        title: v[1]?.[1]?.[25]?.[2003]?.[3] || null,
        imageUrl: v[1]?.[1]?.[3]?.[0] || null,
        height: v[1]?.[1]?.[3]?.[1] || null,
        width: v[1]?.[1]?.[3]?.[2] || null,
        imageSize: v[1]?.[1]?.[25]?.[2000]?.[2] || null,
        referer: v[1]?.[1]?.[25]?.[2003]?.[2] || null,
        aboutUrl: v[1]?.[1]?.[25]?.[2003]?.[33] || null
      }));

    if (images.length === 0) {
      return res.status(404).json({ error: `No images found for ${query}` });
    }

    images.pop(); // remove last invalid image

    res.status(200).json({ query, total: images.length, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
