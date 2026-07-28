/**
 * Serviço responsável pelo histórico das automações
 * realizadas pelo OnboardFlow.
 */

/**
 * Registra uma ação na tabela Automacoes do Airtable.
 *
 * @param {Object} dados Dados da ação executada.
 * @return {Object} Resumo do registro criado.
 */
function registrarAutomacao_(dados) {
  const config = getAirtableConfig_();
  const informacoes = dados || {};

  const idAutomacao =
    informacoes.idAutomacao ||
    'AUT-' + Utilities.getUuid();

  const campos = {
    'Ação':
      informacoes.acao ||
      'Registro de automação',

    'ID Automação':
      idAutomacao,

    'Tipo':
      informacoes.tipo ||
      'Cadastro do colaborador',

    'Data e Hora':
      new Date().toISOString(),

    'Resultado':
      informacoes.resultado ||
      'Sucesso',

    'Mensagem':
      informacoes.mensagem ||
      '',

    'Identificador Externo':
      informacoes.identificadorExterno ||
      '',

    'Detalhes Técnicos':
      informacoes.detalhesTecnicos ||
      ''
  };

  /*
   * O campo Colaborador é um relacionamento do Airtable.
   * Ele será enviado somente quando houver um Record ID válido.
   */
  if (informacoes.colaboradorRecordId) {
    campos.Colaborador = [
      informacoes.colaboradorRecordId
    ];
  }

  const resposta = airtableRequest_(
    config.tabelaAutomacoes,
    {
      method: 'post',
      payload: {
        records: [
          {
            fields: campos
          }
        ],
        typecast: false
      }
    }
  );

  const registroCriado =
    resposta.records &&
    resposta.records.length > 0
      ? resposta.records[0]
      : null;

  if (!registroCriado) {
    throw new Error(
      'O Airtable não retornou o registro criado.'
    );
  }

  return {
    sucesso: true,
    recordId: registroCriado.id,
    idAutomacao: idAutomacao,
    acao: campos['Ação'],
    resultado: campos.Resultado
  };
}

/**
 * Testa a permissão de gravação criando um registro
 * técnico na tabela Automacoes.
 *
 * @return {Object} Resultado do teste.
 */
function testarEscritaAirtable() {
  const identificador =
    'TESTE-' +
    Utilities.formatDate(
      new Date(),
      'America/Sao_Paulo',
      'yyyyMMdd-HHmmss'
    );

  const resultado = registrarAutomacao_({
    acao: 'Teste de escrita na API do Airtable',
    tipo: 'Cadastro do colaborador',
    resultado: 'Sucesso',
    mensagem:
      'A integração do Google Apps Script com o Airtable conseguiu criar um registro.',
    identificadorExterno: identificador,
    detalhesTecnicos:
      'Teste técnico executado durante o desenvolvimento do OnboardFlow.'
  });

  console.log(
    'Registro de teste criado com sucesso.'
  );

  console.log(
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}
