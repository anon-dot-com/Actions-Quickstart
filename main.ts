import { Page } from 'playwright';
import { Authentication } from './authentication';
import * as dotenv from 'dotenv';
dotenv.config();
import { InstagramActions } from '../actions/instagramActions';
import { TwitterActions } from '../actions/twitterActions';
import { LinkedInActions } from '../actions/linkedinActions';
import { GeneralActions } from '../actions/generalActions';
async function performActions(page: Page) {
    const generalActions = new GeneralActions(page);

    const twitterActions = new TwitterActions(page);
    const samplePostURL = "https://x.com/AnonPlatform/status/1859748663087726601"
    await page.goto(samplePostURL);

}

async function main() {
    // TODO:set these as string values for your username and password
    const email = process.env.TWITTER_EMAIL;
    const password = process.env.TWITTER_PASSWORD;

    await Authentication.setupAuth(
        'twitter',
        email,
        password,
        "https://www.twitter.com",
        performActions
    ).catch(console.error);
}

main().catch(console.error);