const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const xmlReader = require('read-xml');

const XMLFolder = 'input';
const XML_ROOT_PATH = path.resolve(`./${XMLFolder}/`);

const sheetPath = './output';

const parameter = 'audio_greater_than_4';
listFolders(XML_ROOT_PATH, parameter);


function listFolders(dirPath, checkParamater) {
    console.log("\x1b[33m", 'Looking into directory: ', dirPath, '\x1b[0m');
    fs.readdir(dirPath, (error, folders) => {
        if (error) {
            console.log('Error');
        } else {
            for (let i = 0; i < folders.length; i++) {
                const templateName = folders[i];
                const sheetName = parameter + '_' + templateName + '_analysis' + '.xls';
                const folderPath = path.join(dirPath, templateName);

                // Create the directory if it does not exist
                if ( !fs.existsSync( sheetPath ) ) {
                    fs.mkdirSync( sheetPath );
                }
                listFiles(folderPath, folders[i], sheetPath, sheetName, checkParamater);
            }
        }
    });
}

const listFiles = (folderPath, subDirName, sheetPath, sheetName, checkParamater) => {
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
                let isSatisfying = readXML(xmlFile, fileName, subDirName, checkParamater);
                if(isSatisfying) {
                    imageArr.push(fileName);
                }
            }
            writeToExcel(createExcelContent(imageArr), sheetPath, sheetName);
        }
    });
}

const readXML = (xmlFile, fileName, subDirName, checkParamater) => {
    try {
        let xmlStr = fs.readFileSync(xmlFile, "utf8");
        console.log("Analyzing file : " + xmlFile);
        
        return analyzeXMLContent(xmlStr, xmlFile, fileName, subDirName, checkParamater);
    } catch (error) {
        console.log(error);
    }
}

const analyzeXMLContent = (xmlStr, xmlFile, fileName, subDirName, checkParamater) => {
    const xmlDom = new JSDOM(xmlStr);
    const document = xmlDom.window.document;
    switch (checkParamater) {
        case 'red_or_blue':
                return redOrBlueParameterSatisfy(document);
            break;
        case 'audio_greater_than_4':
                return audioParameterSatisfy(document, 4);
            break;
        default:
            console.log("\x1b[31m",'The parameter provided "' + checkParamater+ '" is not supported in the script', '\x1b[0m')
            break;
    }
   
}

const redOrBlueParameterSatisfy = (document) => {
    let parameterSatified = false;

    let directionsText = document.querySelector('directions') ?  document.querySelector('directions').textContent : '';
    if (directionsText && (directionsText.toLowerCase().indexOf('red box') > -1 ||
        directionsText.toLowerCase().indexOf('blue box') > -1)) {
        parameterSatified = true;
    }
    return parameterSatified;
}

const audioParameterSatisfy = (document, audioCount) => {
    let parameterSatified = false;
    let items = document.querySelectorAll('item');
    for (let index = 0; index < items.length; index++) {
        const screenContent = items[index];
        if(screenContent.querySelectorAll('audio').length >= audioCount) {
            parameterSatified = true
        }
    }
    return parameterSatified;
}

const createExcelContent = (fileList) => {
    let header = "Sl No" + "\t" + "Filename" + "\n";
    let row = '';
    for (let index = 0; index < fileList.length; index++) {
        if (fileList[index] !== '') {
            row += `${index + 1}\t${fileList[index]}\n`;
        }
    }
    return row ? header + row : 'No XMLs found in the provided parameter. \n';
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
