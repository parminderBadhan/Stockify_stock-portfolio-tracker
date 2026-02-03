const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/AlertController');

router.post('/', AlertController.createAlert);
router.get('/:portfolioId', AlertController.getAlerts);
router.put('/:id/deactivate', AlertController.deactivateAlert);
router.delete('/:id', AlertController.deleteAlert);

module.exports = router;
