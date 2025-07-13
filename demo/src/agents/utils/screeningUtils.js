const fuzzyMatch = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
};

function screenAgainstWatchList(personalInfo, watchList) {
    const matches = [];
    const fuzzyMatches = [];

    const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.toLowerCase();

    for (const entry of watchList) {
        if (entry.name.toLowerCase() === fullName) {
            matches.push({
                type: 'EXACT_MATCH',
                confidence: 1.0,
                entry
            });
        } else if (fuzzyMatch(fullName, entry.name.toLowerCase()) > 0.8) {
            fuzzyMatches.push({
                type: 'FUZZY_MATCH',
                confidence: fuzzyMatch(fullName, entry.name.toLowerCase()),
                entry
            });
        }
    }

    return { matches, fuzzyMatches };
}

module.exports = {
    screenAgainstWatchList
};