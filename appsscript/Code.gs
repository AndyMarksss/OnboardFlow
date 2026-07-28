/**
 * OnboardFlow
 * Central Inteligente de Onboarding de Colaboradores
 */

/**
 * Exibe a interface principal da aplicação.
 *
 * @return {HtmlOutput} Página HTML da aplicação.
 */
function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('OnboardFlow')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Inclui o conteúdo de outro arquivo HTML.
 *
 * @param {string} filename Nome do arquivo sem a extensão.
 * @return {string} Conteúdo do arquivo.
 */
function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}
