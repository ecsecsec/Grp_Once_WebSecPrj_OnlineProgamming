const mongoose = require('mongoose');

const TestcaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
});

const ProblemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String },
    detail: { type: String },
    image: { type: String },
    testcases: [TestcaseSchema],
});

module.exports = mongoose.model('Problem', ProblemSchema);
