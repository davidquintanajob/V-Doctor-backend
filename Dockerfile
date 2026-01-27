FROM node:22-bullseye

WORKDIR /app

COPY . .

RUN yarn install

EXPOSE 4000

CMD [ "node", "app.js" ]