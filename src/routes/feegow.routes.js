const express = require('express');
const {
  testFeegowConnection,
  getProfessionals,
  getUnits,
  getLocals,
  getSpecialties,
  getProcedures,
  getAvailableScheduleTest
} = require('../controllers/feegow.controller');

const router = express.Router();

router.get('/test', testFeegowConnection);
router.get('/professionals', getProfessionals);
router.get('/units', getUnits);
router.get('/locals', getLocals);
router.get('/specialties', getSpecialties);
router.get('/procedures', getProcedures);
router.get('/available-schedule', getAvailableScheduleTest);

module.exports = router;