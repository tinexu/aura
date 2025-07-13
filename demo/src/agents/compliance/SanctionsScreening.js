const { screenAgainstWatchList } = require('../utils/screeningUtils');

function performSanctionsCheck(application, watchLists) {
    const sanctions = {
        status: 'PENDING',
        lists: ['OFAC', 'UN', 'EU', 'UK'],
        matches: [],
        falsePositives: [],
        requiresReview: false
    };

    // Screen against each sanctions list
    for (const list of sanctions.lists) {
        const matches = screenAgainstSanctionsList(application.personalInfo, list);
        sanctions.matches.push(...matches);
    }

    // Evaluate matches
    if (sanctions.matches.length > 0) {
        sanctions.requiresReview = true;
        sanctions.status = 'REVIEW_REQUIRED';
    } else {
        sanctions.status = 'CLEAR';
    }

    return sanctions;
}

module.exports = performSanctionsCheck;