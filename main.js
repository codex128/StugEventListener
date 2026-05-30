
console.log("hello from event listener!");

const OUTGOING = 'STUG_OUTGOING_TRAFFIC';
const INCOMING = 'STUG_INCOMING_TRAFFIC';

function injectScript(content) {
    console.log("injecting script: " + content);
    const script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("name", "eventListener");
    script.textContent = content;
    document.documentElement.appendChild(script);
}

function eventCapture() {
    // Save a copy of the browser's true, untouched WebSocket constructor
  const OriginalWebSocket = window.WebSocket;

  // Re-define WebSocket with our custom wrapper wrapper
  window.WebSocket = function(url, protocols) {
    // Instantiate the real WebSocket connection
    const socket = new OriginalWebSocket(url, protocols);

    // 1. Hook Outgoing Data (Client -> Server)
    const originalSend = socket.send;
    socket.send = function(data) {
      // Broadcast outgoing game inputs/actions to the extension
      window.postMessage({
        type: "STUG_OUTGOING_TRAFFIC",
        payload: data instanceof ArrayBuffer ? new Uint8Array(data) : data
      }, '*');

      return originalSend.apply(this, arguments);
    };

    // 2. Hook Incoming Data (Server -> Client)
    socket.addEventListener('message', (event) => {
      // Broadcast incoming game states/events to the extension
      window.postMessage({
        type: "STUG_INCOMING_TRAFFIC",
        payload: event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data
      }, '*');
    });

    return socket;
  };

  // Ensure the native properties remain intact for game compatibility
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  console.log("WebSocket engine hooked successfully!");
}

console.log("hello from event listener!");

// inject event listener to receive events
injectScript(`(${eventCapture.toString()})();`);

const actions = {
    "out_fire": function() {
        console.log("FIRE!!!");
    },
    "etc...": function() {
        
    }
};

window.addEventListener('message', (event) => {
    console.log("intercepted event: " + event.data.type);
    // Validate origin and type to prevent interception of malicious messages
    if (event.data.type !== OUTGOING && event.data.type !== INCOMING) {
        return;
    }
    console.log("intercepted " + event.data.type + ": " + event.data.payload + " (" + event.data.payload[1] + ")");
    var payload = event.data.payload.toString();
    var i = payload.indexOf("\"");
    payload = payload.substring(i + 1, payload.indexOf("\"", i + 1));
    console.log("payload is " + payload);
    var id;
    if (event.data.type === OUTGOING) {
        id = "out_" + payload;
    } else {
        id = "in_" + payload;
    }
    var a = actions[id];
    if (a) a(event.data.payload);
});
