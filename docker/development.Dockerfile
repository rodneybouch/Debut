FROM node:argon

MAINTAINER Guido Vilariño <guido@democracyos.org>

RUN npm config set python python2.7

COPY ["package.json", "/usr/src/"]

WORKDIR /usr/src

RUN npm install --quiet --production

RUN npm install --quiet --only=development

COPY [".", "/usr/src/"]

EXPOSE 3000

ENV NODE_PATH=.

CMD ["./node_modules/.bin/gulp", "bws"]
