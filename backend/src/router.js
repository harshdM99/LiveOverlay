const express = require('express');
const router = express.Router();
const streamRouter = require('./routes/stream');
const userRouter = require('./routes/test');

router.use('/stream', streamRouter);
router.use('/test', userRouter);

module.exports = router;