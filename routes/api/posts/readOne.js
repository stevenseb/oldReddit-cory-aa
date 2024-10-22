const mongoose = require('mongoose');
const keys = require('../../../config/keys');
mongoose.connect(keys.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const Post = require('../../../models/Post');

exports.handler = async (event) => {
    const postId = event.pathParameters.id

    try {
        const post = await Post.findById(postId);
        if (post) {
            return {
                statusCode: 200,
                body: JSON.stringify(post)
            }
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify(({ error: "No post found" }))
            }
        }
    } catch (error) {
        console.log(error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Something went wrong' })
        }
    }

}