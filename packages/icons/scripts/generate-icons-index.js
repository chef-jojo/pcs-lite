const path = require('path');
const camelcase = require('camelcase');

// return `/* eslint-disable prettier/prettier */
// ${importEntries.join('\n')}
// `;
// export const Icons = {
//   ${compoundExportEntries.join(',\n  ')}
// };

function defaultIndexTemplate(filePaths) {
  const exportEntries = filePaths.map((filePath) => {
    const basename = path.basename(filePath, path.extname(filePath));
    const componentName = camelcase(basename, { pascalCase: true });
    const exportName = `${componentName}Icon`;
    return `export { default as ${exportName} } from './${basename}';`;
  });
  return exportEntries.join('\n');
}

module.exports = defaultIndexTemplate;
