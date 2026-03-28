/**
 * prd add-project — deprecated in v3 (each repo has its own product-docs/)
 */

const chalk = require('chalk');

async function addProject() {
  console.log(chalk.cyan('ℹ  add-project is no longer needed with the new structure.'));
  console.log(chalk.gray('   Each project is its own repo with product-docs/ inside it.'));
  console.log(chalk.gray('   To start a new project: cd into your new project repo and run prd init.'));
  console.log('');
}

module.exports = { addProject };
