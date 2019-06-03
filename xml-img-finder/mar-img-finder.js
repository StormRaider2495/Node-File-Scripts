var args = process.argv.slice(2);
const fs = require('fs');
const path = require('path');
const xmlReader = require('read-xml');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const winston = require('winston');

var XML_PATH = '';
var assetFolderName = 'assets_maravillas';
// set subDir Name to the child folder
var subDirName = args ? args : 'click_to_choose';
var row = '', serialCount = 0;
var imageFound = false;
const ASSET_ROOT_PATH = path.resolve(`./${assetFolderName}/`);
const SCRIPT_PATH = process.env.SCRIPT_PATH || path.resolve(__dirname);


console.log('Current Directory: ', SCRIPT_PATH);
console.log('SOD XML Directory: ', XML_PATH);

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
            imageFound = false;
            let i = 0;
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
    xmlStr = xmlStr.replace(/(image>)/gi, 'imageContent>');
    xmlStr = xmlStr.replace(/(text>)/gi, 'textContent>');
    const xmlDom = new JSDOM(xmlStr);
    imageFileName = '';
    var document = xmlDom.window.document;
    switch (subDirName) {
        case 'word_vault':
            imageList = document.querySelectorAll('vaultimageContent');
            break;
        case 'build_a_scene':
            imageList = document.querySelectorAll('contentImage');
            break;
        case 'sorting_open_defined':
            imageList = document.querySelectorAll('textContent');
            break;
        default:
            imageList = document.querySelectorAll('imageContent');
            break;
    }

    for (let index = 0; index < imageList.length; index++) {
        const imageFileName = imageList[index].textContent;
        if(imageFileName.match(/(jpg)|(jpeg)|(png)/gi)) {
            imageFound = true;
            logger.info(`${fileName}:  ${imageFileName}`);
            row += `${++serialCount}\t${fileName}\t${index + 1}\t${imageFileName}\n`;     
        }
    }
    writeToXML(row);
}

const writeToXML = (tableContents) => {
    if(!tableContents) {
        tableContents = "NO IMAGES FOUND";
    } 
    var header="Sl No"+"\t"+" Filename"+"\t"+"ImageCount"+"\t"+"Imagename"+"\n";
    var writeStream = fs.createWriteStream(`${subDirName}_image_list.xls`);
    writeStream.write(header + tableContents);
    writeStream.close();    
}

fs.readdir(ASSET_ROOT_PATH, function(err, dirList) {
    console.log(dirList);
    // dir = 1;
    // for (let dir = 0; dir < dirList.length; dir++) {
        // subDirName = dirList[dir];
        console.log(subDirName);
        XML_PATH = path.resolve(`./${assetFolderName}/${subDirName}/`);
        listFiles(XML_PATH);
    // }
});

