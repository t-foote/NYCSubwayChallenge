const express = require('express');
const app = express();

app.use(express.json());

const usersRouter = require('./routes/users');
const attemptsRouter = require('./routes/attempts');
const stopsVisitedRouter = require('./routes/stopsVisited');

app.use('/users', usersRouter);
app.use('/attempts', attemptsRouter);
app.use('/attempts/:attemptId/stops_visited', stopsVisitedRouter);

module.exports = app;
