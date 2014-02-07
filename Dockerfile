FROM ubuntu:12.10
MAINTAINER henteko

RUN sudo apt-get update
RUN sudo apt-get install -y git curl build-essential libssl-dev
RUN sudo apt-get install -y python-software-properties python g++ make software-properties-common
RUN sudo add-apt-repository ppa:chris-lea/node.js

RUN sudo apt-get update
RUN sudo apt-get install -y nodejs

ADD server.js /opt/randomWalkGif/server.js
ADD index.html /opt/randomWalkGif/index.html
ADD js /opt/randomWalkGif/js
ADD img /opt/randomWalkGif/img
ADD css /opt/randomWalkGif/css
WORKDIR /opt/randomWalkGif

RUN npm install express

EXPOSE 8080
CMD ["node", "/opt/randomWalkGif/server.js"]
