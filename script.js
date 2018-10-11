const fromStream = document.getElementById('fromStream');
const fromRecorder = document.getElementById('fromRecorder');

navigator.mediaDevices.getUserMedia({audio: true, video: true})
  .then(mediaStream => {
    fromStream.srcObject = mediaStream;
    fromStream.play();
    fromRecorder.play();

    // send data through mediaRecorder and back into stream using mediaSource
    onMediaStream(mediaStream);
  });

function onMediaStream(mediaStream) {
  // const supportedType = getSupportedTypes()[0]; // TODO handle no supported types
  const supportedType = 'video/webm; codecs="vp8"'; // https://stackoverflow.com/questions/24102075/mediasource-error-this-sourcebuffer-has-been-removed-from-the-parent-media-sour
  const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: supportedType }); 
  // http://html5-demos.appspot.com/static/media-source.html
  const mediaSource = new MediaSource();
  fromRecorder.src = URL.createObjectURL(mediaSource);
  // wait for mediaSource to be ready
  mediaSource.onsourceopen = () => {
    const sourceBuffer = mediaSource.addSourceBuffer(supportedType);

    mediaRecorder.ondataavailable = (event) => {
      const {data} = event;
      // convert blob to array, http://qnimate.com/an-introduction-to-javascript-blobs-and-file-interface/
      const reader = new FileReader();
      reader.addEventListener("loadend", event => {
        // write to the mediaSource buffer
        sourceBuffer.appendBuffer(event.srcElement.result);
      });
      reader.readAsArrayBuffer(data);
    }
  
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/ondataavailable
    const chunkDuration = 1000;
    mediaRecorder.start(chunkDuration);
  };

  mediaSource.onsourceclose = event => {
    console.log("sourceclose", event);
  };

  mediaSource.onsourceended = event => {
    console.log("sourceended", event);
  }


}

//https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported
function getSupportedTypes() {
  const types = ["video/webm", 
             "audio/webm", 
             "video/webm\;codecs=vp8", 
             "video/webm\;codecs=daala", 
             "video/webm\;codecs=h264", 
             "audio/webm\;codecs=opus", 
             "video/mpeg"];

  // find types supported by both mediaRecorder and mediaSource
  const mrSupport = types.filter(MediaRecorder.isTypeSupported);
  return types.filter(type => {
    return MediaSource.isTypeSupported(type) && mrSupport.includes(type);
  });

}