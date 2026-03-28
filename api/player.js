import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Get ID from query params (Vercel automatic for [id].js or configured in vercel.json)
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'No FIDE ID provided' });
  }

  try {
    const response = await axios.get(`https://ratings.fide.com/profile/${id}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 8000
    });
    
    if (!response.data) throw new Error("Empty response from FIDE");
    
    const $ = cheerio.load(response.data);

    // 1. Name lookup - targeted
    let name = $('.profile-top-title').first().text().trim() || 
               $('.profile-top-name').first().text().trim() ||
               $('.player-title').first().text().trim();

    // 2. Rating lookup
    let ratingStandard = 0;
    $('.profile-standart, .profile-standard').each((i, el) => {
      const parent = $(el).parent();
      const txt = $(el).text().toLowerCase() + " " + parent.text().toLowerCase();
      if (txt.includes('std') || txt.includes('standard') || $(el).hasClass('profile-standart')) {
        const val = $(el).find('p').first().text().trim();
        const num = parseInt(val.replace(/[^\d]/g, ''), 10);
        if (num > 0) ratingStandard = num;
      }
    });

    // 3. Info item search
    let birthYear = null;
    let title = 'None';
    $('.profile-top-info-item, .profile-info-row').each((i, el) => {
       const text = $(el).text().trim();
       if (!birthYear && text.match(/B-Year[:\s]+(\d{4})/i)) {
          birthYear = parseInt(text.match(/B-Year[:\s]+(\d{4})/i)[1], 10);
       } else if (!birthYear && text.includes('B-Year')) {
          const val = $(el).find('.profile-top-info-data, .profile-info-data').text().trim();
          birthYear = parseInt(val, 10) || null;
       }
       if (title === 'None' && text.match(/FIDE Title[:\s]+([A-Z]+)/i)) {
          title = text.match(/FIDE Title[:\s]+([A-Z]+)/i)[1].trim();
       } else if (title === 'None' && text.includes('Title')) {
          const val = $(el).find('.profile-top-info-data, .profile-info-data').text().trim();
          if (val && val.length > 1 && val.length < 5) title = val;
       }
    });

    if (name || ratingStandard > 0) {
      return res.status(200).json({ success: true, data: { id, name, rating: ratingStandard, birthYear, title } });
    } else {
      return res.status(404).json({ success: false, error: 'Could not retrieve player data.' });
    }
  } catch (err) {
    console.error(`Scrape failure for ID ${id}: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
