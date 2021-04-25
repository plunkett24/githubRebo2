import React, {createContext, useState, useRef, useEffect} from 'react';

import {io} from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socket = io('http://localhost:5001');

const ContextProvider =({ children})=>{

const [stream, setStream] = useState (null); //set our  state of stream
const [me, setMe] = useState (''); //set onother stream for me state
const [call, setCall]= useState({});//for every socket we need a stream this is the third one for call user
const [callAccepted, setCallAccepted]= useState(false);
const [callEnded, setCallEnded] = useState(false);
const [name, setName]= useState('');



const myVideo =useRef(); //we want to populate videos
const userVideo =useRef(); //populate other person`s videos
const connectionRef =useRef(); //for peer



useEffect (() => {
navigator.mediaDevices.getUserMedia({ video: true, audio:true}) //permission to use video and phone
.then((currentStream)=>{
     setStream(currentStream); // set current stream
     myVideo.current.srcObject= currentStream;
})
socket.on ('me', (id) => setMe (id));   // listen for a specific action,get if from back end
socket.on('calluser', ({ from, name: callerName, signal }) => {
 setCall({isReceivedCall: true, from, name: callerName, signal })
});

},[]); //empty dependencies array or else it will always run.

                                                                                                                                          

const answerCall= () => {
setCallAccepted(true)

const peer = new Peer ({initiator: false, trickle: false, stream  });  // creating a peer library makind video call available video call
peer.on('signal', (data)=> {
    socket.emit('answercall', {signal: data, to:call.from });  // this was setup on the backend

});    // once we get signal we get the data about that signal
peer.on ('stream', (currentStream)=> {
userVideo.current.srcObject= currentStream; // set other users screen new ref needed, this is stream for other person.

});  // get the current stream

peer.signal(call.signal); // line 30

connectionRef.current = peer;
}

const callUser = (id) => {
    const peer = new Peer ({initiator: true, trickle: false, stream  }); 
    
    peer.on('signal', (data)=> {
        socket.emit('callUser', {userToCall: id, signalData: data, from: me, name });  // this was setup on the backend
    
    });    // once we get signal we get the data about that signal
    peer.on ('stream', (currentStream)=> {
    userVideo.current.srcObject= currentStream; // set other users screen new ref needed, this is stream for other person.
    
    });  // get the current stream
    
    socket.on ('callaccepted', (signal) => {
       setCallAccepted(true);

       peer.signal(signal);

     });
    

     connectionRef.current = peer;

}

const leaveCall =() => {
setCallEnded(true);

connectionRef.current.destroy(); //stop input from user camera and audio

window.location.reload(); //reloads the page

}

return (
<SocketContext.Provider value={{
call,
callAccepted,
myVideo,
userVideo,
stream,
name,
setName,
callEnded,
me,
callUser,
leaveCall,
answerCall,

}}>         

{children}

</SocketContext.Provider>


);
// we want all values created to be accessible to every file in the project

}
export {ContextProvider, SocketContext};