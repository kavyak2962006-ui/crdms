const technicalSkillsDictionary = {
  // Programming Languages
  python: 'Python',
  java: 'Java',
  c: 'C',
  'c++': 'C++',
  cpp: 'C++',
  'c#': 'C#',
  csharp: 'C#',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  sql: 'SQL',
  ruby: 'Ruby',
  go: 'Go',
  golang: 'Go',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  rust: 'Rust',
  dart: 'Dart',
  r: 'R',
  scala: 'Scala',

  // Frameworks and Libraries
  react: 'React',
  reactjs: 'React',
  'react.js': 'React',
  'react native': 'React Native',
  node: 'Node.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  express: 'Express.js',
  expressjs: 'Express.js',
  django: 'Django',
  flask: 'Flask',
  spring: 'Spring Boot',
  'spring boot': 'Spring Boot',
  angular: 'Angular',
  vue: 'Vue.js',
  vuejs: 'Vue.js',
  next: 'Next.js',
  nextjs: 'Next.js',
  tensorflow: 'TensorFlow',
  pytorch: 'PyTorch',
  opencv: 'OpenCV',
  scikit: 'scikit-learn',
  'scikit-learn': 'scikit-learn',
  pandas: 'Pandas',
  numpy: 'NumPy',
  bootstrap: 'Bootstrap',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  jquery: 'jQuery',

  // Databases
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  mongo: 'MongoDB',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  sqlite: 'SQLite',
  oracle: 'Oracle DB',
  redis: 'Redis',
  firebase: 'Firebase',
  cassandra: 'Cassandra',
  dynamodb: 'DynamoDB',

  // Developer Tools and Technologies
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  k8s: 'Kubernetes',
  linux: 'Linux',
  unix: 'Unix',
  bash: 'Bash',
  shell: 'Shell Scripting',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'Google Cloud Platform',
  html: 'HTML',
  html5: 'HTML',
  css: 'CSS',
  css3: 'CSS',
  rest: 'REST API',
  graphql: 'GraphQL',
  postman: 'Postman',
  jenkins: 'Jenkins',
  ci: 'CI/CD',
  cd: 'CI/CD',
  'ci/cd': 'CI/CD',
  agile: 'Agile',
  scrum: 'Scrum',
  jira: 'Jira',
  figma: 'Figma'
};

const extractTechnicalSkills = (resumeText) => {
  if (!resumeText || typeof resumeText !== 'string') return [];

  // Lowercase the text for case-insensitive matching
  const lowerText = resumeText.toLowerCase();
  
  // Replace symbols that might mess up word boundaries, EXCEPT for + and # which are needed for C++ and C#
  // We keep spaces, alphanumeric, +, #, and dots (for Node.js)
  const cleanText = lowerText.replace(/[^a-z0-9+#.\s]/g, ' ');

  const extractedSkills = new Set();

  // Create an array of keys sorted by length descending so that multi-word skills 
  // (like 'react native') are matched before single-word skills (like 'react')
  const keys = Object.keys(technicalSkillsDictionary).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    // Escape special characters in key for regex (like +, #, .)
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // We use a regex with word boundaries. 
    // Note: \b doesn't work perfectly before symbols like +, #. 
    // So if the key ends in + or #, we adjust the boundary.
    let regexStr;
    if (key.match(/[+#.]$/)) {
      regexStr = `\\b${escapedKey}(?=\\s|$)`;
    } else if (key.match(/^[+#.]/)) {
      regexStr = `(?<=\\s|^)${escapedKey}\\b`;
    } else {
      regexStr = `\\b${escapedKey}\\b`;
    }

    const regex = new RegExp(regexStr, 'g');
    if (regex.test(cleanText)) {
      extractedSkills.add(technicalSkillsDictionary[key]);
      
      // If we matched a multi-word skill, we might optionally want to remove it 
      // from cleanText to prevent partial overlaps, but for simple skills it's usually fine.
    }
  }

  return Array.from(extractedSkills);
};

module.exports = {
  extractTechnicalSkills
};
