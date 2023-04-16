#!/usr/bin/env python3
import requests
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor
from argparse import ArgumentParser


# Number of requests to send for each route
NUMBER_OF_REQUESTS = 2000


def main():
    arg_parser = ArgumentParser(prog='UApoly backend benchmark', description='Utility to benckmark the UApoly backend')
    arg_parser.add_argument('host', help='The host to connect to')
    arg_parser.add_argument('port', help='The port to connect to')
    args = arg_parser.parse_args()

    base_url = f'http://{args.host}:{args.port}'

    print(f'Querying {base_url}')

    print('--- /user/register ---')
    tokens, register_latencies = create_users(base_url)
    display_latencies(register_latencies, '/user/register')
    del register_latencies

    print('--- /user/login ---')
    tokens, login_latencies = login_users(base_url)
    display_latencies(login_latencies, '/user/login')
    del login_latencies

    print('--- /user/me ---')
    display_latencies(me(base_url, tokens), '/user/me')

    print('--- /user/search ---')
    display_latencies(search(base_url, tokens['User0']), '/user/search')

    print('--- /game/boards (GET) ---')
    display_latencies(get_boards(base_url), '/game/boards')

    print('--- /game/boards (POST) ---')
    display_latencies(post_boards(base_url), '/game/boards')

    print('--- /game/create (passwordless) ---')
    display_latencies(create_passwordless_game(base_url, tokens), '/game/create (passwordless)')

    print('--- /game/create (with password) ---')
    display_latencies(create_password_game(base_url, tokens), '/game/create (with password)')


def display_latencies(latencies, route):
    """Display the latencies of a route"""

    print(f'Avg latency: {latencies["latency"].mean()}')
    print(f'Max latency: {latencies["latency"].max()}')
    print(f'Min latency: {latencies["latency"].min()}')
    print(f'Latency std: {latencies["latency"].std()}')

    latencies.plot(x='start', y='latency', xlabel='Elapsed time in seconds', ylabel='Latency in milliseconds', title=f'Latency over time ({route})')
    plt.show()


def query(tuple):
    """Query a route"""

    start, base_url, endpoint, method, data, headers = tuple
    url = base_url + endpoint
    response = requests.request(method, url, json=data, headers=headers)
    return ((datetime.now() - start).total_seconds(), response.elapsed, response.json())


def process_response(response, latencies):
    """Process a response"""

    start, elapsed, body = response
    return pd.concat([latencies, pd.DataFrame({'start': [start], 'latency': [elapsed.total_seconds() * 1000]})])


def create_passwordless_game(base_url, tokens):
    """Test the /game/create route (passwordless)"""

    latencies = pd.DataFrame(columns=['start', 'latency'])

    with ProcessPoolExecutor() as executor:
        for response in executor.map(query, [(datetime.now(), base_url, '/game/create', 'POST', {
            "maxPlayers": 4,
            "salary": 200,
            "locale": "en-US",
            "initialMoney": 2500,
            "friendsOnly": False,
        }, {'Authorization': f'Bearer {token}'}) for token in tokens.values()]):
            latencies = process_response(response, latencies)

    return latencies

def create_password_game(base_url, tokens):
    """Test the /game/create route (with password)"""

    latencies = pd.DataFrame(columns=['start', 'latency'])

    with ProcessPoolExecutor() as executor:
        for response in executor.map(query, [(datetime.now(), base_url, '/game/create', 'POST', {
            "maxPlayers": 4,
            "salary": 200,
            "locale": "en-US",
            "initialMoney": 2500,
            "friendsOnly": False,
            "password": "password",
        }, {'Authorization': f'Bearer {token}'}) for token in tokens.values()]):
            latencies = process_response(response, latencies)

    return latencies

def search(base_url, token):
    """Test the /user/search route"""

    latencies = pd.DataFrame(columns=['start', 'latency'])

    base_string = 'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJLMWXCVBN0123456789-_'

    with ProcessPoolExecutor() as executor:
        for response in executor.map(query, [(datetime.now(), base_url, '/user/search', 'POST', [{'login': base_string[int(i/len(base_string))]} for i in range(NUMBER_OF_REQUESTS)], {'Authorization': f'Bearer {token}'}) for _ in range(NUMBER_OF_REQUESTS)]):
            latencies = process_response(response, latencies)

    return latencies


def post_boards(base_url):
    """Test the /game/boards route (POST)"""

    latencies = pd.DataFrame(columns=['start', 'latency'])

    with ProcessPoolExecutor() as executor:
        for response in executor.map(query, [(datetime.now(), base_url, '/game/boards', 'POST', {'locale': 'en-US' if i % 2 == 0 else 'fr-FR'}, {}) for i in range(NUMBER_OF_REQUESTS)]):
            latencies = process_response(response, latencies)

    return latencies


def get_boards(base_url):
    """Test the /game/boards route (GET)"""

    latencies = pd.DataFrame(columns=['start', 'latency'])

    with ProcessPoolExecutor() as executor:
        for response in executor.map(query, [(datetime.now(), base_url, '/game/boards', 'GET', {}, {}) for _ in range(NUMBER_OF_REQUESTS)]):
            latencies = process_response(response, latencies)

    return latencies


def create_users(base_url):
    """Test the /user/register route"""

    users = [{'login': f'User{i}', 'password': f'Password{i}', 'email': f'user{i}@example.org'} for i in range(NUMBER_OF_REQUESTS)]
    tokens = {}
    latencies = pd.DataFrame(columns=['start', 'latency'])

    with ProcessPoolExecutor() as executor:
        for user, response in zip(users, executor.map(query, [(datetime.now(), base_url, '/user/register', 'POST', user, {}) for user in users])):
            start, elapsed, body = response
            tokens[user['login']] = body['token']
            latencies = pd.concat([latencies, pd.DataFrame({'start': [start], 'latency': [elapsed.total_seconds() * 1000]})])

    return (tokens, latencies)


def login_users(base_url):
    """Test the /user/login route"""

    users = [{'login': f'User{i}', 'password': f'Password{i}'} for i in range(NUMBER_OF_REQUESTS)]
    tokens = {}
    latencies = pd.DataFrame(columns=['start', 'latency'])

    with ProcessPoolExecutor() as executor:
        for user, response in zip(users, executor.map(query, [(datetime.now(), base_url, '/user/login', 'POST', user, {}) for user in users])):
            start, elapsed, body = response
            tokens[user['login']] = body['token']
            latencies = pd.concat([latencies, pd.DataFrame({'start': [start], 'latency': [elapsed.total_seconds() * 1000]})])

    return (tokens, latencies)


def me(base_url, tokens):
    """Test the /user/me route"""

    latencies = pd.DataFrame(columns=['start', 'latency'])

    with ProcessPoolExecutor() as executor:
        for response in executor.map(query, [(datetime.now(), base_url, '/user/me', 'GET', {}, {'Authorization': f'Bearer {token}'}) for token in tokens.values()]):
            latencies = process_response(response, latencies)

    return latencies


if __name__ == '__main__':
    main()