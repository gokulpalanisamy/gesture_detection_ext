/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */

if (!window.requestAnimationFrame) {

    window.requestAnimationFrame = (function () {

        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function ( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {

                window.setTimeout(callback, 1000 / 30);

            };

    })();

}


//---- Request animation ends ---/

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;
var video = document.createElement("video");
video.id = "myCam";
video.autoplay = true;
document.body.appendChild(video);
document.getElementById('myCam').style.display = 'none';

var camvideo = document.getElementById('myCam');


navigator.getUserMedia({
    video: true
}, gotStream, noStream);


function gotStream(stream) {
    if (window.URL) {
        camvideo.src = window.URL.createObjectURL(stream);
    } else // Opera
    {
        camvideo.src = stream;
    }

}

function noStream(e) {

}



var videoCanvas = document.createElement("canvas");
videoCanvas.id = "videoCanvas";
document.body.appendChild(videoCanvas);
document.getElementById('videoCanvas').style.display = 'none';


var blendCanvas = document.createElement("canvas");
blendCanvas.id = "blendCanvas";
document.body.appendChild(blendCanvas);
document.getElementById('blendCanvas').style.display = 'none';


// Motion Detection //
// assign global variables to HTML elements
var video = document.getElementById('myCam');
var videoCanvas = document.getElementById('videoCanvas');
var videoContext = videoCanvas.getContext('2d');

var blendCanvas = document.getElementById("blendCanvas");
var blendContext = blendCanvas.getContext('2d');

var messageArea = document.getElementById("messageArea");

var frame_number = 0;
var motion_frame_gap = 7;
var grid_size = 5;
var frame_gap_count = 0;
var motion_array = [];
var motion_frame_array = [];
var row_col_map = {};
var up_down_cursor = 0;
var left_right_cursor = 0;
generateRowColMap();
var valid_stand_difference = 3;


function generateRowColMap() {
    var row_no = 1;
    var col_no = 1;
    for (var i = 1; i <= grid_size * grid_size; i++) {
        row_col_map[i] = [row_no, col_no];
        col_no++;
        if ((i % 5) === 0) {
            row_no++;
            col_no = 1;
        }
    }
}
// these changes are permanent
videoContext.translate(320, 0);
videoContext.scale(-1, 1);

// background color if no video present
videoContext.fillStyle = '#eaeaea';
videoContext.fillRect(0, 0, videoCanvas.width, videoCanvas.height);



// start the loop               
animate();

function animate() {

    requestAnimationFrame(animate);
    render();
    blend();
    checkHotspots();
}

function render() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // mirror video
        videoContext.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);

    }
}

var lastImageData;

function blend() {
    var width = videoCanvas.width;
    var height = videoCanvas.height;
    // get current webcam image data
    var sourceData = videoContext.getImageData(0, 0, width, height);
    // create an image if the previous image doesn�t exist
    if (!lastImageData) {
        frame_number = 0;
        lastImageData = videoContext.getImageData(0, 0, width, height);
    } else {
        frame_number++;
    }
    // create a ImageData instance to receive the blended result

    var blendedData = videoContext.createImageData(width, height);
    // blend the 2 images
    checkDiff(sourceData.data, lastImageData.data, blendedData.data);
    // draw the result in a canvas
    // console.log(blendedData.data);
    blendContext.putImageData(blendedData, 0, 0);

    if (frame_number % 60 === 0) {
        findMotion();
        motion_array = [];
    }

    // store the current webcam image
    lastImageData = sourceData;
}

function findMotion() {
    var direction = findDirection();
    // console.log(longestSequence);
    var stands = generateStands();
    var longestSequence = getLongestArray(stands);
    if (longestSequence) {
        var dirPath = getSequenceDirection(longestSequence[0], longestSequence[1]);
        var directionPathVar = directionPath(direction, dirPath);
        performAction(directionPathVar);
        console.log(directionPathVar);

    }
}

function performAction(directionPathVar) {

    if (directionPathVar !== 'None') {
        switch (directionPathVar) {
            case 'Up':
                if (up_down_cursor <= $(document).height()) {
                    up_down_cursor = up_down_cursor + 650;
                    $('html').animate({
                        scrollTop: up_down_cursor
                    }, 500, 'swing');
                    console.log(up_down_cursor);
                } else {
                    console.log('reached EOD');
                }
                break;
            case 'Down':
                if (up_down_cursor !== 0) {
                    up_down_cursor = up_down_cursor - 650;
                    $('html').animate({
                        scrollTop: up_down_cursor
                    }, 300, 'swing');
                    console.log(up_down_cursor);
                } else {
                    console.log('reached Beginning of file');

                }
                break;
            case 'Left':
                if (left_right_cursor <= $(document).width()) {
                    left_right_cursor = left_right_cursor + 500;
                    $('html').animate({
                        scrollLeft: left_right_cursor
                    }, 300, 'swing');
                    console.log(left_right_cursor);
                } else {
                    console.log('reached end right');
                }
                break;
            case 'Right':
                if (left_right_cursor !== 0) {
                    left_right_cursor = left_right_cursor - 500;
                    $('html').animate({
                        scrollLeft: left_right_cursor
                    }, 500, 'swing');
                    console.log(left_right_cursor);
                } else {
                    console.log('reached beginning left');
                }
                break;
            default:
                break;
        }
    }
}

function getLongestArray(array) {
    var highest_length_index = 0;
    for (var i = 0; i < array.length - 1; i++) {
        if (array[i + 1].length > array[i].length) {
            highest_length_index = i + 1;
        } else {
            highest_length_index = i;
        }
    }
    return array[highest_length_index];
}

function directionPath(direction, dirPath) {
    var path = 'None';
    if (direction === 'Horizontal') {
        if (dirPath === 'Ascending') {
            path = 'Right';
        } else if (dirPath === 'Descending') {
            path = 'Left';
        }
    } else if (direction === 'Vertical') {
        if (dirPath === 'Ascending') {
            path = 'Down';
        } else if (dirPath === 'Descending') {
            path = 'Up';
        }
    }
    return path;
}

function generateStands() {
    var stands = [];
    var temp_array = [];
    var isGreater = true;
    var isLesser = true;
    for (var i = 0; i < motion_array.length - 1; i++) {
        var currentFrameOnesCount = motion_array[i];
        var nextFrameOnesCount = motion_array[i + 1];
        if (currentFrameOnesCount > nextFrameOnesCount) {
            isLesser = true;
            if (isGreater) {
                if (temp_array.length > 0) {
                    temp_array.push(motion_array[i]);
                    stands.push(temp_array);
                }
                temp_array = [];
                isGreater = false;
            }
            temp_array.push(motion_array[i]);
        } else if (currentFrameOnesCount < nextFrameOnesCount) {
            isGreater = true;
            if (isLesser) {
                if (temp_array.length > 0) {
                    temp_array.push(motion_array[i]);
                    stands.push(temp_array);
                }
                temp_array = [];
                isLesser = false;
            }
            temp_array.push(motion_array[i]);
        } else {
            isLesser = true;
            isGreater = true;
            temp_array.push(motion_array[i + 1]);
        }
    }
    if (temp_array.length > 0) {
        temp_array.push(motion_array[i]);
        stands.push(temp_array);
    }
    return stands;
}

function getSequenceDirection(first, second) {
    var seqDirection = 'None';
    if (first > second) {
        seqDirection = 'Descending';
    } else if (first < second) {
        seqDirection = 'Ascending';
    } else {
        /* console.log('Sequence direction is None. No difference between the first and second value'); */
    }
    return seqDirection;
}

function findDirection() {
    // var direction = 'None';
    var x_Array = [];
    var y_array = [];
    for (var i = 0; i < motion_array.length; i++) {
        var rowColumnArray = getRowColumnNumber(motion_array[i]);
        x_Array.push(rowColumnArray[0]);
        y_array.push(rowColumnArray[1]);
    }
    var maxMin_X = Math.max(...x_Array) - Math.min(...x_Array);
    var maxMin_Y = Math.max(...y_array) - Math.min(...y_array);
    if (maxMin_X < maxMin_Y) {
        return 'Horizontal';
    } else if (maxMin_X > maxMin_Y) {
        return 'Vertical';
    } else {
        return '';
        /* console.log('Direction is not recognized'); */
    }
    // console.log('Direction: ' + direction);
    // return direction;
}

function getRowColumnNumber(box_number) {
    return row_col_map[box_number];
}

function checkDiff(currentImage, lastImage, output) {
    var i = 0;
    while (i < (currentImage.length / 4)) {
        var average1 = (currentImage[4 * i] + currentImage[4 * i + 1] + currentImage[4 * i + 2]) / 3;
        var average2 = (lastImage[4 * i] + lastImage[4 * i + 1] + lastImage[4 * i + 2]) / 3;
        var diff = threshold((average1 - average2));
        output[4 * i] = diff;
        output[4 * i + 1] = diff;
        output[4 * i + 2] = diff;
        output[4 * i + 3] = 0xff;
        ++i;
    }
}

function fastAbs(value) {
    return (value ^ (value >> 31)) - (value >> 31);
}

function threshold(value) {
    return (value > 0x15) ? 0xFF : 0;
}


function checkHotspots() {
    var hotspot_number_array = [];
    var data1 = getHotspotArray();

    for (var x = 0; x < data1.length; x++) {
        var i = 0;
        var sum = 0;
        var countPixels = data1[x].data.length * 0.25;
        while (i < countPixels) {
            sum += (data1[x].data[i * 4] + data1[x].data[i * 4 + 1] + data1[x].data[i * 4 + 2]);
            ++i;
        }
        // calculate an average between of the color values of the note area [0-255]
        var average = Math.round(sum / (3 * countPixels));
        if (average > 50) // more than 20% movement detected
        {
            hotspot_number_array.push(x + 1);
        }
    }
    if (hotspot_number_array.length > 0) {
        motion_array.push(max(hotspot_number_array));
    }
}

function max(hotspot_number_array) {
    return Math.max(...hotspot_number_array);
}

function getHotspotArray() {
    var hotspot_width = videoCanvas.width / grid_size;
    var hotspot_height = videoCanvas.height / grid_size;
    var data_array = [];
    var y_cord = 0;
    var x_cord = 0;
    for (var i = 0; i < grid_size * grid_size; i++) {
        data_array.push(blendContext.getImageData(x_cord, y_cord, hotspot_width, hotspot_height));
        if ((i + 1) % 5 == 0) {
            y_cord = y_cord + hotspot_height;
            x_cord = 0;
        } else {
            x_cord = x_cord + hotspot_width;
        }
    }
    return data_array;
}