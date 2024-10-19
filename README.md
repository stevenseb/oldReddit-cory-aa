# MERN Stack Reddit-Style Application

A full-stack web application built with the MERN stack (MongoDB, Express, React, and Node.js) that mimics key features of Reddit. This project focuses on efficient data fetching, scalability, performance optimizations, and up-to-date security practices.

## Table of Contents

- [Features](#features)
- [Highlights](#highlights)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Pagination & Filtering](#pagination--filtering)
- [Performance Optimizations](#performance-optimizations)
- [Security](#security)
- [Screenshots](#screenshots)
- [Future Plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Auth**: Users can authenticate using JWTs
- **Subreddits**: Users can view and create subreddits
- **Posts**: Users can post to specific subreddits
- **Commentes**: Users can comment on posts and comments
- **Voting**: Users can upvote and downvote posts and comments
- **Hot, New, Top**: Filters allowing users to sort posts and comments

## Highlights

- **Efficient Data Fetching**: Uses `Promise.all` to handle multiple asynchronous queries, ensuring rapid data retrieval for posts and comments.
- **Post Ranking**: Implements a sophisticated ranking algorithm with precomputed `rankingScore` and `netUpvotes` for "Hot," "New," and "Top" post/comment filters.
- **Pagination**:
  - Posts and comments are paginated to enhance user experience and decrease load times.
  - A reusable `PaginatedList` component on the frontend handles paginated views for different data entities (posts, comments, etc.).
- **Recursive Comment Fetching**: Recursively fetches nested comments and replies on the server side, providing deep-threaded conversations.
- **Filtering**: Supports dynamic filtering of posts and comments with different criteria like "Hot," "New," and "Top."
- **Performance Enhancements**: Memoization through React's `useCallback` and `useMemo`, combined with Reselect's `createSelector` to reduce unnecessary re-renders and improve efficiency.
- **Lazy Loading**: Uses React’s `Lazy` and `Suspense` for component lazy loading, optimizing initial load time.
- **Version Upgrades & Security Fixes**: Migrated to the latest software versions with continuous vulnerability fixes.

## Usage

The application supports basic Reddit-like functionality, such as:

- Creating, viewing, and voting on posts & comments.
- Threaded commenting with replies.
- Paginated listing of posts and comments with filters and ranking alogorithm.

## API Endpoints

| Method | Endpoint                    | Description                                       |
| ------ | --------------------------- | ------------------------------------------------- |
| GET    | `/api/posts`                | Fetch all posts (supports pagination & filtering) |
| POST   | `/api/posts`                | Creates a new post                                |
| GET    | `/api/comments`             | Fetch top-level comments with pagination          |
| POST   | `/api/comments`             | Creates a new comments                            |
| GET    | `/api/comments/:id/replies` | Fetch replies to a specific comment               |
| POST   | `/api/votes`                | Creates a vote on a comment or post               |

## Pagination & Filtering

The app supports several filtering and pagination features to optimize both performance and user experience:

- **Posts**:
  - Posts can be filtered by `Hot`, `New`, and `Top` categories.
  - Pagination is achieved with a combination of precomputed scores and MongoDB query strategies (e.g., `.sort()`, `.limit()`).
- **Comments**:
  - Recursive comment fetching allows for replies to be nested under top-level comments.
  - Comments are paginated and filterable, allowing a limited number of replies to load at once, with the option to load more.

### Example Query for Filtering Posts:

```javascript
let query = { subRedditId, parentCommentId: null };
if (view === 'Top') {
	query.$or = [
		{ netUpvotes: { $lt: netUpvotes } },
		{ netUpvotes, createdAt: { $lt: new Date(createdAt) } },
	];
}
```

## Performance Optimizations

Several key optimizations have been incorporated into the application:

- **Memoization**:
  - `useCallback` and `useMemo` are used to avoid unnecessary re-rendering of components.
  - `createSelector` from Reselect is used to memoize `useSelector` hooks in React.
- **Efficient Queries**:

  - The `Promise.all` method is used to efficiently fetch data from multiple sources at once, reducing load times.
  - Mongoose's `.lean()` method is used to return lightweight plain JavaScript objects from MongoDB, reducing overhead.

- **Lazy Loading**:
  - Lazy loads non-essential components with `React.lazy()` and `Suspense` to improve the initial page load time.

## Future Plans

- Refactor for deployment on AWS Lambda
- Swap out MongoDB for DynamoDB
- Setup load balancing
- Caching
- S3 Image Uploads
- CDN
- Filter for time on TOP view
- User profile with vote history
- Add more robust validations
- Frontend overhaul

## Spotted a bug?

If you find a bug, please open an issue [here](https://github.com/ckane30691/oldReddit/issues)

## License

This project is licensed under the MIT License.
