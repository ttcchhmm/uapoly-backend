FROM node:19-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i
COPY . .
RUN mv .env.example .env
EXPOSE 3000
CMD [ "npm", "start" ]