const cheerio = require('cheerio');
const url = require('./urls');
const { getCards, getPaginationButton, getPaginationCount } = require('./helpers');

// Simple in-memory cache with TTL (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL
  });
};

const ongoingSeries = async (page) => {
  const cacheKey = `ongoing_${page}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${url.BASE_URL}/sedang-tayang/?halaman=${page}`);
    const body = await res.text();
    const $ = cheerio.load(body);
    const data = {
      anime: [],
      pagination: {},
    };
    
    data.anime = getCards($);
    data.pagination = getPaginationButton($);

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.log("🚀 ~ ongoingSeries ~ error:", error)
    throw new Error('Internal Server Error');
  }
};

const animeDetails = async (slug) => {
  const cacheKey = `anime_${slug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${url.BASE_URL}/anime/${slug}`);
    const body = await res.text();
    const $ = cheerio.load(body);
    const data = [];
  
    $('div.bigcontent').each((index, element) => {
      const el = $(element);
      const img = el.find('div.thumb img:first-child').attr('data-src');
      const title = el.find('div.infox h1').text().trim();
      const name = el.find('div.infox span.alter').text().trim();
      const status = el.find('div.infox div.spe span b:contains("Status:")').first().parent().text().replace('Status: ', '');
      const type = el.find('div.infox div.spe span b:contains("Jenis:")').first().parent().text().replace('Jenis: ', '');
      const release = el.find('div.infox div.spe span b:contains("Rilis:")').first().parent().text().replace('Rilis: ', '');
      const duration = el.find('div.infox div.spe span b:contains("Durasi:")').first().parent().text().replace('Durasi: ', '');
      const synopsis = $('div.sinopsis p:first-child').text().trim();
      const episodes = []; 
      const genres = [];
      const characterTypes = [];
      
      el.find('div.infox div.spe span b:contains("Genre:")').parent().find('a').each((index, element) => {
        genres.push({
          genre: $(element).text() || null,
          slug: $(element).attr('href').split('/')[4] || null
        })
      });

      el.find('div.infox div.spe span#tikar_shw b:contains("Karakter:")').parent().find('a').each((index, element) => {
        characterTypes.push({
          type: $(element).text() || null,
          slug: $(element).attr('href').split('/')[4] || null
        })
      });
      
      $('div.bixbox ul#daftarepisode li').each((index, element) => {
        episodes.push({
          episode: $(element).find('span.lchx a').text().trim(),
          slug: $(element).find('span.lchx a').attr('href').split('/')[3],
        })
      })
      
      data.push({
        img: img || null,
        title: title || null,
        name: name || null,
        status: status || null,
        release: release || null,
        duration: duration || null,
        type: type || null,
        synopsis: synopsis || null,
        genres: genres || null,
        characterTypes: characterTypes || null,
        episodes: episodes || null
      })
    })
  
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.log("🚀 ~ animeDetails ~ error:", error)
    throw new Error('Internal Server Error');
  }
}

const animeEpisode = async (slug) => {
  const cacheKey = `episode_${slug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${url.BASE_URL}/${slug}`);
    const body = await res.text();
    const $ = cheerio.load(body);
    
    let title = null;
    const streams = [];
    const downloads = [];

    $('div.postbody article').each((index, element) => {
      const el = $(element);
      title = el.find('div.meta div.lm h1').text().trim() || null;

      el.find('select.mirror option').each((index, element) => {
        const option = $(element);
        const decodedOptionValue = option.attr('value') ? atob(option.attr('value')) : null;
        if(!decodedOptionValue) return;
        
        const iframe = cheerio.load(decodedOptionValue)('iframe');
        const src = iframe.attr('src');
        const label = option.text().trim() || null;
        if(!src) return;

        streams.push({
          name: label,
          url: src,
        })
      })
    })

    const result = {
      status: "success",
      creator: "Animasu API",
      source: "Animasu",
      title: title,
      streams: streams,
      downloads: downloads
    };
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.log("🚀 ~ animeEpisode ~ error:", error)
    throw new Error('Internal Server Error');
  }
}

const search = async (keyword, page) => {
  const cacheKey = `search_${keyword}_${page}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${url.BASE_URL}/page/${page}/?s=${keyword}`);
    const body = await res.text();
    const $ = cheerio.load(body);
    const data = {
      anime: [],
      paginationCount: null,
    };
  
    data.anime = getCards($);
    data.paginationCount = getPaginationCount($);

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.log("🚀 ~ search ~ error:", error)
    throw new Error('Internal Server Error');
  }
}

const genre = async (slug, page) => {
  const cacheKey = `genre_${slug}_${page}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${url.BASE_URL}/genre/${slug}/page/${page}`);
    const body = await res.text();
    const $ = cheerio.load(body);
    const data = {
      anime: [],
      paginationCount: null,
    };
  
    data.anime = getCards($);
    data.paginationCount = getPaginationCount($);

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.log("🚀 ~ genre ~ error:", error)
    throw new Error('Internal Server Error');
  }
}

const characterType = async (slug, page) => {
  const cacheKey = `character_${slug}_${page}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${url.BASE_URL}/karakter/${slug}/page/${page}`);
    const body = await res.text();
    const $ = cheerio.load(body);
    const data = {
      anime: [],
      paginationCount: null,
    };
  
    data.anime = getCards($);
    data.paginationCount = getPaginationCount($);

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.log("🚀 ~ characterType ~ error:", error)
    throw new Error('Internal Server Error');
  }
}

const movies = async (page) => {
  const cacheKey = `movies_${page}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${url.BASE_URL}/movie/?halaman=${page}`);
    const body = await res.text();
    const $ = cheerio.load(body);
    const data = {
      anime: [],
      pagination: {},
    };
    
    data.anime = getCards($);
    data.pagination = getPaginationButton($);

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error('Internal Server Error');
  }
};

const filterList = async (query, page) => {
  const cacheKey = `filter_${query}_${page}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${url.BASE_URL}/pencarian/?halaman=${page}&${query}`);
    const body = await res.text();
    const $ = cheerio.load(body);
    const data = {
      anime: [],
      pagination: {},
    };
    
    data.anime = getCards($);
    data.pagination = getPaginationButton($);

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.log("🚀 ~ filterList ~ error:", error)
    throw new Error('Internal Server Error');
  }
}

module.exports = {
  ongoingSeries,
  animeDetails,
  animeEpisode,
  search,
  genre,
  characterType,
  movies,
  filterList,
}