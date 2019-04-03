const dateFormat = require('dateformat');
const request = require('axios');
const xml = require('xml');
const fs = require('fs');

const { parsed: { API_KEY } } = require('dotenv').config();

let reviewsWriteStream;
let reviewsElem;
let reviewsxmlStream;

let enginesWriteStream;
let enginesElem;
let enginesxmlStream;

let trimsWriteStream;
let trimsElem;
let trimsxmlStream;

let versionsWriteStream;
let versionsElem;
let versionsxmlStream;

let dealsWriteStream;
let dealsElem;
let dealsxmlStream;

// xmlStream.on('data', chunk => { console.log('xml data:', chunk) });
// xmlStream.on('end', chunk => { console.log('complete') });

const baseUrl = 'https://www.whatcar.com';
let pageSize = 100;
let page = 1;

const chapters = [
    'on-the-road',
    'in-the-cabin',
    'space-practicality',
    'buying-owning'
];

const requestObject = page => ({
  method: 'get',
  headers: { 'x-api-key': API_KEY },
  url: `https://search-api.hmhost.co.uk/prod/reviews?pageSize=${pageSize}&page=${page}`
});

// const hasUndefined = str => str.includes('undefined');
const excludeTrims = ({ derivative: { make, range, bodyStyle, trim } = {} }) => make && range && bodyStyle && !trim;

const generateLinks = [
  {
    init: () => {
        reviewsWriteStream = fs.createWriteStream('./reviews-sitemap.xml');
        reviewsElem = xml.element({ _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' } });
        reviewsxmlStream = xml({ urlset: reviewsElem }, { stream: true });
        reviewsxmlStream.pipe(reviewsWriteStream);
    },
    exec: function results(results) {
        if (excludeTrims(results)) {
            const patterns = this.urlPatterns(results);

            reviewsElem.push({ url: [{ loc: patterns.home }, { lastmod: dateFormat(now, 'yyyy/mm/dd') }] });

            chapters.map(chapter => {
                const url = patterns.chapter(chapter);

                reviewsElem.push({ url: [{ loc: url }, { lastmod: dateFormat(now, 'yyyy/mm/dd') }] });
            });
        }

        const closeReviews = () => { console.log('closing reviews'); reviewsElem.close(); };

        return closeReviews;
    },
    urlPatterns: ({ derivative: { make, range, bodyStyle } = { range: 'range', bodyStyle: 'bodystyle' }, cmsId }) => ({
        home: `${baseUrl}/${make}/${range}/${bodyStyle}/review/${cmsId}`,
        chapter: chapter => `${baseUrl}/${make}/${range}/${bodyStyle}/review/${cmsId}/${chapter}`
    }),
  },
  {
    init: () => {
        trimsWriteStream = fs.createWriteStream('./trims-sitemap.xml');
        trimsElem = xml.element({ _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' } });
        trimsxmlStream = xml({ urlset: trimsElem }, { stream: true });
        trimsxmlStream.pipe(trimsWriteStream);
    },
    exec: function(results) {
        const patterns = this.urlPatterns(results);
        const { derivative: { trim }, trims } = results;

        if (trim) {
            const url = patterns.reviewTrim;

            trimsElem.push({ url: [{ loc: url }, { lastmod: dateFormat(now, 'yyyy/mm/dd') }] });

            chapters.map(chapter => {
                const url = patterns.reviewTrimChapter(chapter);

                trimsElem.push({ url: [{ loc: url }, { lastmod: dateFormat(now, 'yyyy/mm/dd') }] });
            });
        }

        trims.map(trim => {
            const url = patterns.ham(trim);

            trimsElem.push({ url: [{ loc: url }, { lastmod: dateFormat(now, 'yyyy/mm/dd') }] });
        });

        const closeTrims = () => { console.log('closing trims'); trimsElem.close(); };

        return closeTrims;
    },
    urlPatterns: ({ derivative: { make, range, bodyStyle, trimHamId, trim } = { trimHamId: '', trim: '' } }) => ({
        ham: ({ urlTitle, hamId }) => `${baseUrl}/${make}/${range}/${bodyStyle}/trim/${urlTitle}/${hamId}`,
        reviewTrimChapter: chapter => `${baseUrl}/${make}/${range}/${bodyStyle}/trim/${trim}/${trimHamId}/${chapter}`,
        reviewTrim: `${baseUrl}/${make}/${range}/${bodyStyle}/trim/${trim}/${trimHamId}`
    }),
  },
  {
    init: () => {
        enginesWriteStream = fs.createWriteStream('./engines-sitemap.xml');
        enginesElem = xml.element({ _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' } });
        enginesxmlStream = xml({ urlset: enginesElem }, { stream: true });
        enginesxmlStream.pipe(enginesWriteStream);
    },
    exec: function(results) {
        if (excludeTrims(results)) {
            const patterns = this.urlPatterns(results);
            const { engines } = results;

            engines.map(engine => {
                const url = patterns.home(engine);

                enginesElem.push({ url: [{ loc: url }, { lastmod: dateFormat(now, 'yyyy/mm/dd') }] });
            });
        }

        const closeEngines = () => { console.log('closing engines'); enginesElem.close(); };

        return closeEngines;
    },
    urlPatterns: ({ derivative: { make, range, bodyStyle } = {} }) => {
        return {
            home: ({ urlTitle, hamId }) => `${baseUrl}/${make}/${range}/${bodyStyle}/engine/${urlTitle}/${hamId}`
        };
    },
  },
  {
    init: () => {
        versionsWriteStream = fs.createWriteStream('./versions-sitemap.xml');
        versionsElem = xml.element({ _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' } });
        versionsxmlStream = xml({ urlset: versionsElem }, { stream: true });
        versionsxmlStream.pipe(versionsWriteStream);
    },
    exec: function(results) {
        if (excludeTrims(results)) {
            const patterns = this.urlPatterns(results);
            const url = patterns.home;

            versionsElem.push({ url: [{ loc: url }, { lastmod: dateFormat(now, 'yyyy/mm/dd') }] });
        }

        const closeVersions = () => { console.log('closing versions'); versionsElem.close(); };

        return closeVersions;
    },
    urlPatterns: ({ derivative: { make, range, bodyStyle } = {} }) =>({
        home: `${baseUrl}/make/${make}/${range}/${bodyStyle}/versions`
    })
  },
  {
    init: () => {
        dealsWriteStream = fs.createWriteStream('./deals-sitemap.xml');
        dealsElem = xml.element({ _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' } });
        dealsxmlStream = xml({ urlset: dealsElem }, { stream: true });
        dealsxmlStream.pipe(dealsWriteStream);
    },
    exec: function(results) {
        if (excludeTrims(results)) {
            const patterns = this.urlPatterns(results);
            const url = patterns.home;

            dealsElem.push({ url: [{ loc: url }, { lastmod: dateFormat(now, 'yyyy/mm/dd') }] });
        }

        const closeDeals = () => { console.log('closing deals'); dealsElem.close(); };

        return closeDeals;
    },
    urlPatterns: ({ derivative: { make, range, bodyStyle } = {} }) =>({
        home: `${baseUrl}/make/${make}/${range}/${bodyStyle}/deals`
    })
  }
];

const now = new Date();
const closeFuncs = {};

const generateSiteMaps = async () => {
    let totalPages;

    do {
        let fn;
        const res = await request(requestObject(page));
        const {
            data: {
                pagination: { total, pageSize } = {},
                results,
            }
        } = res;

        console.log("request url: ", requestObject(page).url);

        if (pageSize === 1) {
          totalPages = 1; // just so 1 result is operated on
        } else {
          totalPages = Math.ceil(total / pageSize);
        }

        generateLinks.map((_, idx) => {
            generateLinks[idx].init();
            results.map(result => {
                fn = generateLinks[idx].exec(result);
            });
            closeFuncs[fn.name] = fn;
        });

        page++;
    } while (page < totalPages);

    Object.keys(closeFuncs).map(fn => {
        closeFuncs[fn]();
    });
};

generateSiteMaps();
