const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const availabilityRoutes = require('./routes/availability.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const feegowRoutes = require('./routes/feegow.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/appointment', appointmentRoutes);
app.use('/feegow', feegowRoutes);

app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/health', healthRoutes);
app.use('/availability', availabilityRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Rota não encontrada.'
  });
});

app.use((error, req, res, next) => {
  console.error('Erro interno:', error);

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor.'
  });
});

module.exports = app;