const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'users',
			required: true,
		},
		title: {
			type: String,
			required: [true, 'Title is required'],
		},
		url: {
			type: String,
		},
		body: {
			type: String,
		},
		rankingScore: {
			type: Number,
			default: 0,
		},
		netUpvotes: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

// Instance method to calculate the rankingScore with an incoming vote
PostSchema.methods.calculateRankingScore = function() {
    const G = 1.8; // The decay factor (adjust as needed)

    // Get the number of hours since the post was created
    const now = new Date();
    const postAgeInMilliseconds = now - this.createdAt;
    const postAgeInHours = postAgeInMilliseconds / (1000 * 60 * 60); // Convert ms to hours
    // Calculate the rankingScore using the netUpvotes
    const rankingScore = this.netUpvotes / Math.pow((postAgeInHours + 2), G);

    this.rankingScore = rankingScore;
};


module.exports = Post = mongoose.model('posts', PostSchema);
