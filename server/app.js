const fs = require('fs');
const path = require('path');
const https = require('https'); // for serving SSL/HTTPS (placeholder until replaced by nginx)
const helmet = require('helmet'); // for application security
const logger = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const passport = require('passport'); // for authentication
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');
const recipeRouter = require('./routes/router.recipe');
const userRouter = require('./routes/router.user');

require('dotenv').config();
require('./models/User');
require('./services/passport');

const config = {
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,
  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const PORT = 9000 || process.env.PORT;
const app = express();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.hoifr.mongodb.net/recipes?retryWrites=true&w=majority`;
mongoose.connect(uri, {
  useNewUrlParser: true,
  connectTimeoutMS: 5000,
  useUnifiedTopology: true,
});

app.use(helmet());
app.use(
  cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
  })
);
app.use(passport.initialize());
app.use(passport.session());

require('./routes/router.auth')(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// TODO: this part is to be delete and connect to react front-end
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
  res.render('index');
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/recipes', recipeRouter);
app.use('/user', userRouter);

module.exports = app;

// Self-signed OpenSSL digitial certification for SSL/TLS/https connections
// Note that this will be replaced with app.listen(), and SSL/TLS will be handled by Nginx
// once the application is fully deployed on the Google Cloud VM
https
  .createServer(
    {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    },
    app
  )
  .listen(PORT, () => {
    console.log(`[Server]: Listening on port: ${PORT}`);
  });