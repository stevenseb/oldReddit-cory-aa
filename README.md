# MERN Stack Reddit-Style Application

A full-stack web application built with the MERN stack (MongoDB, Express, React, and Node.js) that mimics key features of Reddit. This project focuses on efficient data fetching, scalability, performance optimizations, and up-to-date security practices.

## Table of Contents

- [Features](#features)
- [Highlights](#highlights)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Pagination & Filtering](#pagination--filtering)
- [Performance Optimizations](#performance-optimizations)
- [Technologies](#technologies)
- [Security](#security)
- [Screenshots](#screenshots)
- [Future Plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Auth**: Users can authenticate using JWTs
- **Subreddits**: Users can view and create subreddits
- **Posts**: Users can post to specific subreddits
- **Comments**: Users can comment on posts and other comments
- **Voting**: Users can upvote and downvote posts and comments
- **Hot, New, Top**: Filters allowing users to sort posts and comments

## Highlights

- **Efficient Data Fetching**: Uses `Promise.all` to handle multiple asynchronous queries, ensuring rapid data retrieval for posts and comments.
- **Post Ranking**: Implements a sophisticated ranking algorithm with precomputed `rankingScore` and `netUpvotes` for "Hot," "New," and "Top" post/comment filters.
- **Database Throughput**: The application is designed to handle heavy read/write loads with 50M DAU (Daily Active Users), 330M MAU (Monthly Active Users), and supports the following throughput:
  - **8,000 Transactions per Second (TPS)** for reads (screen views)
  - **5,500 TPS** for page views
  - **1,000 TPS** for upvotes
  - **10 TPS** for post creation
  - A MongoDB sharding strategy is employed to distribute data across clusters (Posts/Subreddits, Votes, Comments, Users), ensuring scalability and fault tolerance.
- **Caching with Redis**: Implemented Redis for caching frequently accessed data (e.g., hot posts and comments) to further reduce load times and optimize performance.
- **Pagination**:
  - Posts and comments are paginated to enhance user experience and decrease load times.
  - A reusable `PaginatedList` component on the frontend handles paginated views for different data entities (posts, comments, etc.).
- **Recursive Comment Fetching**: Recursively fetches nested comments and replies on the server side, providing deep-threaded conversations.
- **Filtering**: Supports dynamic filtering of posts and comments with different criteria like "Hot," "New," and "Top."
- **Performance Enhancements**: Memoization through React's `useCallback` and `useMemo`, combined with Reselect's `createSelector` to reduce unnecessary re-renders and improve efficiency.
- **Lazy Loading**: Uses React’s `Lazy` and `Suspense` for component lazy loading, optimizing initial load time.
- **Version Upgrades & Security Fixes**: Migrated to the latest software versions with continuous vulnerability fixes.

## Technologies

- **MongoDB**: Used for database management with a sharding strategy to optimize scalability across posts, comments, votes, and users.
- **Express**: Server framework for handling API requests and routing.
- **React**: Frontend library for building interactive user interfaces.
- **Node.js**: Backend runtime for executing JavaScript on the server.
- **Redis**: Implemented as a caching layer to store frequently accessed data and reduce response times for read-heavy operations.
- **Mongoose**: ORM for MongoDB, used for schema definitions and efficient query handling.
- **JWT (JSON Web Tokens)**: Used for secure authentication of users.

## Usage

The application supports basic Reddit-like functionality, such as:

- Creating, viewing, and voting on posts & comments.
- Threaded commenting with replies.
- Paginated listing of posts and comments with filters and ranking algorithm.
