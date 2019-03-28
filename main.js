const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const folderPath = './';

const files = fs
    .readdirSync(folderPath)
    .map(filename => filename)
    .filter(filename => path.extname(filename) === '.js' && filename !== 'main.js');

const execScript = script => {
    return new Promise((resolve, reject) => {
        const process = cp.fork(script);

        process.on('error', err => reject(err));
        process.on('exit', code => {
            const err = code === 0
                ? null
                : new Error(`exit code ${code}`);

            resolve(err);
        });
    });
}

files.forEach(async file => {
    try {
        await execScript(`./${file}`)
    } catch(e) {
        if (e) throw e;
        console.log(`finished running ${file}`);
    }
});
