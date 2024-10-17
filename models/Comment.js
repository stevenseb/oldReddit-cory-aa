const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'users',
			required: true,
		},
		postId: {
			type: Schema.Types.ObjectId,
			ref: 'posts',
			required: true,
		},
		parentCommentId: {
			type: Schema.Types.ObjectId,
			ref: 'comments',
		},
		body: {
			type: String,
			required: [true, 'A body is required'],
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
	{timestamps: true}
);

CommentSchema.methods.calculateRankingScore = function() {
    const G = 1.8; // The decay factor (adjust as needed)

    // Get the number of hours since the post was created
    const now = new Date();
    const postAgeInMilliseconds = now - this.createdAt;
    const postAgeInHours = postAgeInMilliseconds / (1000 * 60 * 60); // Convert ms to hours
    // Calculate the rankingScore using the netUpvotes
    const rankingScore = this.netUpvotes / Math.pow((postAgeInHours + 2), G);

    this.rankingScore = rankingScore;
};

module.exports = Comment = mongoose.model('comments', CommentSchema);
