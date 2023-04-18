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

# If it's the first time you start the application
./ResetDatabase.sh

npm start
```

## Database
### Run migrations
To run the migrations, run the following command :
```bash
npm run typeorm migration:run
```

### Reset the development database
To reset the development database, run the script [`ResetDatabase.sh`](./ResetDatabase.sh) located at the root of the project.

## Documentation
Documentation about both the REST and Socket.IO APIs can be found in the [`docs`](./docs) folder. Check out the [API documentation](./docs/README.md) for more information.

## Stress, load and performance stressing
You can use the [`./benchmark/Benchmark.py`](./benchmark/Benchmark.py) Python script to stress the application.

### Dependencies
To run the script, you will need to install the following dependencies :
- Python 3
- Requests
- Pandas
- Matplotlib

On Arch Linux, you can use the following command to install them :
```bash
sudo pacman -S python-requests python-pandas python-matplotlib
```

> **Note:** If you don't have a backend for Matplotlib, you can use the following command to install one :
> ```bash
> sudo pacman -S --asdeps python-pyqt5
> ```

### Usage
To use the script, run the following command :
```
python ./benchmark/Benchmark.py <host> <port>
```