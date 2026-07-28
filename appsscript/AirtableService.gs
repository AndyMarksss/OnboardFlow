/**
 * Serviço de integração com a API do Airtable.
 *
 * As credenciais são obtidas das Propriedades do Script.
 * Nenhum token é armazenado diretamente no código.
 */

/**
 * Retorna as configurações necessárias para acessar o Airtable.
 *
 * @return {Object} Configurações da integração.
 */
function getAirtableConfig_() {
  const properties = PropertiesService.getScriptProperties();

  const config = {
    token: properties.getProperty('AIRTABLE_TOKEN'),
    baseId: properties.getProperty('AIRTABLE_BASE_ID'),
    tabelaColaboradores: properties.getProperty(
      'AIRTABLE_TABLE_COLABORADORES'
    ),
    tabelaTarefas: properties.getProperty(
      'AIRTABLE_TABLE_TAREFAS'
    ),
    tabelaAutomacoes: properties.getProperty(
      'AIRTABLE_TABLE_AUTOMACOES'
    ),
    tabelaConfiguracoes: properties.getProperty(
      'AIRTABLE_TABLE_CONFIGURACOES'
    )
  };

  const obrigatorias = {
    AIRTABLE_TOKEN: config.token,
    AIRTABLE_BASE_ID: config.baseId,
    AIRTABLE_TABLE_COLABORADORES: config.tabelaColaboradores,
    AIRTABLE_TABLE_TAREFAS: config.tabelaTarefas,
    AIRTABLE_TABLE_AUTOMACOES: config.tabelaAutomacoes,
    AIRTABLE_TABLE_CONFIGURACOES: config.tabelaConfiguracoes
  };

  const ausentes = Object.keys(obrigatorias).filter(function (chave) {
    return !obrigatorias[chave];
  });

  if (ausentes.length > 0) {
    throw new Error(
      'Propriedades do script ausentes: ' + ausentes.join(', ')
    );
  }

  return config;
}

/**
 * Monta os parâmetros de consulta da URL.
 *
 * @param {Object} query Parâmetros da consulta.
 * @return {string} Query string codificada.
 */
function buildAirtableQuery_(query) {
  if (!query) {
    return '';
  }

  const parametros = [];

  Object.keys(query).forEach(function (chave) {
    const valor = query[chave];

    if (
      valor === undefined ||
      valor === null ||
      valor === ''
    ) {
      return;
    }

    if (Array.isArray(valor)) {
      valor.forEach(function (item) {
        if (item === undefined || item === null || item === '') {
          return;
        }

        parametros.push(
          encodeURIComponent(chave) +
          '=' +
          encodeURIComponent(String(item))
        );
      });

      return;
    }

    parametros.push(
      encodeURIComponent(chave) +
      '=' +
      encodeURIComponent(String(valor))
    );
  });

  return parametros.length > 0
    ? '?' + parametros.join('&')
    : '';
}

/**
 * Executa uma requisição para a API do Airtable.
 *
 * @param {string} tabela Nome da tabela.
 * @param {Object=} options Configurações da requisição.
 * @return {Object} Resposta convertida de JSON.
 */
function airtableRequest_(tabela, options) {
  const config = getAirtableConfig_();
  const requestOptions = options || {};
  const metodo = requestOptions.method || 'get';

  const url =
    'https://api.airtable.com/v0/' +
    encodeURIComponent(config.baseId) +
    '/' +
    encodeURIComponent(tabela) +
    buildAirtableQuery_(requestOptions.query);

  const parametros = {
    method: metodo,
    headers: {
      Authorization: 'Bearer ' + config.token
    },
    muteHttpExceptions: true
  };

  if (requestOptions.payload) {
    parametros.contentType = 'application/json';
    parametros.payload = JSON.stringify(requestOptions.payload);
  }

  const resposta = UrlFetchApp.fetch(url, parametros);
  const statusCode = resposta.getResponseCode();
  const respostaTexto = resposta.getContentText();

  let respostaJson;

  try {
    respostaJson = respostaTexto
      ? JSON.parse(respostaTexto)
      : {};
  } catch (error) {
    respostaJson = {
      mensagemOriginal: respostaTexto
    };
  }

  if (statusCode < 200 || statusCode >= 300) {
    const detalhe =
      respostaJson &&
      respostaJson.error &&
      respostaJson.error.message
        ? respostaJson.error.message
        : respostaTexto;

    throw new Error(
      'Erro na API do Airtable. HTTP ' +
      statusCode +
      ': ' +
      detalhe
    );
  }

  return respostaJson;
}

/**
 * Testa a conexão com o Airtable consultando um registro
 * da tabela Configuracoes.
 *
 * @return {Object} Resultado resumido do teste.
 */
function testarConexaoAirtable() {
  const config = getAirtableConfig_();

  const resposta = airtableRequest_(
    config.tabelaConfiguracoes,
    {
      method: 'get',
      query: {
        maxRecords: 1,
        pageSize: 1
      }
    }
  );

  const registros = resposta.records || [];
  const primeiroRegistro = registros.length > 0
    ? registros[0]
    : null;

  const primeiraTarefa =
    primeiroRegistro &&
    primeiroRegistro.fields
      ? primeiroRegistro.fields['Tarefa Padrão']
      : null;

  const resultado = {
    sucesso: true,
    tabela: config.tabelaConfiguracoes,
    registrosRecebidos: registros.length,
    primeiraTarefa: primeiraTarefa || 'Nenhum registro encontrado'
  };

  console.log(
    'Conexão com o Airtable realizada com sucesso.'
  );

  console.log(
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}
