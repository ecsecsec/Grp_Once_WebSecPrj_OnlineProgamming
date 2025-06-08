// backend/services/submissionService.js
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Problem = require('../models/problem');
const User = require('../models/user');
const { runInDocker, LANG_CONFIG } = require('../utils/runInDocker');

function normalizeOutput(output) {
    if (typeof output !== 'string') return '';
    return output.split('\n').map(line => line.trimRight()).filter((line, index, arr) => {
        return index < arr.length -1 || line !== '';
    }).join('\n');
}

async function processSubmission(submissionId) {
    console.log(`Processing submission: ${submissionId}`);
    const submission = await Submission.findById(submissionId);
    if (!submission) {
        console.error(`Submission ${submissionId} not found.`);
        return;
    }

    // Sử dụng _id của MongoDB cho problem
    const problem = await Problem.findById(submission.problem_id);
    if (!problem || !problem.testcases || problem.testcases.length === 0) { // Sửa problem.test_cases thành problem.testcases
        await Submission.findByIdAndUpdate(submissionId, {
            status: 'System Error',
            final_stderr: 'Problem data or testcases not found.',
        });
        console.error(`Problem data or testcases not found for submission ${submissionId}.`);
        return;
    }

    await Submission.findByIdAndUpdate(submissionId, { status: 'Running' });

    let finalSubmissionStatusOverall = 'Accepted';
    let finalCompileOutput = '';
    let maxTimeAcrossTestCases = 0;
    let maxMemoryAcrossTestCases = 0; // Cần cách đo tốt hơn
    const allResultDetails = [];

    for (let i = 0; i < problem.testcases.length; i++) { // Sửa problem.test_cases thành problem.testcases
        const tc = problem.testcases[i]; // Sửa testCase thành tc
        console.log(`Running test case ${i} for submission ${submissionId}`);

        const problemConfigForDocker = {
            timeLimit: problem.timeLimit, // Lấy từ Problem model
            memoryLimit: problem.memoryLimit, // Lấy từ Problem model
        };

        const singleRunResult = await runInDocker(
            submission.source_code,
            submission.language,
            tc.input,
            problemConfigForDocker
        );

        // Cập nhật thời gian, bộ nhớ
        if (singleRunResult.time_ms > maxTimeAcrossTestCases) {
            maxTimeAcrossTestCases = singleRunResult.time_ms;
        }
        // (Tương tự cho memory nếu có cách đo)

        const currentResultDetail = {
            test_case_index: i,
            stdout: singleRunResult.stdout,
            stderr: singleRunResult.stderr,
            time_ms: singleRunResult.time_ms,
            memory_kb: singleRunResult.memory_kb, // Giữ chỗ
            status: 'Pending' // Sẽ được cập nhật bên dưới
        };

        // Phân tích kết quả từ singleRunResult.status
        switch (singleRunResult.status) {
            case 'Compilation Error':
                finalSubmissionStatusOverall = 'Compilation Error';
                finalCompileOutput = singleRunResult.stderr;
                currentResultDetail.status = 'Compilation Error';
                break;
            case 'Compilation Timeout': // Thêm từ runInDocker
                finalSubmissionStatusOverall = 'Compilation Error'; // Coi là CE
                finalCompileOutput = singleRunResult.stderr || "Compilation Timed Out";
                currentResultDetail.status = 'Compilation Error';
                break;
            case 'Compilation Memory Limit Exceeded': // Thêm từ runInDocker
                finalSubmissionStatusOverall = 'Compilation Error'; // Coi là CE
                finalCompileOutput = singleRunResult.stderr || "Compilation Exceeded Memory";
                currentResultDetail.status = 'Compilation Error';
                break;
            case 'Time Limit Exceeded':
                finalSubmissionStatusOverall = 'Time Limit Exceeded';
                currentResultDetail.status = 'Time Limit Exceeded';
                break;
            case 'Memory Limit Exceeded':
                finalSubmissionStatusOverall = 'Memory Limit Exceeded';
                currentResultDetail.status = 'Memory Limit Exceeded';
                break;
            case 'Runtime Error':
                finalSubmissionStatusOverall = 'Runtime Error';
                currentResultDetail.status = 'Runtime Error';
                break;
            case 'System Error':
                finalSubmissionStatusOverall = 'System Error';
                currentResultDetail.status = 'System Error';
                break;
            case 'Success': // Chạy code thành công, cần so sánh output
                const userOutputNorm = normalizeOutput(singleRunResult.stdout);
                const expectedOutputNorm = normalizeOutput(tc.expectedOutput); // Sửa tc.output thành tc.expectedOutput

                if (userOutputNorm === expectedOutputNorm) {
                    currentResultDetail.status = 'Accepted';
                    // finalSubmissionStatusOverall vẫn là 'Accepted' nếu chưa có lỗi nào trước đó
                } else {
                    finalSubmissionStatusOverall = 'Wrong Answer';
                    currentResultDetail.status = 'Wrong Answer';
                }
                break;
            default:
                finalSubmissionStatusOverall = 'System Error';
                currentResultDetail.status = 'System Error';
                currentResultDetail.stderr = `Unknown status from runInDocker: ${singleRunResult.status}`;
        }
        allResultDetails.push(currentResultDetail);

        // Nếu gặp lỗi nghiêm trọng (CE, TLE, MLE, RE, SE, WA), thì dừng chấm các test case tiếp theo
        // và đó sẽ là kết quả cuối cùng của submission.
        if (finalSubmissionStatusOverall !== 'Accepted' && currentResultDetail.status !== 'Accepted') {
            break;
        }
    } // End for loop testcases

    // Chuẩn bị dữ liệu để cập nhật vào DB
    const updatePayload = {
        status: finalSubmissionStatusOverall,
        result_details: allResultDetails,
        compile_output: finalCompileOutput,
        execution_time_ms: maxTimeAcrossTestCases,
        memory_usage_kb: maxMemoryAcrossTestCases, // Cập nhật nếu đo được
    };

    // Lấy final_stdout/stderr từ test case đầu tiên bị lỗi hoặc test case cuối nếu all accepted
    if (allResultDetails.length > 0) {
        const firstNonAcceptedDetail = allResultDetails.find(detail => detail.status !== 'Accepted');
        if (firstNonAcceptedDetail) {
            updatePayload.final_stdout = firstNonAcceptedDetail.stdout;
            updatePayload.final_stderr = firstNonAcceptedDetail.stderr;
        } else { // All test cases were accepted
            const lastDetail = allResultDetails[allResultDetails.length - 1];
            updatePayload.final_stdout = lastDetail.stdout;
            // final_stderr có thể rỗng nếu không có warning
        }
    }

    await Submission.findByIdAndUpdate(submissionId, updatePayload);

    if (finalSubmissionStatusOverall === 'Accepted') {
        try {
            await User.updateOne(
                { _id: submission.user_id },
                { $addToSet: { solved_problem_ids: submission.problem_id } } // Giả sử User model có solved_problem_ids
            );
            await Problem.updateOne(
                { _id: submission.problem_id },
                {
                    $addToSet: { successfulSolverIds: submission.user_id }, // Sửa successful_solver_ids
                    $inc: { solvedByCount: 1 } // Tăng solvedByCount
                }
            );
        } catch (err) {
            console.error("Error updating user/problem stats:", err);
        }
    }
    console.log(`Submission ${submissionId} processed. Final status: ${finalSubmissionStatusOverall}`);
}

async function createSubmission(data) {
    const { userId, problemId, language, source_code } = data;

    const problem = await Problem.findById(problemId); // Dùng _id
    if (!problem) {
        throw new Error('Problem not found');
    }
    // Thêm kiểm tra ngôn ngữ được hỗ trợ
    if (!LANG_CONFIG[language]) { // LANG_CONFIG cần được export từ runInDocker hoặc định nghĩa ở đây
         throw new Error(`Language ${language} is not supported.`);
    }


    const newSubmission = new Submission({
        user_id: userId,
        problem_id: problemId,
        language,
        source_code,
    });
    await newSubmission.save();

    // Không await processSubmission để không block request
    processSubmission(newSubmission._id).catch(err => {
        console.error(`Critical error processing submission ${newSubmission._id}:`, err);
        Submission.findByIdAndUpdate(newSubmission._id, {
            status: 'System Error',
            final_stderr: 'An unexpected error occurred during submission processing.'
        }).catch(updateErr => console.error('Failed to update submission to System Error post-crash:', updateErr));
    });
    return newSubmission;
}

module.exports = { createSubmission };