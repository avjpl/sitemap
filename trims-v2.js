// const dateFormat = require('dateformat')
const request = require('axios');
const sm = require("sitemap");
const str = require("string-to-stream");
const AWS = require('aws-sdk');
const s3Upload = require("s3-upload-stream");
const uuid = require("uuid");

const s3Stream = s3Upload(new AWS.S3());

const { parsed: { API_KEY } } = require("dotenv").config();

const baseUrl = 'https://www.whatcar.com';
let pageSize = 1;
let page = 1;
const urls = [];
const bucketName = "sitemap-t-1";

const requestObject = page => ({
  method: "get",
  headers: { "x-api-key": API_KEY },
  url: `https://search-api.hmhost.co.uk/prod/reviews?pageSize=${pageSize}&page=${page}`
});

const upload = s3Stream.upload({
    "Bucket": bucketName,
    "Key": `trims-sitemap.xml`
    // "Key": `trims-sitemap-${uuid.v4()}.xml`
});

upload.on('error', err => {
    console.error('error: ', err);
});

upload.on('uploaded', details => {
    console.info('info: ', details);
});

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

        if (pageSize === 1) {
            totalPages = 1;
        } else {
            totalPages = Math.ceil(total / pageSize);
        }

        results.map(item => {
            const {
                derivative: { make, range, bodyStyle } = {},
                trims
            } = item;

            trims.map(trim => {
                const {
                    urlTitle,
                    hamId
                } = trim;

                const url = `${baseUrl}/${make}/${range}/${bodyStyle}/trim/${urlTitle}/${hamId}`;

                urls.push({
                    url,
                    lastmodISO: '2015-06-27T15:30:00.000Z'
                });
            });
        });

        page++;
    } while (page <= totalPages);

    sitemap = sm.createSitemap({
        xmlNs: 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        xslUrl: '',
        hostname: baseUrl,
        urls: urls
    });

    sitemap.toXML((err, xml) => {
        if (err) {
          console.error('error: ', xml);
        }
    });

    const read = str(sitemap.toString());
    read.pipe(upload);
}

makeRequest();
