// backend/models/problem.js
const mongoose = require('mongoose');

const TestcaseSchema = new mongoose.Schema({
    input: { type: String },
    expectedOutput: { type: String, required: true },
    isSample: {type: Boolean, default: false},
});


const ProblemSchema = new mongoose.Schema({


    id: { type: String, required: true, unique: true }, 
    title: { type: String, required: true },
    type: { type: String }, 
    detail: { type: String }, 
    solvedBy: { type: Number, default: 0 }, 
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true 
    },
    testcases: [TestcaseSchema],
    timeLimit: {type: Number, required: true, default: 1000},
    memoryLimit: {type: Number, required: true, default: 256}
});

module.exports = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);