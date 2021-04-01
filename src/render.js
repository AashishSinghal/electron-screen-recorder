// Basic Setup and Imports.
const { desktopCapturer, remote } = require("electron");
const { Menu } = remote;
let mediaRecorder; // MediaRecorder instance to capture the footage
const recordedChunks = [];
const { dialog } = remote;
const { writeFile } = require("fs");

// Buttons
const videoElement = document.querySelector("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const videoSelectBtn = document.getElementById("videoSelectBtn");
videoSelectBtn.onclick = getVideoSources;

// Start Button Function
startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};

// Stop Button Function
stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    })
  );

  videoOptionsMenu.popup();
}

// Change the videoSource window to record

async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  //Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.onloadedmetadata = (e) => videoElement.play();
  // or
  // videoElemnt.play()

  // Create the Media Recorder
  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  // register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvaialable;
  mediaRecorder.onstop = handleStop;
}

//Capture all Recorded Chunks
function handleDataAvaialable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
}

//Save the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `vid-${Date.now()}.webm`,
  });
  console.log(filePath);

  writeFile(filePath, buffer, () => console.log("Video Saved Successfully !"));
}
