var fs = require('fs');
var parseString = require('xml2js').parseString;
const args = process.argv;
const fileName = args[2];
if (fileName && fileName.split('/')[fileName.split('/').length - 1].split('.')[1] === 'xml') {
    var jsonFileName = fileName.split('/')[fileName.split('/').length - 1].slice(0, -4);
    var path = fileName.split(fileName.split('/')[fileName.split('/').length - 1])[0];
    fs.readFile(fileName, 'utf8', function (error, data) {
        if (!error) {
            try {
                var jsonData = ConvertXML2JSON(data);
                writeDataToFile(jsonFileName, JSON.stringify(jsonData));
            } catch (err) {
                console.log(err);
            }
        } else {
            console.log(error);
        }
    });
} else {
    console.log('Enter XML fileName in paramters for conversion to take place.');
}

function ConvertXML2JSON(data) {
    parseString(data, function (err, result) {
        if (err) {
            throw new Error(err);
        }
        console.log('File parsing successfull.');
        // parse blendingD XML
        if (Object.keys(result)[0] === 'blendingd') {
            return convertBlendingdXml(result);
        } else if (Object.keys(result)[0] === 'high_freq_words_v2') {
            return convertHighFreqWordsV2(result)
        }
    });
}

// convert high_freq_words_v2 XML to JSON
function convertHighFreqWordsV2(result) {
    return result;
}

// convert blending_d XML to JSON
function convertBlendingdXml(result) {
    var jsonData = {};
    jsonData.type = 'blending_d';
    jsonData.title = result.blendingd.title[0];
    jsonData.contentMode = {
        "value": "images"
    };
    jsonData.directions = {
        "text": "Blend the sounds to say the word. Listen to each answer choice. Click on the circle that matches the word.",
        "audio": "ela_bld_k21_as_dl.mp3"
    };
    jsonData.sfxPool = {
        "value": "pool1"
    };
    jsonData.background = {
        "value": "yellow2.png"
    };
    jsonData.help = {
        "text": "<strong>Blending</strong> Help<p><strong>Read</strong> the directions at the start of the activity.</p><p><strong>Click</strong> or <strong>tap</strong> on the speaker button next to each picture to hear the word.</p><p>Then <strong>click</strong> or <strong>tap</strong> on the small sound boxes below each picture to hear the sounds in a word. Identify the sound that is the same in all words.</p><p><strong>Select</strong> one of the large boxes to indicate if the common sound is a beginning, middle, or ending sound.</p><p>As an alternative to the mouse, the keyboard may be used. Press <strong>Tab</strong> to move to a desired location, and then press <strong>Enter</strong> to select your answer.</p><p>Use the <strong>Previous</strong> and <strong>Next</strong> buttons to navigate between question screens.</p><p class='para'><strong>Top Buttons</strong></p><p>Use the button with the <strong>question mark</strong> to come back to this help page.</p><p>Use the button with the <strong>X</strong> to close the activity.</p>",
        "audio": "Blending_B_Help.mp3"
    };
    jsonData.feedback = {
        "correct": {
            "text": "Correct",
            "audio": "assets/common/sfx/excellent_work_1.mp3"
        },
        "incorrect": {
            "text": "Incorrect",
            "audio": "assets/common/sfx/not_correct_try_again_1.mp3"
        }
    };
    jsonData.screens = [];
    var activityScreenContent = result.blendingd.rounds[0].round[0].activityscreens[0].item;
    for (var index = 0; index < activityScreenContent.length; index++) {
        var screenItem = {};
        // get screen data present in the xml
        var xmlScreenData = activityScreenContent[index];
        // create screen item from xml
        screenItem.guid = xmlScreenData.guid[0];
        screenItem.directions = {
            'text': xmlScreenData.directions[0],
            'audio': xmlScreenData.directionsAudio[0]
        };
        screenItem.feedback = {
            "correct": {
                "text": "Correct",
                "audio": "correct.mp3"
            },
            "incorrect": {
                "text": "Incorrect",
                "audio": "incorrect.mp3"
            }
        };
        screenItem.sounds = [];
        for (let inner = 0; inner < xmlScreenData.sounds[0].sound.length; inner++) {
            screenItem.sounds.push({
                'text': xmlScreenData.sounds[0].sound[inner].text[0]
            });
        }
        screenItem.answers = [];
        for (let inner = 0; inner < xmlScreenData.answers[0].answer.length; inner++) {
            screenItem.answers.push({
                'word': xmlScreenData.answers[0].answer[inner].word[0],
                'audio': xmlScreenData.answers[0].answer[inner].audio[0],
                'correct': xmlScreenData.answers[0].answer[inner].correct[0]['$'].value
            });
        }
        // push screen data to jsonData['screens']
        jsonData.screens.push(screenItem);
    }
    return jsonData;
}

function writeDataToFile(jsonFileName, data) {
    var dir = path + 'JSON files';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    // write data to a new file
    fs.writeFile(dir + '/' + jsonFileName + '.json', data, function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}