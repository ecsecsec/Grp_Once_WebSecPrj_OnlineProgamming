const mongoose = require('mongoose');

const TestcaseSchema = new mongoose.Schema({
    input: { type: String},
    expectedOutput: { type: String, required: true },
});

const ProblemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String },
    detail: { type: String },
    solvedBy: {type: Number, default: 0},
    creatorId: {type: String, required: true},
    testcases: [TestcaseSchema],
});

module.exports = mongoose.model('Problem', ProblemSchema);
