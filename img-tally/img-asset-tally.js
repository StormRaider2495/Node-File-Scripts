var XLSX = require('xlsx');
var fs = require('fs');

// image asset folder
var imageFolder = 'D:/FTP/MHE87/LM_Game_Conversion/Phase_Two/Maravillas/Images';

var XMLFolder = 'Grade_6_XML';

const ASSET_ROOT_PATH = path.resolve(`./${XMLFolder}/`);

for (let index = 0; index < list.length; index++) {
    var template = list[index];
    
    var sheetPath = './maravillas-image-list/';
    var sheetName = template + '.xls';
    
    var writePath = './missing-images-list/';
    var writeName = template.replace(/(_image_list)/gi,'') + '_missing_images' + '.xls';
    
    // Create the directory if it does not exist
    if ( !fs.existsSync( writePath ) ) {
        fs.mkdirSync( writePath );
    }
    
    var workbook = XLSX.readFile(sheetPath + sheetName);
    var sheet_name_list = workbook.SheetNames;
    // get the data of the first sheet in the excel file
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    
    let imagesNotPresent = checkForImages();
    writeToExcel(createExcelContent(imagesNotPresent));
    
}


function createExcelContent(imagesNotPresent) {
let title = 'Images Not present \n';
let header = "Sl No"+"\t"+" Filename"+"\t"+"ImageCount"+"\t"+"Imagename"+"\n";
let row = '';
 for (let index = 0; index < imagesNotPresent.length; index++) {
    if(imagesNotPresent[index]['Imagename']) {
        row += `${imagesNotPresent[index]['Sl No']}\t${imagesNotPresent[index][' Filename']}\t${imagesNotPresent[index]['ImageCount']}\t${imagesNotPresent[index]['Imagename']}\n`;  
    }
 }
 return row ? title + header + row : title;
}

function writeToExcel(tableContents) {
    if(!tableContents) {
        tableContents = "NO MISSING IMAGES FOUND";
    } 
    var writeStream = fs.createWriteStream(writePath + writeName);
    writeStream.write(tableContents);
    writeStream.close();    
}

// traverse through the rows of the sheet data
function checkForImages() {
    var fileList = [];
    for (let index = 0; index < xlData.length; index++) {
        const rowData = xlData[index];
        const image = rowData.Imagename;
        let returnStr = walkSync(imageFolder, image, rowData);
        if(returnStr) {
            fileList.push(returnStr);
        }
    }
    return fileList;
}

// fetch the image name resent in the row
function walkSync(dir, fileName, rowData) {
    var fs = fs || require('fs'),
        fileList = '',
        folders = fs.readdirSync(dir),
        doesExist = false;
    var fileName = fileName;
    for (let index = 0; index < folders.length; index++) {
        const folder = folders[index];
        if (fs.statSync(dir + '/' + folder).isDirectory()) {
            // check presence of file in dir
            if (doesExists(dir + '/' + folder + '/' + fileName)) {
                doesExist = true;
            }
        }
        if(index === folders.length -1 && doesExist === false) {
            fileList = rowData;
        }
    }
    return rowData;
};

function doesExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}
// check the image against the image path array
console.log(xlData);