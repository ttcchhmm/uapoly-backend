#!/usr/bin/env bash

PSQL_CMD='psql -h 127.0.0.1 -U uapoly -d uapoly'

echo 'You are about to reset the database. Are you sure? (y/n)'
read -r answer
if [[ $answer == 'y' ]]; then
    echo 'Resetting database...'
    $PSQL_CMD -f ./sql/ResetDatabase.sql

    echo 'Running migrations...'
    npm run typeorm migration:run

    echo 'Adding default data...'
    $PSQL_CMD -f ./sql/AddDefaults.sql

    echo 'Database reset.'
else
    echo 'Database reset aborted.'
fi