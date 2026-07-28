/**
 * Serviço principal de criação de onboardings.
 *
 * Responsabilidades:
 * - validar os dados recebidos;
 * - buscar as configurações aplicáveis;
 * - cadastrar o colaborador;
 * - gerar as tarefas automaticamente;
 * - calcular os prazos;
 * - registrar a operação no histórico.
 */

/**
 * Escapa um texto para ser utilizado dentro de fórmulas do Airtable.
 *
 * @param {*} valor Valor original.
 * @return {string} Valor seguro para a fórmula.
 */
function escaparFormulaAirtable_(valor) {
  return String(valor || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Formata uma data no padrão aceito pelos campos Date do Airtable.
 *
 * @param {Date} data Data a ser formatada.
 * @return {string} Data no formato yyyy-MM-dd.
 */
function formatarDataAirtable_(data) {
  return Utilities.formatDate(
    data,
    'America/Sao_Paulo',
    'yyyy-MM-dd'
  );
}

/**
 * Converte uma data yyyy-MM-dd em objeto Date no horário local.
 *
 * O horário do meio-dia reduz o risco de alteração da data
 * causada por conversões de fuso horário.
 *
 * @param {string} dataIso Data no formato yyyy-MM-dd.
 * @return {Date} Data convertida.
 */
function criarDataLocal_(dataIso) {
  const partes = String(dataIso || '')
    .split('-')
    .map(function (valor) {
      return Number(valor);
    });

  if (
    partes.length !== 3 ||
    !partes[0] ||
    !partes[1] ||
    !partes[2]
  ) {
    throw new Error(
      'Data inválida. Utilize o formato yyyy-MM-dd.'
    );
  }

  const data = new Date(
    partes[0],
    partes[1] - 1,
    partes[2],
    12,
    0,
    0
  );

  if (isNaN(data.getTime())) {
    throw new Error(
      'Não foi possível interpretar a data informada.'
    );
  }

  return data;
}

/**
 * Adiciona ou remove dias de uma data.
 *
 * @param {string} dataIso Data base no formato yyyy-MM-dd.
 * @param {number} quantidadeDias Quantidade de dias.
 * @return {string} Nova data no formato yyyy-MM-dd.
 */
function adicionarDias_(dataIso, quantidadeDias) {
  const data = criarDataLocal_(dataIso);

  data.setDate(
    data.getDate() + Number(quantidadeDias || 0)
  );

  return formatarDataAirtable_(data);
}

/**
 * Cria um identificador único para registros do projeto.
 *
 * @param {string} prefixo Prefixo do identificador.
 * @return {string} Identificador gerado.
 */
function gerarIdentificador_(prefixo) {
  return (
    prefixo +
    '-' +
    Utilities.getUuid().toUpperCase()
  );
}

/**
 * Faz uma validação básica de endereço de e-mail.
 *
 * @param {string} email Endereço a validar.
 * @return {boolean} Resultado da validação.
 */
function validarEmailBasico_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || '').trim()
  );
}

/**
 * Valida os dados necessários para criar um onboarding.
 *
 * @param {Object} dados Dados do colaborador.
 */
function validarDadosOnboarding_(dados) {
  const obrigatorios = {
    nome: dados.nome,
    email: dados.email,
    cargo: dados.cargo,
    departamento: dados.departamento,
    dataAdmissao: dados.dataAdmissao,
    liderResponsavel: dados.liderResponsavel,
    emailLider: dados.emailLider,
    modalidade: dados.modalidade,
    tipoVinculo: dados.tipoVinculo
  };

  const ausentes = Object.keys(obrigatorios)
    .filter(function (campo) {
      return (
        obrigatorios[campo] === undefined ||
        obrigatorios[campo] === null ||
        String(obrigatorios[campo]).trim() === ''
      );
    });

  if (ausentes.length > 0) {
    throw new Error(
      'Campos obrigatórios ausentes: ' +
      ausentes.join(', ')
    );
  }

  if (!validarEmailBasico_(dados.email)) {
    throw new Error(
      'O e-mail do colaborador é inválido.'
    );
  }

  if (!validarEmailBasico_(dados.emailLider)) {
    throw new Error(
      'O e-mail do líder responsável é inválido.'
    );
  }

  criarDataLocal_(dados.dataAdmissao);
}

/**
 * Busca as configurações ativas aplicáveis ao departamento.
 *
 * Serão retornadas:
 * - todas as tarefas marcadas como "Todos";
 * - as tarefas específicas do departamento.
 *
 * @param {string} departamento Departamento do colaborador.
 * @return {Array<Object>} Configurações encontradas.
 */
function buscarConfiguracoesOnboarding_(departamento) {
  const config = getAirtableConfig_();

  const departamentoSeguro =
    escaparFormulaAirtable_(departamento);

  const formula =
    'AND(' +
      '{Ativa}=1,' +
      'OR(' +
        '{Departamento}="Todos",' +
        '{Departamento}="' +
          departamentoSeguro +
        '"' +
      ')' +
    ')';

  const resposta = airtableRequest_(
    config.tabelaConfiguracoes,
    {
      method: 'get',
      query: {
        filterByFormula: formula,
        'sort[0][field]': 'Ordem',
        'sort[0][direction]': 'asc',
        pageSize: 100,
        maxRecords: 100
      }
    }
  );

  return (resposta.records || []).map(
    function (registro) {
      return {
        recordId: registro.id,
        fields: registro.fields || {}
      };
    }
  );
}

/**
 * Cria o colaborador na tabela Colaboradores.
 *
 * @param {Object} dados Dados validados.
 * @return {Object} Registro criado.
 */
function criarColaboradorAirtable_(dados) {
  const config = getAirtableConfig_();
  const idOnboarding = gerarIdentificador_('ONB');

  const campos = {
    'Nome': String(dados.nome).trim(),
    'ID Onboarding': idOnboarding,
    'Email': String(dados.email).trim(),
    'Cargo': String(dados.cargo).trim(),
    'Departamento': dados.departamento,
    'Data de Admissão': dados.dataAdmissao,
    'Líder Responsável':
      String(dados.liderResponsavel).trim(),
    'Email do Líder':
      String(dados.emailLider).trim(),
    'Modalidade': dados.modalidade,
    'Tipo de Vínculo': dados.tipoVinculo,
    'Status': 'Pendente',
    'Progresso': 0,
    'Email de Boas-vindas Enviado': false,
    'Evento de Integração Criado': false,
    'Observações':
      String(dados.observacoes || '').trim()
  };

  const resposta = airtableRequest_(
    config.tabelaColaboradores,
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

  const registro =
    resposta.records &&
    resposta.records.length > 0
      ? resposta.records[0]
      : null;

  if (!registro) {
    throw new Error(
      'O Airtable não retornou o colaborador criado.'
    );
  }

  return {
    recordId: registro.id,
    idOnboarding: idOnboarding,
    nome: campos.Nome
  };
}

/**
 * Converte uma configuração em uma tarefa do onboarding.
 *
 * @param {Object} configuracao Configuração do Airtable.
 * @param {string} colaboradorRecordId Record ID do colaborador.
 * @param {string} dataAdmissao Data de admissão.
 * @return {Object} Campos da tarefa.
 */
function montarTarefa_(
  configuracao,
  colaboradorRecordId,
  dataAdmissao
) {
  const camposConfiguracao =
    configuracao.fields || {};

  const prazo = adicionarDias_(
    dataAdmissao,
    camposConfiguracao['Dias para Conclusão']
  );

  return {
    'Título':
      camposConfiguracao['Tarefa Padrão'],

    'ID Tarefa':
      gerarIdentificador_('TSK'),

    'Colaborador': [
      colaboradorRecordId
    ],

    'Área Responsável':
      camposConfiguracao['Área Responsável'],

    'Categoria':
      camposConfiguracao.Categoria,

    'Prazo':
      prazo,

    'Status':
      'Pendente',

    'Obrigatória':
      Boolean(
        camposConfiguracao['Obrigatória']
      ),

    'Ordem':
      Number(
        camposConfiguracao.Ordem || 0
      ),

    'Observações':
      camposConfiguracao.Orientações || ''
  };
}

/**
 * Cria as tarefas em lotes.
 *
 * @param {Array<Object>} configuracoes Configurações aplicáveis.
 * @param {string} colaboradorRecordId Record ID do colaborador.
 * @param {string} dataAdmissao Data de admissão.
 * @return {Array<string>} Record IDs das tarefas criadas.
 */
function criarTarefasOnboarding_(
  configuracoes,
  colaboradorRecordId,
  dataAdmissao
) {
  const config = getAirtableConfig_();

  const registros = configuracoes.map(
    function (configuracao) {
      return {
        fields: montarTarefa_(
          configuracao,
          colaboradorRecordId,
          dataAdmissao
        )
      };
    }
  );

  const recordIdsCriados = [];
  const tamanhoDoLote = 10;

  for (
    let indice = 0;
    indice < registros.length;
    indice += tamanhoDoLote
  ) {
    const lote = registros.slice(
      indice,
      indice + tamanhoDoLote
    );

    const resposta = airtableRequest_(
      config.tabelaTarefas,
      {
        method: 'post',
        payload: {
          records: lote,
          typecast: false
        }
      }
    );

    (resposta.records || []).forEach(
      function (registro) {
        recordIdsCriados.push(registro.id);
      }
    );

    const aindaHaLotes =
      indice + tamanhoDoLote < registros.length;

    if (aindaHaLotes) {
      Utilities.sleep(250);
    }
  }

  if (
    recordIdsCriados.length !== registros.length
  ) {
    throw new Error(
      'Quantidade inesperada de tarefas criadas. ' +
      'Esperado: ' +
      registros.length +
      '. Recebido: ' +
      recordIdsCriados.length +
      '.'
    );
  }

  return recordIdsCriados;
}

/**
 * Executa o fluxo completo de criação do onboarding.
 *
 * @param {Object} dados Dados do colaborador.
 * @return {Object} Resumo da operação.
 */
function criarOnboarding_(dados) {
  validarDadosOnboarding_(dados);

  const configuracoes =
    buscarConfiguracoesOnboarding_(
      dados.departamento
    );

  if (configuracoes.length === 0) {
    throw new Error(
      'Nenhuma configuração ativa foi encontrada ' +
      'para o departamento informado.'
    );
  }

  Utilities.sleep(250);

  const colaborador =
    criarColaboradorAirtable_(dados);

  Utilities.sleep(250);

  const tarefasRecordIds =
    criarTarefasOnboarding_(
      configuracoes,
      colaborador.recordId,
      dados.dataAdmissao
    );

  Utilities.sleep(250);

  const log = registrarAutomacao_({
    acao:
      'Onboarding criado com ' +
      tarefasRecordIds.length +
      ' tarefas',

    tipo:
      'Criação de tarefas',

    resultado:
      'Sucesso',

    mensagem:
      'Colaborador cadastrado e checklist ' +
      'de onboarding criado automaticamente.',

    identificadorExterno:
      colaborador.idOnboarding,

    colaboradorRecordId:
      colaborador.recordId,

    detalhesTecnicos:
      'Configurações aplicadas: ' +
      configuracoes.length +
      '. Tarefas criadas: ' +
      tarefasRecordIds.length +
      '.'
  });

  return {
    sucesso: true,
    colaborador: colaborador.nome,
    colaboradorRecordId:
      colaborador.recordId,
    idOnboarding:
      colaborador.idOnboarding,
    configuracoesAplicadas:
      configuracoes.length,
    tarefasCriadas:
      tarefasRecordIds.length,
    logRecordId:
      log.recordId
  };
}

/**
 * Teste integrado do fluxo de onboarding.
 *
 * Atenção:
 * esta função cria dados reais de teste no Airtable.
 * Execute somente uma vez durante esta etapa.
 *
 * @return {Object} Resultado do teste.
 */
function testarCriacaoOnboarding() {
  const agora = new Date();

  const sufixo = Utilities.formatDate(
    agora,
    'America/Sao_Paulo',
    'yyyyMMdd-HHmmss'
  );

  const dataAdmissao = new Date(agora);
  dataAdmissao.setDate(
    dataAdmissao.getDate() + 30
  );

  const resultado = criarOnboarding_({
    nome:
      'Colaborador Teste ' + sufixo,

    email:
      'onboardflow.teste+' +
      sufixo +
      '@example.com',

    cargo:
      'Analista de Suporte',

    departamento:
      'Tecnologia da Informação',

    dataAdmissao:
      formatarDataAirtable_(dataAdmissao),

    liderResponsavel:
      'Líder de Teste',

    emailLider:
      'lider.teste@example.com',

    modalidade:
      'Presencial',

    tipoVinculo:
      'CLT',

    observacoes:
      'Registro fictício criado exclusivamente ' +
      'para validar o fluxo acadêmico do OnboardFlow.'
  });

  console.log(
    'Onboarding de teste criado com sucesso.'
  );

  console.log(
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}
