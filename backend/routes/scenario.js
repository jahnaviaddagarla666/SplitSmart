const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { create, getAll, delete: deleteScenario } = require("../controllers/scenarioController");

router.use(protect);
router.post("/create", create);
router.get("/", getAll);
router.delete("/:id", deleteScenario);

module.exports = router;