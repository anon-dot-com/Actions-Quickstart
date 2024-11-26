import { chromium, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export class Authentication {
    private static readonly authFiles = {
        linkedin: path.join(__dirname, '/.auth/linkedin.json'),
        twitter: path.join(__dirname, '/.auth/twitter.json'),
        instagram: path.join(__dirname, '/.auth/instagram.json')
    };

    private static readonly platformConfigs = {
        linkedin: {
            loginUrl: 'https://www.linkedin.com/login',
            homeUrl: 'https://www.linkedin.com',
            async login(page: Page, email: string, password: string) {
                await page.fill('#username', email);
                await page.fill('#password', password);
                await page.click('[type="submit"]');
            }
        },
        twitter: {
            loginUrl: 'https://x.com/',
            homeUrl: 'https://twitter.com/home',
            async login(page: Page, email: string, password: string) {
                await page.getByTestId('loginButton').click();
                await page.getByLabel('Phone, email, or username').click();
                await page.getByLabel('Phone, email, or username').fill(email);
                await page.getByRole('button', { name: 'Next' }).click();
                await page.getByLabel('Password', { exact: true }).fill(password);
                await page.getByTestId('LoginForm_Login_Button').click();
                await page.waitForURL('https://x.com/home', { timeout: 30000 });
                await page.waitForSelector('[data-testid="primaryColumn"]', { timeout: 30000 });
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        },
        instagram: {
            loginUrl: 'https://www.instagram.com/accounts/login/',
            homeUrl: 'https://www.instagram.com',
            async login(page: Page, email: string, password: string) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                await page.getByLabel('Phone number, username, or').click();
                await page.getByLabel('Phone number, username, or').fill(email);
                await page.getByLabel('Phone number, username, or').press('Tab');
                await page.getByLabel('Password').fill(password);
                await page.getByRole('button', { name: 'Log in', exact: true }).click();
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    };

    static async setupAuth(
        platform: 'linkedin' | 'twitter' | 'instagram',
        email: string,
        password: string,
        targetURL?: string,
        callback?: (page: Page) => Promise<void>
    ) {
        const authFile = this.authFiles[platform];
        const config = this.platformConfigs[platform];
        
        const authDir = path.dirname(authFile);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        const browser = await chromium.launch({
            headless: false
        });

        try {
            if (fs.existsSync(authFile)) {
                console.log('Using existing auth state...');
                const context = await browser.newContext({
                    storageState: authFile
                });
                const page = await context.newPage();
                await page.goto(targetURL || config.homeUrl);
                
                if (platform === 'twitter') {
                    await page.waitForSelector('[data-testid="primaryColumn"]', { timeout: 30000 });
                }
                
                if (callback) {
                    await callback(page);
                }
                await context.close();
            } else {
                console.log('No auth state found, performing login...');
                const context = await browser.newContext();
                const page = await context.newPage();
                await page.goto(config.loginUrl);
                await config.login(page, email, password);
                await context.storageState({ path: authFile });
                console.log(`Authentication state saved to: ${authFile}`);
                await context.close();
            }
        } finally {
            await browser.close();
        }
    }
} 