const fs = require('fs');
const path = require('path');

// Fix all null to undefined in models and context
const files = [
  'src/webparts/helpDesk/context/AppContext.tsx',
  'src/webparts/helpDesk/models/IFAQ.ts',
  'src/webparts/helpDesk/models/IKnowledgeBase.ts',
  'src/webparts/helpDesk/models/ITicket.ts',
  'src/webparts/helpDesk/models/index.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace null with undefined in type declarations
    content = content.replace(/: (.*?) \| null/g, ': $1 | undefined');
    content = content.replace(/= null;/g, '= undefined;');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('All null -> undefined replacements complete!');
