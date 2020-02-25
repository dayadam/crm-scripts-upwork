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
const express = require("express");
const csv = require("fast-csv");
const moment = require("moment");
function now() {
  return moment.utc().format();
}
//function to remove duplicates from array
function unique(ary) {
  // concat() with no args is a way to clone an array
  var u = ary.concat().sort();
  for (var i = 1; i < u.length; ) {
    if (u[i - 1] === u[i]) u.splice(i, 1);
    else i++;
  }
  return u;
}
const app = express();
const PORT = process.env.PORT || 3001;

// Define middleware here
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Static directory
app.use(express.static("public"));

//=====***** APP START *****=====
//counter to switch between URL search results
//seems like dB isn't updating as fast as script can run
let urlCounter = 0;

//array to contain phone numbers modified on CRM
const phoneNumberArray = [];

//save phone number to csv to prevent any data loss during testing and development
//start a new row with time upon running script to easily see where scripts began
csv
  .write([["new run", now()]], { includeEndRowDelimiter: true })
  .pipe(fs.createWriteStream("./data.csv", { flags: "a" }));
crm().then(res => dial(phoneNumberArray));
app.post("/api/run", function(req, res) {
  console.log(req.body);
  res.json(req.body);
  //crm() logs in --> checks search results --> recursively changes lead status --> checks search results --> changes lead status ...etc
  //crm().then(res => dial(phoneNumberArray));
});
app.listen(PORT, function() {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
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
  //record will either be the url and phone of the record based on search results
  //or false if it doesn't exist
  const record = await checkLead();
  //if record exists, run change lead status logic on it
  if (record) {
    //runLogic()'s Promise will recursively resolve to false when checkLead() resolves to false
    //recursively changes lead status --> checks search results --> changes lead status ...etc
    await runLogic(record);
  }
  //else close browser
  await browser.close();
  return new Promise((resolve, reject) => {
    resolve(true);
  });
  //=====***** CRM() LOGIC END *****=====

  //function to check if lead exists based on search criteria and get its url if it does
  async function checkLead() {
    console.log("running check");
    //navigate to leads
    //switch between URL's because it takes a second for the database to update and display new lead status
    const leadsURL = [
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=lastname&sortorder=ASC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=lastname&sortorder=DESC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=createdtime&sortorder=ASC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=createdtime&sortorder=DESC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=company&sortorder=ASC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=company&sortorder=DESC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=firstname&sortorder=ASC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=firstname&sortorder=DESC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=email&sortorder=ASC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=email&sortorder=DESC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=cf_1104&sortorder=ASC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag=",
      "https://ema.agentcrmlogin.com/index.php?module=Leads&parent=&page=1&view=List&viewname=1&orderby=cf_1104&sortorder=DESC&app=MARKETING&search_params=%5B%5B%5B%22leadstatus%22%2C%22e%22%2C%22Call+Back%22%5D%2C%5B%22assigned_user_id%22%2C%22c%22%2C%22Elite+Medicare+Advisors+%2CTeam+Selling%22%5D%5D%5D&tag_params=%5B%5D&nolistcache=0&list_headers=%5B%22createdtime%22%2C%22leadstatus%22%2C%22company%22%2C%22firstname%22%2C%22lastname%22%2C%22phone%22%2C%22email%22%2C%22code%22%2C%22cf_852%22%2C%22cf_1104%22%2C%22assigned_user_id%22%5D&tag="
    ];
    await page.goto(leadsURL[urlCounter], { waitUntil: "load" });
    urlCounter++;
    if (urlCounter === 11) {
      urlCounter = 0;
    }
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
    /* //re-click search button
    await page.evaluate(() => {
      document
        .querySelector(
          "#listViewContent > div.col-sm-12.col-xs-12 > div.floatThead-wrapper > div.floatThead-floatContainer.floatThead-container > table > thead > tr.searchRow > th.inline-search-btn > div > button"
        )
        .click();
    }); */

    const rowResults = await page.evaluate(() => {
      const ans = document.querySelectorAll(".listViewEntries");
      return ans;
    });

    //get record url
    let record = {};
    let elementFound = false;
    const promises = [];
    console.log(rowResults);
    console.log(Object.keys(rowResults).length);
    for (let i = 1; i < Object.keys(rowResults).length + 1; i++) {
      console.log(i);
      promises.push(
        new Promise(async (resolve, reject) => {
          console.log(promises);
          const recordtemp = await page.evaluate((i) => {
            //if row exists, return that row's url ending of that record so record.URL = that url ending
            const URL = document
              .getElementById(`Leads_listView_row_${i}`)
              .getAttribute("data-recordurl");
            const phoneNumber = document
              .querySelector(
                `#Leads_listView_row_${i} > td:nth-child(8) > span.fieldValue > span`
              )
              .innerText.trim()
              .slice(-10);
            return { URL: URL, phoneNumber: phoneNumber };
          }, i);
          if (!phoneNumberArray.includes(recordtemp.phoneNumber)) {
            elementFound = true;
            record.URL = recordtemp.URL;
            record.phoneNumber = recordtemp.phoneNumber;
            resolve(record);
          } else {
            reject(false);
          }
        })
      );
    }
    await Promise.all(promises);
    if (!elementFound) {
      record = false;
    }
    console.log("line 168");
    console.log(record);

    //checkLead() returns a Promise that resolves to record
    //record will either be the url ending and phone # of the record if it exists or false is it doesn't
    return new Promise((resolve, reject) => {
      resolve(record);
    });
  }

  //recursive function to change lead status
  async function runLogic(record) {
    console.log("running logic");
    //go to record
    await page.goto("https://ema.agentcrmlogin.com/" + record.URL);
    //get phone number
    const phoneNumberSelector =
      "#detailView > div > div.left-block.col-lg-4 > div.summaryView > div.summaryViewFields > div > table > tbody > tr:nth-child(4) > td.fieldValue > div > span.value.textOverflowEllipsis > a";
    await page.waitForSelector(phoneNumberSelector);
    let phoneNumber = await page.$eval(phoneNumberSelector, el => el.innerText);
    //get last 10 digits to ignore country codes (or lack thereof)
    phoneNumber = phoneNumber.slice(-10);
    console.log(phoneNumber);
    //push phone numbers to array to send to Dialer
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
      checkLead().then(function(record) {
        //if leads need changing, recursively run logic to change lead status again
        if (record) {
          resolve(runLogic(record));
          //else resolve to false and exit crm()
        } else resolve(record);
      });
    });
  }
}

//script to edit status in dialer
async function dial(phoneNumberArray) {
  console.log("inside dial");
  //remove repeated phone numbers from array
  const newPhoneNumberArray = unique(phoneNumberArray);
  console.log(newPhoneNumberArray);
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
  for (i = 0; i < newPhoneNumberArray.length; i++) {
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
    await page.keyboard.type(`${newPhoneNumberArray[i]}`);
    //click submit search
    const phoneDialSubmitSelector =
      "body > center > div > font > section > div > div.row.clearfix > div > div > div > table > tbody > tr:nth-child(3) > td:nth-child(3) > input";
    await page.waitForSelector(phoneDialSubmitSelector);
    await Promise.all([
      page.click(phoneDialSubmitSelector),
      page.waitForNavigation()
    ]);
    //visit id url
    const idURL = await page.evaluate(() => {
      const element = !!document.querySelector(
        "body > center > div > font > table > tbody > tr:nth-child(2) > td:nth-child(2) > font > a"
      );
      //if row exists, return that row's url ending of that record so idURL = that url ending
      if (element) {
        return document
          .querySelector(
            "body > center > div > font > table > tbody > tr:nth-child(2) > td:nth-child(2) > font > a"
          )
          .getAttribute("href");
      } else {
        //else, return false and idurl will be set to false
        return element;
      }
    });
    console.log(idURL);
    if (idURL) {
      //go to id url
      await page.goto(
        "https://tel.agentcrmlogin.com/dialer/EMA/vicidial/" + idURL
      );
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
    }
  }
  await browser.close();
  return new Promise((resolve, reject) => {
    resolve(true);
  });
}
