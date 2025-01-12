FROM node:22.12.0

WORKDIR /

COPY package.json /

RUN npm install --production

COPY . /

CMD ["node", "--no-warnings", "index.js", "start"]