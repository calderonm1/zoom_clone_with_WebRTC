const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
const userInput = document.getElementById('userInput');
const chatroom = document.getElementById('chatroom');
let myId;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
    chatroom.innerHTML += `<p><strong>User ${userId} connected.</strong></p>`;
    chatroom.scrollTop = chatroom.scrollHeight;
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  myId = id;
  socket.emit('join-room', ROOM_ID, id)
  console.log(myId);
})

// Event listener for userInput
userInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    const message = userInput.value.trim();
    if (message !== '') {
      // Send the message along with the user ID to other users
      socket.emit('msg', { message, userId: myId });
      chatroom.innerHTML += `<p><strong>(Me):</strong> ${message}</p>`;
      userInput.value = '';
    }
  }
});

// Event listener for receiving messages from other users
socket.on('msg', ({ message, userId }) => {
  console.log(message);
  // Only display the message if it's from a different user
  if (userId !== myId) {
    chatroom.innerHTML += `<p><strong>User ${userId}:</strong> ${message}</p>`;
    chatroom.scrollTop = chatroom.scrollHeight;
  }
});



function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}