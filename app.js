//client is unaware or unable to access any APIs to get CRM and Dial to communicate with each other so puppeteer is used
//puppeteer is ran headful because I've found that Chrome needs GPU to operate properly
//one option for web deployment could be a docker container for puppeteer operations

//since we're running locally for easier use/deployment,
//I avoided using a database / server for easier user configuration
//instead, I use a csv to log records operated on, but this is mostly
//to prevent any data loss during testing and development

require("dotenv").config(); //.env should contain login info
const puppeteer = require("puppeteer");
const fs = require("fs");
const csv = require("fast-csv");
const moment = require("moment");
function now() {
  return moment.utc().format();
}

//=====***** APP START *****=====
//boolean to switch either to ascending or descending (based on last name) search results
//seems like dB isn't updating as fast as script can run, trying to debug that problem
let acsOrDesc = true;

//save phone number to csv to prevent any data loss during testing and development
//start a new row with time upon running script to easily see where scripts began
//const ws = fs.createWriteStream("./data.csv", { flags: "a" });
csv
  .write([["new run", now()]], { includeEndRowDelimiter: true })
  .pipe(fs.createWriteStream("./data.csv", { flags: "a" }));
//{ headers: ["phone number", "time created"], writeHeaders: false }

//crm() logs in --> checks search results --> recursively changes lead status --> checks search results --> changes lead status ...etc
crm();
//dial();
//=====***** APP END *****=====

//script to edit status and save phone number in CRM
async function crm() {
  //=====***** CRM() LOGIC START *****=====
  console.log("inside crm");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();
  await page.goto(`https://ema.agentcrmlogin.com/index.php`);
  await page.setViewport({ width: 1000, height: 821 });
  //===log in===
  //placeholders need to be deleted before username and password input
  //username
  const userInputForm =
    "#loginFormDiv > form > div:nth-child(4) > div > .form-control";
  const userInputPlaceholder = await page.$eval(userInputForm, el => el.value);
  await page.waitForSelector(userInputForm);
  await page.click(userInputForm);
  for (let i = 0; i < userInputPlaceholder.length; i++) {
    await page.keyboard.press("Backspace");
  }
  await page.keyboard.type(process.env.EMA_USERNAME);
  //password
  const passwInputForm =
    "#loginFormDiv > form > div:nth-child(5) > div > .form-control";
  const passwInputPlaceholder = await page.$eval(
    passwInputForm,
    el => el.value
  );
  await page.waitForSelector(passwInputForm);
  await page.click(passwInputForm);
  for (let i = 0; i < passwInputPlaceholder.length; i++) {
    await page.keyboard.press("Backspace");
  }
  await page.keyboard.type(process.env.EMA_PASSWORD);
  //submit login
  const submitLogIn = "#loginFormDiv > form > div:nth-child(6) > button";
  await page.waitForSelector(submitLogIn);
  await Promise.all([page.click(submitLogIn), page.waitForNavigation()]);
  //===log in finished===
  const phoneNumberArray = [];
  //recordURL will either be the url of the record based on search results
  //or false if it doesn't exist
  const recordURL = await checkLead();
  //if recordURL exists, run change lead status logic on it
  if (recordURL) {
    //runLogic()'s Promise will recursively resolve to false when checkLead() resolves to false
    //recursively changes lead status --> checks search results --> changes lead status ...etc
    await runLogic(recordURL);
  }
  //else close browser
  await browser.close();
  //=====***** CRM() LOGIC END *****=====

  //function to check if lead exists based on search criteria and get its url if it does
  async function checkLead() {
    console.log("running check");
    //navigate to leads
    /* //bad search url for testing
    const leadsURL =
    "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=&sortorder=&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22phone%22%2C%22c%22%2C%22888888%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=";
    // */
    //switch between URL's because it takes a second for the database to update and display new lead status
    const leadsURLASC =
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=lastname&sortorder=ASC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=";
    const leadsURLDESC =
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=lastname&sortorder=DESC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=";
    if (acsOrDesc) {
      await page.goto(leadsURLASC, { waitUntil: "load" });
    } /* else {
      await page.goto(leadsURLDESC, { waitUntil: "load" });
    }
    acsOrDesc = !acsOrDesc; */
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
    /* //re-click search button
    await page.evaluate(() => {
      document
        .querySelector(
          "#listViewContent > div.col-sm-12.col-xs-12 > div.floatThead-wrapper > div.floatThead-floatContainer.floatThead-container > table > thead > tr.searchRow > th.inline-search-btn > div > button"
        )
        .click();
    }); */

    let record = await page.evaluate(() => {
      //check if row exists based on search conditions
      //force existence of row into boolean (concerned about if falsey (undefined))
      const element = !!document.getElementById(`Leads_listView_row_1`);
      //if row exists, return that row's url ending of that record so recordURL = that url ending
      if (element) {
        const URL = document
          .getElementById(`Leads_listView_row_1`)
          .getAttribute("data-recordurl");
        const phoneNumber = document
          .querySelector(
            `#Leads_listView_row_1 > td:nth-child(8) > span.fieldValue > span`
          )
          .innerText.trim()
          .slice(-10);
        return { URL: URL, phoneNumber: phoneNumber };
      } else {
        //else, return false and recordURL will be set to false
        return element;
      }
    });

    let counter = 2;
    while (record && phoneNumberArray.includes(record.phoneNumber)) {
      record = await page.evaluate(
        counter => {
          //check if row exists based on search conditions
          //force existence of row into boolean (concerned about if falsey (undefined))
          const element = !!document.getElementById(
            `Leads_listView_row_${counter}`
          );
          //if row exists, return that row's url ending of that record so recordURL = that url ending
          if (element) {
            const URL = document
              .getElementById(`Leads_listView_row_${counter}`)
              .getAttribute("data-recordurl");
            const phoneNumber = document
              .querySelector(
                `#Leads_listView_row_${counter} > td:nth-child(8) > span.fieldValue > span`
              )
              .innerText.trim()
              .slice(-10);
            counter++;
            return { URL: URL, phoneNumber: phoneNumber };
          } else {
            //else, return false and recordURL will be set to false
            return element;
          }
        },
        counter,
        record
      );
    }

    console.log(recordURL);
    //checkLead() returns a Promise that resolves to recordURL
    //recordURL will either be the url ending of the record if it exists or false is it doesn't
    return new Promise((resolve, reject) => {
      console.log(recordURL);
      resolve(recordURL);
    });
  }

  //recursive function to change lead status
  async function runLogic(recordURL) {
    console.log("running logic");
    //go to record
    await page.goto("https://ema.agentcrmlogin.com/" + recordURL);
    //get phone number
    const phoneNumberSelector =
      "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(4) > td.fieldValue > div > span.value.textOverflowEllipsis > a";
    await page.waitForSelector(phoneNumberSelector);
    let phoneNumber = await page.$eval(phoneNumberSelector, el => el.innerText);
    //get last 10 digits to ignore country codes (or lack thereof)
    phoneNumber = phoneNumber.slice(-10);
    console.log(phoneNumber);
    phoneNumberArray.push(phoneNumber);
    //save phone number to csv to prevent any data loss during testing and development
    csv
      .write([[phoneNumber, now()]], { includeEndRowDelimiter: true })
      .pipe(fs.createWriteStream("./data.csv", { flags: "a" }));
    //===change lead status===
    //click edit lead status button, hidden so must evaluate
    await page.evaluate(() => {
      document
        .querySelector(
          "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(5) > td.fieldValue > div > span.action > .editAction"
        )
        .click();
    });
    //change lead status select field to "no answer"
    const disposSelector = "#field_Leads_leadstatus";
    await page.waitForSelector(disposSelector);
    const selectValInit = await page.evaluate(
      () => document.querySelector("#field_Leads_leadstatus").value
    );
    console.log(selectValInit);
    await page.select(disposSelector, "No Answer");
    const selectValNew = await page.evaluate(
      () => document.querySelector("#field_Leads_leadstatus").value
    );
    console.log(selectValNew);
    //submit change to lead status field
    await page.evaluate(() => {
      document
        .querySelector(
          "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(5) > td.fieldValue > div > span.edit.ajaxEdited > div > div.input-save-wrap > span.pointerCursorOnHover.input-group-addon.input-group-addon-save.inlineAjaxSave"
        )
        .click();
    });
    //===end change lead status===
    return new Promise((resolve, reject) => {
      //after lead status has been changed, go back to search page and check to see if there's still leads that need changing
      checkLead().then(function(recordURL) {
        //if leads need changing, recursively run logic to change lead status again
        if (recordURL) {
          runLogic(recordURL);
          //else resolve to false and exit crm()
        } else resolve(recordURL);
      });
    });
  }
}

//script to edit status in dialer
async function dial() {
  console.log("inside dial");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();
  //login not DOM element, need page.authenticate()
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
