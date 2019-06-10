const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const xmlReader = require('read-xml');

// image asset folder
var imageFolder = 'D:/FTP/MHE80_SVN/Learning_Mate_Conversion/Delivery2_12';

const XMLFolder = 'Grade_6_XML';
const XML_ROOT_PATH = path.resolve(`./${XMLFolder}/`);

const sheetPath = './output';

listFolders(XML_ROOT_PATH);

function listFolders(dirPath) {
    console.log("\x1b[33m", 'Looking into directory: ', dirPath, '\x1b[0m');
    fs.readdir(dirPath, (error, folders) => {
        if (error) {
            console.log('Error');
        } else {
            for (let i = 0; i < folders.length; i++) {
                const templateName = folders[i];
                const sheetName = templateName + '_missing_images' + '.xls';
                const folderPath = path.join(dirPath, templateName);

                // Create the directory if it does not exist
                if ( !fs.existsSync( sheetPath ) ) {
                    fs.mkdirSync( sheetPath );
                }
                listFiles(folderPath, folders[i], sheetPath, sheetName);
            }
        }
    });
}

const listFiles = (folderPath, subDirName, sheetPath, sheetName) => {
    console.log("\x1b[35m", 'Analyzing XLS files in', folderPath,  '\x1b[0m');
    fs.readdir(folderPath, (error, files) => {
        if (error) {
            console.log('Error');
        } else {
            var imageArr = [];
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
                const xmlFile = path.join(folderPath, fileName);
                // console.log('Reading XML File : ', xmlFile);
                let imageDetails = readXML(xmlFile, fileName, subDirName);
                if(imageDetails.length > 0) {
                    imageArr.push(imageDetails);
                }
            }
            writeToExcel(createExcelContent(imageArr), sheetPath, sheetName);
        }
    });
}

const readXML = (xmlFile, fileName, subDirName) => {
    try {
        let xmlStr = fs.readFileSync(xmlFile, "utf8");
        return findIMGFile(xmlStr, xmlFile, fileName, subDirName);
    } catch (error) {
        console.log(error);
    }
}

const findIMGFile = (xmlStr, xmlFile, fileName, subDirName) => {
    xmlStr = xmlStr.replace(/(image>)/gi, 'imageContent>');
    xmlStr = xmlStr.replace(/(text>)/gi, 'textContent>');
    xmlStr = xmlStr.replace(/(contentimageContent>)/gi, 'contentImage>');
    const xmlDom = new JSDOM(xmlStr);
    const document = xmlDom.window.document;
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
    return verifyImagePresence(imageList, fileName, subDirName);
}

// traverse through the rows of the sheet data
function verifyImagePresence(imageList, fileName, subDirName) {
    var fileList = [];
    for (let index = 0; index < imageList.length; index++) {
        const imageFileName = imageList[index].textContent;
        let doesExist = walkSync(imageFolder, imageFileName);
        if(!doesExist) {
            fileList.push({
                index: index,
                fileName: fileName,
                imageFileName: imageFileName
            });
        }
    }
    return fileList;
}

// fetch the image name resent in the row
const walkSync = (dir, fileName) => {
    var fs = fs || require('fs'),
        doesExist = false;
    var fileName = fileName;
    if(doesExists(dir + '/' + fileName)) {
        doesExist = true;
    }
    return doesExist;
};

const doesExists = (filePath) => {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

const createExcelContent = (imagesNotPresent) => {
    let title = 'Images Not present \n';
    let header = "Sl No" + "\t" + "Filename" + "\t" + "ImageCount" + "\t" + "Imagename" + "\n";
    let row = '';
    for (let index = 0; index < imagesNotPresent.length; index++) {
        let singleXMLData = imagesNotPresent[index];
        for (let inner = 0; inner < singleXMLData.length; inner++) {
            const imageData = singleXMLData[inner];
            if (imageData.imageFileName) {
                row += `${index + 1}\t${imageData.fileName}\t${imageData.index+1}\t${imageData.imageFileName}\n`;
            }            
        }
    }
    return row ? title + header + row : title;
}

const writeToExcel = (tableContents, sheetPath, sheetName) => {
    console.log('\x1b[32m','Creating XLS Sheet: '+ sheetPath + '/' + sheetName , '\x1b[0m');    
    if(!tableContents) {
        tableContents = "NO MISSING IMAGES FOUND";
    } 
    var writeStream = fs.createWriteStream(sheetPath + '/' + sheetName);
    writeStream.write(tableContents);
    writeStream.close();    
}
