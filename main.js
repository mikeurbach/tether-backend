var connection = new WebSocket('ws://localhost:420');
connection.onopen = function(event) {connection.send('connected');}
connection.onmessage = function(event) {
    document.getElementById('chat').innerText += "> " + event.data;
    console.log(event.data);
}

function send(message) {
    connection.send(message); 
    console.log('sent: ' + message);
}
