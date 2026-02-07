const notFound = (req, res, next) => {
  res.status(404).json({
    status: "error",
    code: 404,
    message: "Endpoint not found",
    path: req.originalUrl
  });
};

/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
  /* eslint-enable no-unused-vars */
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: err.message || "Internal Server Error"
  });
};

const requestLoggerMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  const start = new Date().getTime();
  res.on('finish', () => {
    const elapsed = new Date().getTime() - start;
    console.info(`${req.method} ${req.originalUrl} ${req.statusCode} ${elapsed}ms`);
  });
  next();
};

module.exports = {
  notFound,
  errorHandler,
  requestLoggerMiddleware
};