const fs = require('fs');
const path = require('path');
const xmlReader = require('read-xml');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const winston = require('winston');

const SCRIPT_PATH = process.env.SCRIPT_PATH || path.resolve(__dirname);
const SOD_PATH = path.resolve('./assets/Sorting_Open_Defined/');
const SOD_XML = path.resolve('./assets/Sorting_Open_Defined/xml');
const SOD_JSON = path.resolve('./assets/Sorting_Open_Defined/json');

console.log('Current Directory: ', SCRIPT_PATH);
console.log('SOD XML Directory: ', SOD_XML);
console.log('SOD JSON Directory: ', SOD_JSON);

var logDir = 'logs'; // directory path you want to set
if ( !fs.existsSync( logDir ) ) {
    // Create the directory if it does not exist
    fs.mkdirSync( logDir );
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log` 
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({
            filename: path.join(logDir, 'search.log'),
            options: { flags: 'w' },
            level: 'info'
        })
    ]
});

const loggerErr = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'info.log'),
            options: { flags: 'w' },
            level: 'info'
        })
    ]
});
const logMissingFiles = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            options: { flags: 'w' },
            level: 'error'
        })
    ]
});

const listFiles = (dirPath) => {
    // logger.clear();
    console.log('Looking into directory: ', dirPath);
    fs.readdir(dirPath, (error, files) => {
        if (error) {
            console.log('Error')
        } else {
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
                const xmlFile = path.join(dirPath, fileName);
                const jsonFile = path.join(SOD_JSON, fileName.replace(/.xml/g, '.json'));
                console.log('Reading XML File : ', xmlFile);
                console.log('Reading JSON File : ', jsonFile);
                readXML(xmlFile, jsonFile, fileName);
            }
        }
    })
}

const readXML = (xmlFile, jsonFile, fileName) => {
    const decodedXMLStream = fs.createReadStream(xmlFile).pipe(xmlReader.createStream());

    decodedXMLStream.on('encodingDetected', (encoding) => {
        console.log('Encoding:', encoding);
    });

    decodedXMLStream.on('data', (xmlStr) => {
        try {
            readJSON(xmlStr, xmlFile, jsonFile, fileName);
        } catch (error) {
            console.log(error);
        }
    });

    decodedXMLStream.on('error', function (err) {
        console.log(err);
    });
}

const readJSON = (xmlStr, xmlFile, jsonFile, fileName) => {
    let readStream = fs.createReadStream(jsonFile);
    let decodedJSONStream = readStream.pipe(xmlReader.createStream());

    readStream.on('error', function (err) {
        logMissingFiles.error(`File: ${fileName}`)
    });

    decodedJSONStream.on('encodingDetected', (encoding) => {
        console.log('Encoding:', encoding);
    });

    decodedJSONStream.on('data', (jsonStr) => {
        findDifferences('', xmlStr, xmlFile, jsonStr, jsonFile, fileName);
    });

}



const findDifferences = (regEx = '', xmlStr, xmlFile, jsonStr, jsonFile, fileName) => {
    const xmlDom = new JSDOM(xmlStr);
    const jsonData = JSON.parse(jsonStr);
    console.log(jsonFile);
    screensLengthForXML = xmlDom.window.document.querySelectorAll('screens>item').length;
    screenLengthForJSON = jsonData.levels[0].screens.length;
    if (jsonData.levels.length === 1) {

        if (screensLengthForXML != screenLengthForJSON) {
            logger.info(`File_A: ${fileName}`);
        }

        // log file names with miss-match bins
        for (let index = 0; index < xmlDom.window.document.querySelectorAll('round>screens>item>bins').length; index++) {
            const element = xmlDom.window.document.querySelectorAll('round>screens>item>bins')[index];
            if (element.querySelectorAll('bin').length !== jsonData.levels[0].screens[index].bins.length) {
                loggerErr.info(`File_B: ${fileName}`);
                break;
            }
        }
    } else {
        console.log(`${jsonFile}`);
    }


}

listFiles(SOD_XML);