# crm-scripts-upwork

This application was made for Elite Medicare Advisors. It searches their CRM for leads have a "Call Back" lead status and are assigned to "Team Selling" and "Elite Medicare Advisors," changes those lead statuses to "No Answer," and feeds those lead statuses' phone numbers to the Dialer to also change the lead's disposition to "No Answer." 
---

## Table of Contents

- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Built With](#built-with)

## Organization of the Application

This is a Node.js application that uses the puppeteer library. The client was unaware or unable to access the API. Puppeteer is ran headful because Chrome needs the GPU to operate properly. Since this is running locally for easier use/deployment, a database / server is not used for easier user configuration. A csv file is used to log phone numbers manipulated in the CRM. The CRM and Dialer have their own asynchronous functions that return a Promise. The asynchronous runLogic() function to manipulate the lead statuses recursively calls itself until there's no leads left. 

## Getting Started

In order for this application to run on your local computer, you must have Node.js installed as well as the required node modules. 

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

Node.js and express packages are required to run this application locally.  

## Installation

### Install Node and packages

- install Node.js from <https://nodejs.org/en/>

> Open a command prompt or terminal on your machine. "cd" (change directory) into the folder that contains the app. 

```shell
$ cd C:\Users\Adam\projects\crm-scripts-upwork
```

> install npm packages

```shell
$ npm install
```

> rename "env.txt" file to ".env"

> Open the file, and replace "<CREDENTIALS>" (including angle brackets) with your correct credentials for the CRM and dialer. 

> run the application

```shell
$ node app.js
```

## Built With

* [Node.js](https://nodejs.org/en/) - Server runtime environment for JavaScript
* [puppeteer](https://www.npmjs.com/package/puppeteer) - Puppeteer is a Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol.
* [moment](https://www.npmjs.com/package/moment/) - A lightweight JavaScript date library for parsing, validating, manipulating, and formatting dates.
* [fast-csv](https://www.npmjs.com/package/fast-csv) - Package that combines both @fast-csv/format and @fast-csv/parse into a single package.

## Authors

* **Adam Day** - [Adam Day](https://github.com/dayadam)

## Acknowledgments

* Thanks to all the open source contributors that helped with the building blocks of this project. 
 