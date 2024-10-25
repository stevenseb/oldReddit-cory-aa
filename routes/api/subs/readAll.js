const mongoose = require('mongoose');
const keys = require('../../../config/keys');
mongoose.connect(keys.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const SubReddit = require('../../../models/SubReddit');


exports.handler = async (event) => {
    try {
        const queryParams = event.queryStringParameters;
        const userId = queryParams?.filters;

        let subReddits = !userId
            ? await SubReddit.find()
            : await SubReddit.find({ userId });

        return {
            statusCode: 200,
            body: JSON.stringify(subReddits)
        };
    } catch (err) {

        return {
            statusCode: 404,
            body: JSON.stringify({ noSubRedditsFound: 'No subReddits found' })
        }
    }
}