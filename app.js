//const axios = require("axios");
require("dotenv").config();
const puppeteer = require("puppeteer");

async function scrape(searchTerm, res) {
  console.log("inside async");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();

  //await page.keyboard.type(searchTerm);

  //const encodedSearch = encodeURI(searchTerm);

  await page.goto(
    `https://ema.agentcrmlogin.com/index.php?module=Leads&view=List&app=MARKETING`
  );

  await page.setViewport({ width: 1440, height: 821 });

  

  const linkSelector =
    "#listViewContent > div.col-sm-12.col-xs-12 > div.floatThead-wrapper > div.floatThead-floatContainer.floatThead-container > table > thead > tr.listViewContentHeader > th:nth-child(3) > a";
  await page.waitForSelector(linkSelector);
  const title = document.querySelector(linkSelector).innerText;

/*   await Promise.all([page.click(linkSelector), page.waitForNavigation()]);

  const result = await page.evaluate(() => {
    const title = document.querySelector("#DynamicHeading_productTitle")
      .innerText;

    return {
      title,
    };
  }); */

  console.log(title);

  await browser.close();
};

scrape();

/* axios.get(`https://jooble.org/api/${joobleKey}`, {
    keywords: req.body.keywords,
    location: req.body.location,
    radius: req.body.radius,
    page: "1",
    searchMode: "1"
  })
  .then(function(response) {
    console.log(response.data);
  })
  .catch(err => console.log(err)); */
