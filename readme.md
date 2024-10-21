
# uTube-backend

This is a complex project that implements the backend of a complete video hosting website like youtube with all the features
like  login, signup, upload video, like, dislike, comment, reply, subscribe, unsubscribe, and many more.
It is built using TypeScript, Express, mongodb, mongoose, jwt, multer, cloudinary, and more.
This project uses all the standard practices like token based authentication, middleware, error handling, and more.

## Built With
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
- [Multer](https://www.npmjs.com/package/multer)
- [Cloudinary](https://cloudinary.com/)


## Table of Contents

- [Installation](#installation)
- [API Endpoints](#api-endpoints)

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/ankkitsharma/uTube-backend.git
    cd uTube-backend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up environment variables:
    - Create a `.env` file in the root directory.
    - Use the env.example file to set up the environment variables.

4. Run the development server:

    ```sh
    npm start
    ```

## API Endpoints
- `GET /` - Healthcheck
- `GET /:videoId` - Get video comments
- `POST /:videoId` - Add a comment
- `DELETE /c/:commentId` - Delete a comment
- `PATCH /c/:commentId` - Update a comment
- `POST /register` - Register a user
- `POST /login` - Login a user
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout a user
- `POST /change-password` - Change password
- `GET /current-user` - Get current user
- `PATCH /update-account` - Update account details
- `PATCH /avatar` - Update user avatar
- `PATCH /cover-image` - Update user cover image
- `GET /c/:username` - Get user channel profile
- `GET /history` - Get watch history
- `GET /` - Get all videos
- `POST /` - Publish a video
- `GET /:videoId` - Get a video
- `PATCH /:videoId` - Update a video
- `DELETE /:videoId` - Delete a video
- `PATCH /toggle/publish/:videoId` - Toggle publish status

