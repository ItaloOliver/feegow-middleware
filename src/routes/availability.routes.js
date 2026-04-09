const express = require('express');
const { searchAvailability } = require('../controllers/availability.controller');

const router = express.Router();

router.post('/search', searchAvailability);

module.exports = router;