const mongoose = require('mongoose');
const Joi = require('joi');

// Define the Drushim schema
const drushimSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  location: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create the Drushim model
const DrushimModel = mongoose.model('Drushim', drushimSchema);

// Validation function for Drushim
const validateDrushim = (reqBody) => {
  const joiSchema = Joi.object({
    title: Joi.string().min(2).max(400).required(),
    description: Joi.string().min(5).max(1000).required(),
    requirements: Joi.string().min(5).max(1000).required(),
    location: Joi.string().min(2).max(400).required()
  });
  return joiSchema.validate(reqBody);
};

module.exports = { DrushimModel, validateDrushim };
