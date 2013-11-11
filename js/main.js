var worker = new Worker("./js/worker.js");
var IMG_SIZE = 128;
var TIMEOUT = 1000 / 5;
var IMG_WIDTH = 640 / 2;
var IMG_HEIGHT = 480 / 2;
var MAX_TIME = 5;

var LIMIT_TIME_TEXT = "Limit time: ";

var workingSpaceElem;
var imageDataList;
function convertImgElemToImgData(imgElem) {
  var canvasElem = document.createElement("canvas");
  canvasElem.style.width = IMG_WIDTH / 2 + "px";
  canvasElem.style.height = IMG_HEIGHT / 2 + "px";
  workingSpaceElem.appendChild(canvasElem);
  var ctx = canvasElem.getContext("2d");
  ctx.drawImage(imgElem,0,0,IMG_WIDTH / 2,IMG_HEIGHT / 2);
  var imgData = ctx.getImageData(0,0,IMG_WIDTH / 2,IMG_HEIGHT / 2);
  workingSpaceElem.removeChild(canvasElem);
  return imgData;
}

function createProgressMessageElem() {
  var e = document.createElement("span");
  e.style.display = "inline-block";
  e.style.border = "solid 1px #666666";
  e.style.verticalAlign = "top";
  e.style.width = IMG_WIDTH + "px";
  e.style.height = IMG_HEIGHT + "px";
  e.textContent = "please wait...";
  return e;
}


$(function () {
  var $video = $("#video");
  var canvas = $("#canvas-video")[0];
  var context = canvas.getContext("2d");
  var $img = $("#img");
  var $generate = $('#generate');
  var $start = $("#start");
  var $timer = $("#timer");
  $timer.text(LIMIT_TIME_TEXT + MAX_TIME);
  var startFlag = false;

  var cammeraStream = null;
  var isCapturing = false;

  var windowURL = window.URL || window.webkitURL;
  navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;

  if (windowURL == null || navigator.getUserMedia == null) {
    alert("このブラウザじゃ動かないよ");
    return;
  }

  var cameraStop = function() {
    isCapturing = false;
    if (cammeraStream == null) return;
    cammeraStream.stop();
  };

  var images = [];

  var imageSetStop = function() {
    startFlag = false;
    $timer.hide();
    $start.show();
    $('#show-gif').modal('show');
  };

  var generateGif = function() {
    var randomImages = getRandomWorkImages(images);
    console.log(randomImages);

    // create gif
    workingSpaceElem = document.createElement("div");
    workingSpaceElem.style.height = "1px";
    workingSpaceElem.style.overflow = "hidden";

    imageDataList = randomImages.map(function (e) {
      var d;
      try {
        // error will occur if img couldn't be loaded
        var d = convertImgElemToImgData(e);
      } catch (err) {}
      return d;
    }).filter(function (e) {
      return !!e;
    });

    if (imageDataList.length === 0) {
      alert("No image could be loaded...");
      return;
    }

    var $resultContElem = $("#result-container");
    $resultContElem.empty();

    var resultContElem = document.getElementById("result-container");
    resultContElem.insertBefore(createProgressMessageElem(), resultContElem.firstChild);
    worker.onmessage = function (evt) {
      var msg = evt.data;
      var imgElem = document.createElement("img");
      var base64Str = btoa(msg.gifDataStr);
      imgElem.src = "data:image/gif;base64," + base64Str;
      imgElem.width = IMG_WIDTH;
      imgElem.height = IMG_HEIGHT;
      var e = resultContElem.firstChild;
      while (e && e.tagName === "SPAN") {
        e = e.nextSibling;
      }
      resultContElem.insertBefore(imgElem, e);
      if (resultContElem.firstChild.tagName === "SPAN")
        resultContElem.removeChild(resultContElem.firstChild);

      $generate.removeAttr("disabled");
    };
    worker.onerror = function (err) {
      alert(err);
    };

    var paletteSize = 255;
    var delayTime = 100;
    worker.postMessage({
      imageDataList: imageDataList,
      imageSize: IMG_SIZE,
      paletteSize: paletteSize,
      delayTimeInMS: delayTime,
    });
  };
  $generate.click(function() {
    if($(this).attr("disabled")) return;
    $(this).attr("disabled", true);
    generateGif();
  });

  var capture = function() {
    if (isCapturing == false) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setTimeout(capture, TIMEOUT);

    if(startFlag) {
      var image = new Image();
      image.src = canvas.toDataURL();
      image.style.width = IMG_WIDTH + "px";
      image.style.height = IMG_HEIGHT + "px";
      images.push(image);
    }
  };
  
  var time = MAX_TIME;
  var timerId;
  var timer = function() {
    if(time <= 0) {
      time = MAX_TIME;
      clearInterval(timerId);
      return;
    }
    time -= 1;
    $timer.text(LIMIT_TIME_TEXT + time);
  };
  var setTimers = function() {
    $timer.text(LIMIT_TIME_TEXT + MAX_TIME);
    setTimeout(function() {
      imageSetStop();
      generateGif();
    },MAX_TIME * 1000);
    timerId = setInterval(timer, 1000);
  };

  var success = function(stream) {
    $video.attr("src", windowURL.createObjectURL(stream));
    cammeraStream = stream;
    isCapturing = true;
    capture();
    $start.removeAttr("disabled");
  };

  var error = function(e) {
    console.log(e);
    alert("失敗");
  };

  $start.click(function() {
    if($(this).attr("disabled")) return;
    $(this).hide();
    $timer.show();

    // images clear
    images = [];
    setTimers();

    startFlag = true;
  });

  navigator.getUserMedia({video: true}, success, error);
});

function getRandomWorkImages(images) {
  var newImages = [images[1]];
  var now = 0;
  var size = images.length;
  var randnum = Math.floor( Math.random() * 100 ) + 30;
  for(var i=0; i < randnum; i++) {
    now = getNextStep(now, size);
    if(images[now] == undefined) continue;
    newImages.push(images[now]);
  }

  return newImages;
};

function getNextStep(now, size) {
  var nextStep = 0;
  if(now <= 1) {
    nextStep = now + 1;
  }else if (now >= size) {
    nextStep = now - 1;
  }else {
    var randnum = Math.floor( Math.random() * 10 );
    if(randnum < 7) {
      nextStep = now + 1;
    }else {
      nextStep = now - 1;
    }
  }

  return nextStep;
};
