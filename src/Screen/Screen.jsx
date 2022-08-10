import React, { Component } from 'react'
import fixWebmDuration  from "fix-webm-duration"


export default class Screen extends Component {
    start=React.createRef();
    stop=React.createRef();
    
    componentDidMount(){
        console.log(this)
        let start = document.getElementById('start'),
            stop  = document.getElementById('stop'),
            mediaRecorder;
            var startTime;

        start.addEventListener('click', async function(){
            let baseStrem = await recordScreen();
            let extraStream = await recordAudio();
            let mimeType = 'video/webm';
            mediaRecorder = createRecorder(baseStrem,extraStream, mimeType);
            startTime = Date.now();
        let node = document.createElement("p");
            node.textContent = "Started recording";
            document.body.appendChild(node);
        });

        stop.addEventListener('click', function(){
            mediaRecorder.stop();
            let node = document.createElement("p");
            node.textContent = "Stopped recording";
            document.body.appendChild(node);
        })

        async function recordScreen() {
            return await navigator.mediaDevices.getDisplayMedia({
                audio: true, 
                video: { mediaSource: "screen"}
            });
        }
        async function recordAudio() {
            return await navigator.mediaDevices.getUserMedia({
                audio: true, 
                video: false
            });
        }
        function createRecorder (baseStrem,extraStream,mimeType) {
        // the stream data is stored in this array
        let recordedChunks = []; 
        const mergeTracks = (baseStrem, extraStream) => {
            if (!baseStrem.getAudioTracks().length){
                baseStrem.addTrack(extraStream.getAudioTracks()[0])
                return baseStrem;
            }
            var context = new AudioContext();
            var baseSource = context.createMediaStreamSource(baseStrem);
            var extraSource = context.createMediaStreamSource(extraStream);
            var dest = context.createMediaStreamDestination();
        
            var baseGain = context.createGain();
            var extraGain = context.createGain();
            baseGain.gain.value = 0.8;
            extraGain.gain.value = 0.8;
        
            baseSource.connect(baseGain).connect(dest);
            extraSource.connect(extraGain).connect(dest);
        
            return new MediaStream([baseStrem.getVideoTracks()[0], dest.stream.getAudioTracks()[0]]);
        }
        const stream = mergeTracks(baseStrem,extraStream);
        const mediaRecorder = new MediaRecorder(stream
            // audioBitsPerSecond: 128000,
            // videoBitsPerSecond: 2500000,
            // mimeType: "video/webm;codecs=vp8,opus"
        );

        mediaRecorder.ondataavailable = function (e) {
            if (e.data.size > 0) {
            recordedChunks.push(e.data);
            }  
        };
        mediaRecorder.onstop = function () {
            saveFile(recordedChunks);
            recordedChunks = [];
        };
        mediaRecorder.start(200); // For every 200ms the stream data will be stored in a separate chunk.
        //startTime = Date.now()
        return mediaRecorder;
        }
        // function displayResult(blob) {
        //     console.log(blob)
        // }
        function saveFile(recordedChunks){
            var duration = Date.now() - startTime;
            const buggyBlob  = new Blob(recordedChunks, {
               type: 'video/webm'
            });
             fixWebmDuration(buggyBlob, duration, function(fixedBlob) {
                displayResult(fixedBlob);
             });
        }
        function displayResult(blob){
            let filename = window.prompt('Enter file name'),
                downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            let now=new Date(+new Date()+8*3600*1000).toISOString().replace(/T/g,' ').replace(/\.[\d]{3}Z/,''); 
            downloadLink.download = `${filename}_${now}.webm`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            URL.revokeObjectURL(blob); // clear from memory
            document.body.removeChild(downloadLink);
        }
    }
  render() {
    return (
      <div>
          <button id="start" ref={this.start}>start</button>
          <button id="stop" ref={this.stop}>stop</button>
          <br/>
          <text>Chrome browser open webm is recommended to resolve compatibility issues</text>        
      </div>
    )
  }
}
