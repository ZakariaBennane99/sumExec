const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const port = 3904
const connectDB = require('./db.js')
const puppeteer = require('puppeteer')
const SumModel = require('./SumModel')
const nodemailer = require('nodemailer')

// connect the DB
connectDB()

app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))

// send an email once the process finishes
function sendMeEmail() {

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'zakariamonre@gmail.com',
        pass: 'Hamid.Saadia.1999'
      }
    });

    var mailOptions = {
      from: 'zakariamonre@gmail.com',
      to: 'zxb02@mail.aub.edu',
      subject: 'The Leadership Section Has Been Uploaded',
      text: 'That was easy!'
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    })

}
(async () => {

    const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium-browser', args: ["--no-sandbox"] })
    const page = await browser.newPage()

    await page.goto('https://www.getabstract.com/en/login', { timeout: 0 });

    // Type into login boxes
    await page.type('input[type="email"]', 'bennanezakaria45@gmail.com');
    await page.type('input[type="password"]', 'Man.On.Fire.2022');


    await waitFor(3000)


    // click submit
    await page.$eval('button[type="submit"]', el => el.click())

    // await until you enter the site
    await page.waitForSelector('a[href="/en/explore"]')
    await page.$eval('a[href="/en/explore"]', el => el.click())

    // wait
    await page.waitForSelector('a[href="/en/explore/channels"]')
    await page.$eval('a[href="/en/explore/channels"]', el => el.click())

    // wait
    // leadership section: a[href="/en/channels/leadership/1002"]

    const sections = [
        'a[href="/en/channels/leadership-mistakes/1288"]',
        'a[href="/en/channels/delegating/1600"]',
        'a[href="/en/channels/coaching/1338"]',
        'a[href="/en/channels/business-leaders/1001"]',
        'a[href="/en/channels/decision-making/1217"]',
        'a[href="/en/channels/performance-reviews/1148"]',
        'a[href="/en/channels/being-ceo/1120"]',
        'a[href="/en/channels/lessons-from-the-military/1119"]',
        'a[href="/en/channels/leading-teams/1007"]',
        'a[href="/en/channels/lessons-from-sports/118955"]'
    ]

    for (let i = 0; i < 10; i++) {

        await page.waitForSelector(sections[i])
        await page.$eval(sections[i], el => el.click())

        await waitFor(3000)

        await page.waitForSelector('span[class="chip chip-addon-left chip-addon-right"]:nth-of-type(2) button')
        await waitFor(3000)
        await page.$eval('span[class="chip chip-addon-left chip-addon-right"]:nth-of-type(2) button', el => el.click())

        await waitFor(3000)

        await page.waitForSelector('span[data-ga-filtering-option="BOOK"] button')
        await waitFor(2000)
        await page.$eval('span[data-ga-filtering-option="BOOK"] button', el => el.click())

        await page.waitForSelector('section[data-ga-filtering-name="minRatingFormFilter"] select')
        await waitFor(2000)
        await page.select('section[data-ga-filtering-name="minRatingFormFilter"] select', '6')

        await waitFor(2000)
        await page.waitForSelector('button[data-ga-filtering-apply=""]')
        await waitFor(2000)
        await page.$eval('button[data-ga-filtering-apply=""]', el => el.click())

        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })


        let final = null
        // get the length of elements in the leadership section
        // after you enlist all the summaries in the category
        while (final === null) {
            try {
                await page.waitForSelector('div[class="d-flex justify-content-center"] button', { timeout: 5000})
                await page.$eval('div[class="d-flex justify-content-center"] button', el => el.click())
            } catch {
                try {
                    await page.waitForSelector('a[href="/en/summary-suggestions"]', {timeout: 5000})
                    // after each iteretion update the final value
                    final = await page.$('a[href="/en/summary-suggestions"]')
                } catch {
                    continue
                }
            }
        }

        // reload the page to get the full list
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })


        const len = await page.$$eval(`main div[class="col"]`, sums => sums.length)


        for (let i = 1; i <= len; i++) {
            // click on the book
            await page.waitForSelector(`main div[class="col"]:nth-of-type(${i}) a`)
            await page.click(`main div[class="col"]:nth-of-type(${i}) a`)
            // click 'Read More'
            try {
                await page.waitForSelector('div[class="abstractUpgrade text-center"] form button[type="submit"]')
                await page.click('div[class="abstractUpgrade text-center"] form button[type="submit"]')
            } catch(err) {
                console.log(err)
            }
            await waitFor(5000)
            // now scrape the page and save to MongoDB
            const summaryRes = '[class="summary-typography"]'
            try {
                await page.waitForSelector(summaryRes)
            } catch {
                page.goBack()
                await waitFor(10000)
                continue
            }
            summ = await page.evaluate(() => {
                return ({
                    content: document.querySelector('[class="summary-typography"]').outerHTML,
                    title: document.querySelector('[class="h2 sumpage-header__title"]').textContent.trim().replace(/\s+/g, ' '),
                    author: document.querySelector('[class="sumpage-header__authors"]').textContent.trim().replace(/\s+/g, ' '),
                    category: 'Leadership & Management',
                })
            })
            let summary = new SumModel({
                content: summ.content,
                title: summ.title,
                author: summ.author,
                category: summ.category
            })
            await summary.save()
            // go back to the previous page
            await page.goBack()
        }

        // go back to previous section
        await page.goBack()

    }

    console.log('DONE MOTHERFUCKERS')
    await browser.close()

})()

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
