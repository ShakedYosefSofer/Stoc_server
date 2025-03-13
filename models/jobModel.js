const mongoose = require('mongoose');
const Joi = require('joi');

// Define the Job schema
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    requirements: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Create the Job model
const JobModel = mongoose.model('Job', jobSchema);

// Validation function for Job
const validateJob = (reqBody) => {
  const joiSchema = Joi.object({
    title: Joi.string().min(2).max(400).required(),
    description: Joi.string().min(5).max(1000).required(),
    requirements: Joi.string().min(10).max(1000).required(),
    location: Joi.string().min(2).max(400).required(),
  });
  return joiSchema.validate(reqBody);
};

module.exports = { JobModel, validateJob };
