const fs = require('fs');

const file = 'src/assets/i18n/es.json';
let text = fs.readFileSync(file, 'utf8');

const replacements = {
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã­': 'í',
  'Ã±': 'ñ',
  'Â¡': '¡',
  'Â¿': '¿',
  'â€”': '—',
  'â€¦': '…',
  'â€¢': '•',
  'â†’': '→'
};

for (const [bad, good] of Object.entries(replacements)) {
  text = text.split(bad).join(good);
}

fs.writeFileSync(file, text, 'utf8');
console.log('Fixed mojibake in ' + file);
