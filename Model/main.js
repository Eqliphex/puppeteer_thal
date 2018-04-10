const puppeteer = require('puppeteer');
const CREDS = require('../creds');

async function run() {
    // dom element selectors
    const USERNAME_SELECTOR = '#login_field';
    const PASSWORD_SELECTOR = '#password';
    const BUTTON_SELECTOR = '#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block';
    const LIST_USERNAME_SELECTOR = '#user_search_results > div.user-list > div:nth-child(INDEX) > div.d-flex > div > a';
    const LIST_EMAIL_SELECTOR = '#user_search_results > div.user-list > div:nth-child(INDEX) > div.d-flex > div > ul > li:nth-child(2) > a';
    const LENGTH_SELECTOR_CLASS = 'user-list-item';

    // Initilization:
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://github.com/login');


    // Login:
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(CREDS.username);

    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(CREDS.password);

    await page.click(BUTTON_SELECTOR);
    await page.waitForNavigation();

    // Search:
    const userToSearch = 'john';
    const searchUrl = `https://github.com/search?q=${userToSearch}&type=Users&utf8=%E2%9C%93`;

    await page.goto(searchUrl);
    await page.waitFor(2 * 1000);

    let numPages = await getNumPages(page);

    console.log('Numpages: ', numPages);

    for(let currentPageNum = 1; currentPageNum <= numPages; currentPageNum++) {
        let pageUrl = searchUrl + '&p=' + currentPageNum;

        await page.goto(pageUrl);

        let listLength = await page.evaluate((sel) => {
            return document.getElementsByClassName(sel).length;
        }, LENGTH_SELECTOR_CLASS);

        for (let i = 1; i <= listLength; i++) {
            // change the index to the next child
            let usernameSelector = LIST_USERNAME_SELECTOR.replace("INDEX", i);
            let emailSelector = LIST_EMAIL_SELECTOR.replace("INDEX", i);

            let username = await page.evaluate((sel) => {
                return document.querySelector(sel).getAttribute('href').replace('/', '');
            }, usernameSelector);

            let email = await page.evaluate((sel) => {
                let element = document.querySelector(sel);
                return element ? element.innerHTML : null;
            }, emailSelector);

            // not all users have emails visible
            if (email)
                console.log(username, ' -> ', email);
            else
                console.log(username, ' -> No public email!');
        }

    }
    browser.close();
}

async function getNumPages(page) {
    const NUM_USER_SELECTOR = '#js-pjax-container > div > div.columns > div.column.three-fourths.codesearch-results > div > div.d-flex.flex-justify-between.border-bottom.pb-3 > h3';
    const USERS_PER_PAGE = 10;

    let inner = await page.evaluate((sel) => {
        let html = document.querySelector(sel).innerHTML;

        return html.replace(',', '').replace('users', '').trim();
    }, NUM_USER_SELECTOR);

    let numUsers = parseInt(inner);
    console.log('numUsers: ', numUsers);

    let numPages = Math.ceil(numUsers / USERS_PER_PAGE);
    return numPages;
}

run();
