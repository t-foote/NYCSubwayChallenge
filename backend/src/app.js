const express = require('express');
const app = express();

app.use(express.json());

const usersRouter = require('./routes/users');
const attemptsRouter = require('./routes/attempts');
const stopsVisitedRouter = require('./routes/stopsVisited');
const stopsRouter = require('./routes/stops');
const routesRouter = require('./routes/routes');
const transfersRouter = require('./routes/transfers');
const journeyRouter = require('./routes/journey');

app.use('/routes', routesRouter);
app.use('/transfers', transfersRouter);
app.use('/users', usersRouter);
app.use('/attempts', attemptsRouter);
app.use('/attempts/current/stops_visited', stopsVisitedRouter);
app.use('/attempts/current/journey', journeyRouter);
app.use('/stops', stopsRouter);

module.exports = app;
