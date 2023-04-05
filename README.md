# UApoly (backend)
This is the **backend** of UApoly. You can find the frontend [here](https://github.com/Gyrehio/uapoly-frontend).

## Prerequisites
To run this application, you will need :
- Node.js
- Docker
- Docker Compose

## Configuration
To configure the application, you will need to create a `.env` file at the root of the project. You can use the `.env.example` file as a template.

## Start the application
To start the application, run the following commands :
```bash
npm i
docker-compose up -d
npm start
```

## Documentation
The OpenAPI specification for UApoly can be found in the `docs` folder. A web viewer is available at the `/docs` endpoint.