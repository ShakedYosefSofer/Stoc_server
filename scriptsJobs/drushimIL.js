const puppeteer = require('puppeteer');
const fs = require('fs');

// Initialize browser
async function initializeBrowser() {
    return await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-gpu']
    });
}

// Wait and find element helper function
async function waitAndFindElement(page, selector, timeout = 10000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return await page.$(selector);
    } catch (error) {
        return null;
    }
}

// Click load more button
async function clickLoadMoreButton(page, clickCount = 5) {
    for (let i = 0; i < clickCount; i++) {
        try {
            const buttonSelector = "button.load_jobs_btn";
            const button = await waitAndFindElement(page, buttonSelector);

            if (button) {
                await page.evaluate(button => {
                    button.scrollIntoView();
                    button.click();
                }, button);
                console.log(`Click ${i + 1} on 'Show more jobs'`);
                await page.waitForTimeout(3000);
            } else {
                console.log("'Show more jobs' button not found");
                break;
            }
        } catch (error) {
            console.log(`Finished loading additional jobs: ${error.message}`);
            break;
        }
    }
}

// Get job details
async function getJobDetails(page, jobElement) {
    const details = {
        title: "",
        location: "",
        description: "",
        requirements: ""
    };

    try {
        // Get title
        const titleElement = await jobElement.$('.job-title');
        if (titleElement) {
            details.title = await page.evaluate(el => el.textContent.trim(), titleElement);
            console.log('Found title:', details.title);
        }

        // Click on the job to expand details
        try {
            await jobElement.click();
            await page.waitForTimeout(1000); // Wait for content to load
        } catch (error) {
            console.log('Could not click job element:', error.message);
        }

        // Get location
        const locationElement = await jobElement.$('.job-location');
        if (locationElement) {
            details.location = await page.evaluate(el => el.textContent.trim(), locationElement);
            console.log('Found location:', details.location);
        }

        // Get description
        const descriptionElement = await jobElement.$('.job-description');
        if (descriptionElement) {
            details.description = await page.evaluate(el => el.textContent.trim(), descriptionElement);
            console.log('Found description length:', details.description.length);
        }

        // Get requirements
        const requirementsElement = await jobElement.$('.job-requirements');
        if (requirementsElement) {
            details.requirements = await page.evaluate(el => el.textContent.trim(), requirementsElement);
            console.log('Found requirements length:', details.requirements.length);
        }

        // Attempt to extract missing details if selectors fail
        if (!details.description || !details.requirements) {
            const allText = await page.evaluate(el => el.innerText, jobElement);
            const textParts = allText.split('\n').filter(text => text.trim().length > 0);

            if (textParts.length > 2 && !details.description) {
                details.description = textParts[1];
            }
            if (textParts.length > 3 && !details.requirements) {
                details.requirements = textParts[2];
            }
        }

    } catch (error) {
        console.error('Error in getJobDetails:', error.message);
    }

    return details;
}

// Clean text helper function
function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

// Save data to JSON file
function saveToJsonFile(data, filename) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Data successfully saved to ${filename}`);
    } catch (error) {
        console.error('Error saving to file:', error);
    }
}

// Filter jobs based on keywords
const targetKeywords = [
    "Junior", "ג'וניור", "ללא ניסיון", "מתחיל",
    "סטודנט", "Student", "אקדמאי", "Academic",
    "בוגר", "Graduate"
];
const invalidKeywords = ["משרה מלאה", "משרה חלקית"];

function isJobRelevant(jobDetails) {
    const { title, description } = jobDetails;
    return targetKeywords.some(keyword => title.includes(keyword) || description.includes(keyword)) &&
           !invalidKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
}

// Main scraping function
async function scrapeJobs() {
    const browser = await initializeBrowser();
    const urls = [
        "https://www.drushim.co.il/jobs/cat6/?experience=1-2&ssaen=3",
        "https://www.drushim.co.il/jobs/cat24/?experience=1&ssaen=3"
    ];

    const allJobs = [];

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        for (const url of urls) {
            console.log(`\nProcessing URL: ${url}`);
            await page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 60000
            });

            // Wait for job listings to load
            await page.waitForSelector('.job-item', { timeout: 10000 });

            // Click "Load More" button multiple times
            await clickLoadMoreButton(page);

            // Get all job elements
            const jobElements = await page.$$('.job-item');
            console.log(`Found ${jobElements.length} jobs on page`);

            // Process each job
            for (let i = 0; i < jobElements.length; i++) {
                try {
                    console.log(`\nProcessing job ${i + 1} of ${jobElements.length}`);
                    const jobDetails = await getJobDetails(page, jobElements[i]);

                    jobDetails.title = cleanText(jobDetails.title || "");
                    jobDetails.location = cleanText(jobDetails.location || "");
                    jobDetails.description = cleanText(jobDetails.description || "");
                    jobDetails.requirements = cleanText(jobDetails.requirements || "");

                    if (jobDetails.title && jobDetails.description && isJobRelevant(jobDetails)) {
                        allJobs.push(jobDetails);
                        console.log(`Successfully added job: ${jobDetails.title}`);
                    } else {
                        console.log(`Filtered out job: ${jobDetails.title || 'Unknown title'}`);
                    }
                } catch (error) {
                    console.error(`Failed to process job ${i + 1}:`, error.message);
                }
            }
        }

    } catch (error) {
        console.error('Scraping error:', error);
    } finally {
        await browser.close();
    }

    // Save results to file
    console.log(`\nTotal jobs collected: ${allJobs.length}`);
    saveToJsonFile(allJobs, `drushim.json`);
}

// Run script
scrapeJobs().catch(console.error);
