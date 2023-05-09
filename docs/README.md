# Documentation
This folder contains the documentation for the UApoly backend. The documentation is split into two parts:
- This [`README`](./README.md) file, with general information about the backend and the Socket.IO API documentation.
- The [`uapoly-openapi.yaml`](./uapoly-openapi.yaml) file, with the OpenAPI specification for the REST API. You can learn more below.
## Live game API
The part of the backend handling a live game is powered by [Socket.IO](https://socket.io/). Thus, you will need a Socket.IO client to interact with the API. Please check the [Socket.IO documentation](https://socket.io/docs/v4/) for more information.

### Client events
The client can emit the following events:
- `join`: Listen for event in a game. This will not add the player from the list of participating players (see the `/game/join` REST endpoint for that). The client must send the following data:
  - An integer representing the game ID. This is the same as the game ID in the REST API.
- `leave`: Stop listening for events in a game. This will not remove the player from the list of participating players (see the `/game/leave` REST endpoint for that). The client must send the following data:
  - An integer representing the game ID. This is the same as the game ID in the REST API.
- `start`: Start a game. Only the game master can use this. The client must send the following data:
  - An integer representing the game ID. This is the same as the game ID in the REST API.
- `update`: Request to get the latest game state. The client must send the following data:
  - An integer representing the game ID. This is the same as the game ID in the REST API.
- `declareBankruptcy`: Declare bankruptcy. The client must send the following data:
  - An integer representing the game ID. This is the same as the game ID in the REST API.
- `nextPlayer`: End the current player's turn. The client must send the following data:
  - An integer representing the game ID. This is the same as the game ID in the REST API.
- `manageProperties`: Manage the current player's properties. The client must send the following data:
  - An integer representing the game ID. This is the same as the game ID in the REST API.
  - An array of `PropertyEdit`.

### Server events
The server can emit the following events:
- `recovered`: The connection has been recovered between the client and the server.
- `player-connected`: A new player joined the game. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
- `player-disconnected`: A player left the game. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
- `joined`: The client has successfully joined the game. The data sent by the server will be a JSON `Game` object.
- `left`: The client has successfully left the game. The server will send the following data:
  - An integer representing the game ID. This is the same as the game ID in the REST API.
- `update`: An updated state of the game has been sent by the server. The data sent by the server will be a JSON `Game` object.
- `game-over`: The game is over. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `winner`: A string representing the winner's name. Can be `null` if the game ended early.
- `tryEscapeJail`: A player is currently in jail and should act to try to escape. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
- `diceRoll`: A player rolled the dice. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
  - `dices`: An array containing the dices values.
- `bankrupt`: A player went bankrupt. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
  - `quitted`: A boolean representing whether the bankruptcy was caused by the player quitting the game.
- `startOfTurn`: A player's turn has started. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
- `endOfTurn`: A player's turn has ended. The client should emit one of the following events to proceed : `trade`, `manageProperties`, `declareBankruptcy`, `nextPlayer`. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
- `cardDrawn`: A player drew a card. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
  - `description`: The description of the card.
- `propertyBought`: A player bought a property. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
  - `slotIndex`: An integer representing the slot index of the property.
  - `price`: An integer representing the price of the property.
- `playerInDebt`: A player is in debt. The client should emit one of the following events to proceed : `manageProperties`, `declareBankruptcy`, `trade`. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `accountLogin`: A string representing the player name.
  - `amount`: An integer representing the debt.
- `paymentSucceeded`: A player successfully paid a debt. The data sent by the server will be a JSON object with the following properties:
  - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `sender`: A string representing the sender's name.
  - `receiver`: A string representing the receiver's name.  Can be `bank` or `jackpot` if the payment was made to the bank or the jackpot.
  - `amount`: An integer representing the amount of the payment.

### Schemas
The following schemas are used by the Socket.IO API:
- `Game`:
  - `id`: The current game ID. This is the same as the game ID in the REST API.
  - `players`: An array containing the players in the game. Composed of:
    - `accountLogin`: A string representing the player name.
    - `isGameMaster`: A boolean representing whether the player is the game master.
    - `money`: An integer representing the player's money.
    - `iconStyle`: An integer representing the player's icon style.
    - `outOfJailCards`: An integer representing the number of out of jail cards the player has.
    - `currentSlotIndex`: An integer representing the player's current slot index.
    - `inJail`: A boolean representing whether the player is in jail.
    - `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
  - `friendsOnly`: A boolean representing whether the game is for friends only.
  - `jackpot`: The current amount of money in the jackpot.
  - `maxPlayers`: The maximum number of players in the game.
  - `messages`: TODO
  - `slots`: An array containing the slots in the game. See the `BoardSlot` schema in the OpenAPI specification for more information.
  - `started`: A boolean representing whether the game has started.
  - `startingSlotIndex`: An integer representing the starting slot index.
  - `initialMoney`: An integer representing the initial money.
  - `name`: The game's name.
- `PropertyEdit`:
  - `position`: An integer representing the slot index of the property.
  - `newState`: The new state of the property. Can be `MORTGAGED` or `OWNED`.
  - `newNumberOfBuildings`: An integer representing the new number of buildings on the property. Should be between 0 and 5 (hotel).

### Errors
In case of an error, the server will emit the `error` event. The client must listen for this event. The data sent by the server will be a JSON object with the following properties:
- `gameId`: An integer representing the game ID. This is the same as the game ID in the REST API.
- `message`: A string representing the error message.

## REST API (OpenAPI)
### Edit the specification
This folder contains the OpenAPI specification for UApoly in the [`uapoly-openapi.yaml`](./uapoly-openapi.yaml) file. The specification is written in YAML and can be edited using any OpenAPI editor.

### View the documentation
The specification can be viewed in a human-readable format by starting the backend and then navigating to the `/docs` endpoint. For example, if the backend is running on `http://localhost:3000`, then the documentation can be viewed at `http://localhost:3000/docs`.

The viewer is powered by [Elements](https://stoplight.io/open-source/elements).