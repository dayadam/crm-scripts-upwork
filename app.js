require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");
//const path = require("path");
const csv = require("fast-csv");
//const dataCSV = require("./data.csv");
const moment = require("moment");
function now() {
  return moment.utc().format();
}
//console.log(typeof(now()));
//console.log(now());
const dummyData = [
  ["d", now()],
  ["a1", now()],
  ["b2", now()]
];

//let recordURL;

//const ws = fs.createWriteStream("./data.csv", { flags: "a" });
csv
  .write([["new run", now()]], { includeEndRowDelimiter: true })
  .pipe(fs.createWriteStream("./data.csv", { flags: "a" }));
//{ headers: ["phone number", "time created"], writeHeaders: false }

async function crm() {
  console.log("inside crm");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();
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
  //return { browser: browser, page: page };

  //const pupOptions = crm();

  async function checkLead() {
    console.log("running check");
    //navigate to leads
    /* const leadsURL =
    "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=&sortorder=&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22phone%22%2C%22c%22%2C%22888888%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag="; */
    const leadsURL =
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=&sortorder=&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=";
    await page.goto(leadsURL);
    //click "?" to get total entries
    //sometimes messes up, tries to get the value of the clicked "?" before rendered, not sure if setTimeout() is working or needs to be a Promise
    /* const totalEntriesHTML = "#listview-actions > div > div:nth-child(3) > div > span > span.totalNumberOfRecords.cursorPointer";
  await page.waitForSelector(totalEntriesHTML);
  await Promise.all([page.click(totalEntriesHTML)]);
  setTimeout(function(){}, 500);
  const pageTotalEntires = await page.$eval("#listview-actions > div > div:nth-child(3) > div > span > span.pageNumbersText", el => el.innerText);
  const pageTotalEntiresArray = pageTotalEntires.split(" ");
  const totalEntires = parseInt(pageTotalEntiresArray[4]);
  console.log(totalEntires); */
    //get record url
    const recordURL = await page.evaluate(() => {
      const element = !!document.getElementById("Leads_listView_row_1");
      if (element) {
        return document
          .getElementById("Leads_listView_row_1")
          .getAttribute("data-recordurl");
      } else {
        return element;
      }
    });
    console.log(recordURL);
    return new Promise((resolve, reject) => {
      console.log(recordURL);
      resolve(recordURL);
    });
    /* if (!recordURL) {
      console.log("no search results");
      //exists out of crm async function is no search results based on filter
      return await browser.close();
    }
    console.log(recordURL); */
  }

  const recordURL = await checkLead();

  if (recordURL) {
    await runLogic(recordURL);
  }

  /* let check = new Promise((resolve, reject) => {
    resolve(checkLead());
  });

  let run = new Promise((resolve, reject) => {
    resolve(runLogic());
  }); */

  /* await check;

  if (recordURL) {
    await run;
  } */

  /* check.then(function(resolved) {
    if (recordURL) {
      runLogic();
    }
  }); */
  await browser.close();

  /* if (recordURL === false) {
    console.log("no search results");
    //exists out of crm async function is no search results based on filter
    return await browser.close();
  } else if (runLogic() === "logic ran") {
    console.log("no search results");
    //exists out of crm async function is no search results based on filter
    return await browser.close();
  }

  if (runLogic() === "logic ran") {
    console.log("logic ran");
    //exists out of crm async function is no search results based on filter
    return await browser.close();
  } */

  async function runLogic(recordURL) {
    console.log("running logic");
    //go to record
    await page.goto("https://ema.agentcrmlogin.com/" + recordURL);
    //get phone number
    const phoneNumberSelector =
      "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(4) > td.fieldValue > div > span.value.textOverflowEllipsis > a";
    await page.waitForSelector(phoneNumberSelector);
    let phoneNumber = await page.$eval(phoneNumberSelector, el => el.innerText);
    phoneNumber = phoneNumber.slice(-10);
    console.log(phoneNumber);
    csv
      .write([[phoneNumber, now()]], { includeEndRowDelimiter: true })
      .pipe(fs.createWriteStream("./data.csv", { flags: "a" }));
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
    return new Promise((resolve, reject) => {
      checkLead().then(function(recordURL) {
        if (recordURL) {
          runLogic(recordURL);
        } else resolve(recordURL);
      });
    });
  }

  //await browser.close();
}

async function dial() {
  console.log("inside dial");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();
  await page.authenticate({
    username: process.env.DIAL_USERNAME,
    password: process.env.DIAL_PASSWORD
  });
  await page
    .goto(
      `https://tel.agentcrmlogin.com/dialer/EMA/vicidial/admin_search_lead.php`
    )
    .catch(err => {
      console.log(err);
    });
  //click phone number input
  const phoneDialSelector =
    "body > center > div > font > section > div > div.row.clearfix > div > div > div > table > tbody > tr:nth-child(3) > td:nth-child(2) > div > input";
  await page.waitForSelector(phoneDialSelector);
  await page.click(phoneDialSelector);
  await page.keyboard.type("8088709637");
  //click submit search
  const phoneDialSubmitSelector =
    "body > center > div > font > section > div > div.row.clearfix > div > div > div > table > tbody > tr:nth-child(3) > td:nth-child(3) > input";
  await page.waitForSelector(phoneDialSubmitSelector);
  await Promise.all([
    page.click(phoneDialSubmitSelector),
    page.waitForNavigation()
  ]);
  //visit id
  const idURL = await page.evaluate(() =>
    document
      .querySelector(
        "body > center > div > font > table > tbody > tr:nth-child(2) > td:nth-child(2) > font > a"
      )
      .getAttribute("href")
  );
  console.log(idURL);
  //go to id
  await page.goto("https://tel.agentcrmlogin.com/dialer/EMA/vicidial/" + idURL);
  //click on disposition editor
  const disposSelector =
    "body > center > section > div > div.row.clearfix > div > div > div > table:nth-child(1) > tbody > tr:nth-child(45) > td:nth-child(2) > div > select";
  await page.waitForSelector(disposSelector);
  const selectValInit = await page.evaluate(
    () =>
      document.querySelector(
        "body > center > section > div > div.row.clearfix > div > div > div > table:nth-child(1) > tbody > tr:nth-child(45) > td:nth-child(2) > div > select"
      ).value
  );
  console.log(selectValInit);
  //set disposition to no answer
  await page.select(disposSelector, "N");
  const selectValNew = await page.evaluate(
    () =>
      document.querySelector(
        "body > center > section > div > div.row.clearfix > div > div > div > table:nth-child(1) > tbody > tr:nth-child(45) > td:nth-child(2) > div > select"
      ).value
  );
  console.log(selectValNew);
  //click submit disposition edit
  const submitDisposSelector =
    "body > center > section > div > div.row.clearfix > div > div > div > table:nth-child(1) > tbody > tr:nth-child(50) > td > input";
  await page.waitForSelector(submitDisposSelector);
  await Promise.all([
    page.click(submitDisposSelector),
    page.waitForNavigation()
  ]);
  await browser.close();
}

crm();
//dial();
