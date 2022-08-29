const express = require('express');
const router = require('./routes/router');
const bodyParser = require('body-parser');
const {sequelize} = require('./model');
const HttpError = require('./HttpError');
var cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
app.use(cors());

app.use(router); //Redirecting all routes from app to the "/routes"

app.use((error, req, res, next) => {
  if (error instanceof HttpError) {
    return res.status(error.code).json({
      error: error.message,
    });
  }

  console.error(error); // It should be properly handled for production
});

module.exports = app;