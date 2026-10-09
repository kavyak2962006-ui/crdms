const stopWords = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
  'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
  'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as',
  'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off',
  'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should',
  'now', 'looking', 'candidate', 'candidates', 'experience', 'skills', 'required', 'preferred'
]);

function tokenize(text) {
  if (!text) return [];
  // Convert to lowercase
  let cleanText = text.toLowerCase();
  
  // Replace non-alphanumeric (except basic programming punctuation like + # .) with spaces
  // This helps keep 'c++', 'c#', 'node.js', '.net' intact.
  cleanText = cleanText.replace(/[^a-z0-9+#.]/g, ' ');
  
  // Tokenize by splitting on whitespace
  const tokens = cleanText.split(/\s+/).filter(token => token.length > 0);
  
  // Remove stop words and extremely short words unless they are specific technical terms (c, r)
  const validTerms = ['c', 'r'];
  
  return tokens.filter(token => {
    if (stopWords.has(token)) return false;
    if (token.length === 1 && !validTerms.includes(token)) return false;
    return true;
  });
}

function calculateTermFrequency(tokens) {
  const tf = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  return tf;
}

function calculateFitScore(studentSkills, jobDescription) {
  const studentTokens = tokenize(studentSkills);
  const jobTokens = tokenize(jobDescription);
  
  if (jobTokens.length === 0 || studentTokens.length === 0) {
    return 0; // 0% match if either is empty or has no usable words
  }

  // Treat Job Description as the primary reference vector.
  // We want to see how many of the Job Description's requirements the student meets.
  const jobTf = calculateTermFrequency(jobTokens);
  const studentTf = calculateTermFrequency(studentTokens);

  // Since this is a simple text matching score, we compute Cosine Similarity based on Term Frequency (TF).
  // A more advanced TF-IDF would require a corpus of all resumes, but for a 1-to-1 match, TF Cosine Similarity is effective.

  // 1. Calculate Dot Product
  let dotProduct = 0;
  const uniqueWords = new Set([...Object.keys(jobTf), ...Object.keys(studentTf)]);
  
  uniqueWords.forEach(word => {
    const jobWeight = jobTf[word] || 0;
    const studentWeight = studentTf[word] || 0;
    dotProduct += jobWeight * studentWeight;
  });

  // 2. Calculate Magnitudes
  let jobMagnitude = 0;
  Object.values(jobTf).forEach(count => {
    jobMagnitude += count * count;
  });
  jobMagnitude = Math.sqrt(jobMagnitude);

  let studentMagnitude = 0;
  Object.values(studentTf).forEach(count => {
    studentMagnitude += count * count;
  });
  studentMagnitude = Math.sqrt(studentMagnitude);

  if (jobMagnitude === 0 || studentMagnitude === 0) {
    return 0;
  }

  // 3. Cosine Similarity (0 to 1)
  const similarity = dotProduct / (jobMagnitude * studentMagnitude);

  // 4. Convert to Percentage (0 to 100)
  let percentage = similarity * 100;
  
  // Cap at 100 and floor at 0 just in case of floating point anomalies
  percentage = Math.max(0, Math.min(100, Math.round(percentage)));

  return percentage;
}

module.exports = {
  calculateFitScore
};
