//const axios = require("axios");
require("dotenv").config();
const puppeteer = require("puppeteer");
async function ema() {
  console.log("inside async");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();
  //const encodedSearch = encodeURI(searchTerm);
  await page.goto(`https://ema.agentcrmlogin.com/index.php`);
  await page.setViewport({ width: 1000, height: 821 });
  //logging in
  //username
  const userInputForm =
    "#loginFormDiv > form > div:nth-child(4) > div > .form-control";
  const userInputValue = await page.$eval(userInputForm, el => el.value);
  await page.waitForSelector(userInputForm);
  await page.click(userInputForm);
  for (let i = 0; i < userInputValue.length; i++) {
    await page.keyboard.press("Backspace");
  }
  await page.keyboard.type(process.env.EMA_USERNAME);
  //password
  const passwInputForm =
    "#loginFormDiv > form > div:nth-child(5) > div > .form-control";
  const passwInputValue = await page.$eval(passwInputForm, el => el.value);
  await page.waitForSelector(passwInputForm);
  await page.click(passwInputForm);
  for (let i = 0; i < passwInputValue.length; i++) {
    await page.keyboard.press("Backspace");
  }
  await page.keyboard.type(process.env.EMA_PASSWORD);
  //login
  const submitLogIn = "#loginFormDiv > form > div:nth-child(6) > button";
  await page.waitForSelector(submitLogIn);
  await Promise.all([page.click(submitLogIn), page.waitForNavigation()]);
  //navigate to leads
  const leadsURL =
    "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=&sortorder=&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=";
  await page.goto(leadsURL);
  //click "?" to get total entries
  /* const totalEntriesHTML = "#listview-actions > div > div:nth-child(3) > div > span > span.totalNumberOfRecords.cursorPointer";
  await page.waitForSelector(totalEntriesHTML);
  await Promise.all([page.click(totalEntriesHTML)]);
  setTimeout(function(){}, 500);
  const pageTotalEntires = await page.$eval("#listview-actions > div > div:nth-child(3) > div > span > span.pageNumbersText", el => el.innerText);
  const pageTotalEntiresArray = pageTotalEntires.split(" ");
  const totalEntires = parseInt(pageTotalEntiresArray[4]);
  console.log(totalEntires); */
  //get record url
  const recordURL = await page.evaluate(() =>
    document
      .getElementById("Leads_listView_row_1")
      .getAttribute("data-recordurl")
  );
  console.log(recordURL);
  //go to record
  await page.goto("https://ema.agentcrmlogin.com/" + recordURL);
  //get phone number
  const phoneNumberSelector =
    "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(4) > td.fieldValue > div > span.value.textOverflowEllipsis > a";
  await page.waitForSelector(phoneNumberSelector);
  let phoneNumber = await page.$eval(phoneNumberSelector, el => el.innerText);
  phoneNumber = phoneNumber.slice(2);
  console.log(phoneNumber);
  //change lead status
  //have to click next to lead status first in order to get editor to appear
  const leadStatusTextSelector =
    "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(5) > td.fieldValue > div > span.value.textOverflowEllipsis > span";
  await page.waitForSelector(leadStatusTextSelector);
  await page.click(leadStatusTextSelector);
  //click edit
  const leadStatusSelector =
    "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(5) > td.fieldValue > div > span.action > .editAction";
  await page.waitForSelector(leadStatusSelector);
  await page.click(leadStatusSelector);
  //click drop down
  const leadStatusDropdownSelector = "#s2id_field_Leads_leadstatus";
  await page.waitForSelector(leadStatusDropdownSelector);
  await page.click(leadStatusDropdownSelector);
  // click input
  const leadStatusInputSelector = "#select2-drop > div > input";
  await page.waitForSelector(leadStatusInputSelector);
  await page.click(leadStatusInputSelector);
  //type "no answer"
  await page.keyboard.type("No Answer");
  await page.keyboard.press("Enter");
  //submit change
  const leadStatusSubmitSelector =
    "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(5) > td.fieldValue > div > span.edit.ajaxEdited > div > div.input-save-wrap > span.pointerCursorOnHover.input-group-addon.input-group-addon-save.inlineAjaxSave > i";
  await page.waitForSelector(leadStatusSubmitSelector);
  await page.click(leadStatusSubmitSelector);

  await browser.close();
}
async function dial() {
  console.log("inside dial");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 821 });
  await page.goto(
    `https://tel.agentcrmlogin.com/dialer/EMA/vicidial/welcome.php`
  );
  //log in
  const adminButtonSelector =
    "body > div > div.card > div > div:nth-child(4) > center > a > button";
  await page.waitForSelector(adminButtonSelector);
  await page.click(adminButtonSelector);
  await page.on('dialog', dialog => {
    dialog.accept("yes");
  });

  await browser.close();
}
//ema();
dial();
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
