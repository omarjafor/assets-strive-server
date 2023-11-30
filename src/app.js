const express = require("express");
const applyMiddleware = require("./middlewares");
const ErrorHandler = require("./utils/globalErrorHandler");
const connectDB = require("./db/connectDB");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const authRoutes = require('./routes/v1/authentication');
const serviceRoutes = require('./routes/v1/services');

applyMiddleware(app);

app.use(authRoutes)
app.use(serviceRoutes)
app.get("/health", (req, res) => {
    res.send("Assets Server is running....");
});

app.all("*", (req, res, next) => {
    const error = new Error(`Can't find ${req.originalUrl} on the server`);
    error.status = 404;
    next(error);
});

app.use(ErrorHandler);

const main = async () => {
    await connectDB()
    app.listen(port, () => {
        console.log(`Assets server is running on port ${port}`);
    });

}

main()