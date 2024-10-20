const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/keys').mongoURI;
const users = require('./routes/api/users');
const subReddits = require('./routes/api/subReddits.js');
const comments = require('./routes/api/comments');
const posts = require('./routes/api/posts.js');
const votes = require('./routes/api/votes');
const passport = require('passport');
const redisClient = require('./config/redisClient.js')

const port = process.env.PORT || 5000;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());
require('./config/passport')(passport);

mongoose
	.connect(db,{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('Connected to MongoDB succesfully'))
	.catch((err) => console.log(err));

app.use('/api/users', users);
app.use('/api/subReddits', subReddits);
app.use('/api/comments', comments);
app.use('/api/posts', posts);
app.use('/api/votes', votes);

(async () => {
    await redisClient.connect().catch(console.error);
})();

app.listen(port, () => console.log(`Server is running on port ${port}`));
