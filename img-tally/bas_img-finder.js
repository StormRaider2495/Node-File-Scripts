const fs = require('fs');
const path = require('path');
const xmlReader = require('read-xml');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const winston = require('winston');

const SCRIPT_PATH = process.env.SCRIPT_PATH || path.resolve(__dirname);
const XML_PATH = path.resolve('./assets/build_a_scene/');

var row = '', serialCount = 0;

console.log('Current Directory: ', SCRIPT_PATH);
console.log('SOD XML Directory: ', XML_PATH);
// console.log('SOD JSON Directory: ', SOD_JSON);

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
                console.log('Reading XML File : ', xmlFile);
                readXML(xmlFile, fileName);
            }
        }
    });
}

const readXML = (xmlFile, fileName) => {
    const decodedXMLStream = fs.createReadStream(xmlFile).pipe(xmlReader.createStream());
    decodedXMLStream.on('encodingDetected', (encoding) => {
        console.log('Encoding:', encoding);
    });    
    decodedXMLStream.on('data', (xmlStr) => {
        try {
            findIMGFile(xmlStr, xmlFile, fileName);
        } catch (error) {
            console.log(error);
        }
    });
    console.log('IMG file read complete');
    decodedXMLStream.on('error', function (err) {
        console.log(err);
    });
}

const findIMGFile = (xmlStr, xmlFile, fileName) => {
    const xmlDom = new JSDOM(xmlStr);
    imageFileName = '';
    imageList = xmlDom.window.document.querySelectorAll('contentImage');
    for (let index = 0; index < imageList.length; index++) {
        const imageFileName = imageList[index].textContent;
        logger.info(`${fileName}:  ${imageFileName}`);
        row += `${++serialCount}\t${fileName}\t${index + 1}\t${imageFileName}\n`;      
    }
    writeToXML(row);
}

const writeToXML = (tableContents) => {
    var header="Sl No"+"\t"+" Filename"+"\t"+"ImageCount"+"\t"+"Imagename"+"\n";
    var writeStream = fs.createWriteStream("file.xls");
    writeStream.write(header + tableContents);
    writeStream.close();
}
listFiles(XML_PATH);
