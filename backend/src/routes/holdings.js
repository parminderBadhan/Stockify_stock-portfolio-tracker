const express = require('express');
const router = express.Router();
const HoldingController = require('../controllers/HoldingController');

router.post('/', HoldingController.addHolding);
router.get('/:portfolioId', HoldingController.getHoldings);
router.put('/:id', HoldingController.updateHolding);
router.delete('/:id', HoldingController.deleteHolding);

module.exports = router;
