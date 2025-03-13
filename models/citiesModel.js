const mongoose = require('mongoose');
const Joi = require('joi');

// Define the City schema
const citySchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true }
});

// Create the City model
const CitiesModel = mongoose.model('City', citySchema);

// Validation function for City
function validateCity(city) {
    const schema = Joi.object({
      value: Joi.string().min(3).required(), // ודא שהערך לא ריק ושהוא לפחות באורך 3 תווים
      label: Joi.string().min(3).required(),
    });
    return schema.validate(city);
  }

module.exports = { CitiesModel, validateCity };
