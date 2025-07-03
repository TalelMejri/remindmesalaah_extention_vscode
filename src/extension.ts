import * as vscode from 'vscode';
import axios from 'axios';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    updatePrayerTimes();
    setInterval(updatePrayerTimes, 60000);
}

async function updatePrayerTimes() {
    try {
     
        const locRes = await axios.get('https://ipapi.co/json/');
        const locData = locRes.data;
        const lat = locData.latitude;
        const lon = locData.longitude;


        const now = new Date();
        const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
        const apiURL = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=2`;
        const prayerRes = await axios.get(apiURL);
        const prayerData = prayerRes.data;

        const timings = prayerData.data.timings;
        const current = new Date();

      
        let nextPrayer = '';
        let minDiff = Infinity;

        for (const [name, timeStr] of Object.entries(timings)) {
            const time=timeStr as string;
            const [h, m] = time.split(':').map(Number);
            const prayerTime = new Date();
            prayerTime.setHours(h, m, 0, 0);

            const diff = (prayerTime.getTime() - current.getTime()) / 60000; 
            if (diff >= 0 && diff < minDiff) {
                minDiff = diff;
                nextPrayer = name;
            }
        }

        const remaining = Math.round(minDiff);
        const notifyMinutes = [30, 20, 15, 10, 5, 1];

        if (notifyMinutes.includes(remaining) || remaining <= 5) {
            statusBarItem.text = `🕌 ${remaining} min until ${nextPrayer}`;
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }

    } catch (err) {
        console.error(err);
        statusBarItem.text = '🕌 Error fetching prayer times';
        statusBarItem.show();
    }
}
export function deactivate() {}
