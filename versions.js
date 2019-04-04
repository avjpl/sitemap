const dateFormat = require("dateformat");
const request = require('axios');
const xml = require('xml');
const fs = require("fs");

const { parsed: { API_KEY } } = require("dotenv").config();

const fileWriteStream = fs.createWriteStream('./versions-sitemap.xml');
const elem = xml.element({ _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' } });
const xmlStream = xml({ urlset: elem }, { stream: true });

// xmlStream.on('data', chunk => { console.log("xml data:", chunk) });
// xmlStream.on('end', chunk => { console.log('complete') });
xmlStream.pipe(fileWriteStream);

const baseUrl = 'https://www.whatcar.com';
let pageSize = 100;
let page = 1;

const requestObject = page => ({
  method: "get",
  headers: { "x-api-key": API_KEY },
  url: `https://search-api.hmhost.co.uk/prod/reviews?pageSize=${pageSize}&page=${page}`
});

const now = new Date();

const makeRequest = async () => {
    let totalPages;

    do {
        const res = await request(requestObject(page));
        const {
            data: {
                pagination: { total, pageSize } = {},
                results,
            }
        } = res;

        totalPages = Math.ceil(total / pageSize);

        results.map(item => {
            const {
                derivative: { make, range, bodyStyle } = {},
            } = item;

            const url = `${baseUrl}/make/${make}/${range}/${bodyStyle}/versions`;

            if (make !== undefined && range !== undefined && bodyStyle !== undefined)
                elem.push({ url: [ { loc: url }, { lastmod: dateFormat(now, 'yyyy/mm/dd')} ] });
        });

        page++;
    } while (page <= totalPages);

    elem.close();
}

makeRequest();
