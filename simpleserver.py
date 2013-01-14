#!/usr/local/bin/python
"USAGE: simpleserver.py <port>"
from socket import *
import sys, sha, cgi

BUFFER = 1024
MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

def handshake(sock):
    data = sock.recv(BUFFER).splitlines()
    for header in data:
        if "Sec-WebSocket-Key" in header:
            keyheader = header.partition(':')
            key = keyheader[2].strip() # get key
            sha1 = sha.new(key.strip('\r\n') + MAGIC_STRING) # concat magic and hash
            accept = sha1.digest().encode('base64') # base64 encode
            response = """HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: """ + accept + "\r\n"
            sock.send(response)
    #print "handshake completed"

def handleClient(sock):
    handshake(sock)
    data = sock.recv(BUFFER)
    while data:
        sock.sendall(data)
        #print "echoing:", data
        data = sock.recv(BUFFER)
    sock.close()

sockets = []
if len(sys.argv) != 2:
   print __doc__
else:
#def main():
    sock = socket(AF_INET, SOCK_STREAM)
    sock.bind(('',int(sys.argv[1])))
    #sock.bind(('',420))
    sock.listen(10)
    while 1:
        newsock, client_addr = sock.accept()
        sockets.append(newsock)
        #print "Client connected:", client_addr 
        for socket in sockets:
            handleClient(socket)

#main()
