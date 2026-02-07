require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const middlewares = require('./middlewares/index').middleware;
const api = require('./api');

const app = express();

app.use(morgan('dev'));
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.redirect('/docs');
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs.html'));
});

app.use('/anime/animasu', api);

app.use(middlewares);

module.exports = app;