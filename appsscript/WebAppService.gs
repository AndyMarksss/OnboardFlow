/**
 * Serviço utilizado pela interface web do OnboardFlow.
 *
 * Responsabilidades:
 * - fornecer os indicadores do dashboard;
 * - listar os onboardings cadastrados;
 * - receber o formulário da interface;
 * - executar o fluxo completo de integração;
 * - consolidar indicadores de tarefas e atrasos.
 */

/**
 * Converte o valor do campo Percent do Airtable
 * para um número entre 0 e 100.
 *
 * @param {*} valor Valor recebido da API.
 * @return {number} Percentual normalizado.
 */
function normalizarProgresso_(valor) {
  const numero = Number(valor || 0);

  if (!isFinite(numero)) {
    return 0;
  }

  /*
   * O Airtable normalmente retorna:
   * 0.5 para representar 50%.
   */
  const percentual =
    numero <= 1
      ? numero * 100
      : numero;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(percentual)
    )
  );
}

/**
 * Converte um registro do Airtable para um objeto
 * seguro e simples para utilização na interface.
 *
 * @param {Object} registro Registro original.
 * @return {Object} Colaborador normalizado.
 */
function normalizarColaboradorInterface_(
  registro
) {
  const fields = registro.fields || {};

  return {
    recordId:
      registro.id,

    nome:
      fields.Nome || '',

    idOnboarding:
      fields['ID Onboarding'] || '',

    email:
      fields.Email || '',

    cargo:
      fields.Cargo || '',

    departamento:
      fields.Departamento || '',

    dataAdmissao:
      String(
        fields['Data de Admissão'] || ''
      ).substring(0, 10),

    liderResponsavel:
      fields['Líder Responsável'] || '',

    emailLider:
      fields['Email do Líder'] || '',

    modalidade:
      fields.Modalidade || '',

    tipoVinculo:
      fields['Tipo de Vínculo'] || '',

    status:
      fields.Status || 'Pendente',

    progresso:
      normalizarProgresso_(
        fields.Progresso
      ),

    emailEnviado:
      Boolean(
        fields[
          'Email de Boas-vindas Enviado'
        ]
      ),

    eventoCriado:
      Boolean(
        fields[
          'Evento de Integração Criado'
        ]
      ),

    quantidadeTarefas:
      Array.isArray(fields.Tarefas)
        ? fields.Tarefas.length
        : 0,

    quantidadeAutomacoes:
      Array.isArray(fields.Automacoes)
        ? fields.Automacoes.length
        : 0,

    criadoEm:
      fields['Criado em'] || '',

    atualizadoEm:
      fields['Atualizado em'] || '',

    tarefasConcluidas: 0,
    tarefasEmAndamento: 0,
    tarefasPendentes: 0,
    tarefasAtrasadas: 0
  };
}

/**
 * Lista os colaboradores cadastrados no Airtable.
 *
 * @return {Array<Object>} Colaboradores normalizados.
 */
function listarColaboradoresInterface_() {
  const config = getAirtableConfig_();

  const resposta = airtableRequest_(
    config.tabelaColaboradores,
    {
      method: 'get',
      query: {
        'sort[0][field]':
          'Criado em',

        'sort[0][direction]':
          'desc',

        pageSize: 100,
        maxRecords: 100
      }
    }
  );

  return (resposta.records || []).map(
    normalizarColaboradorInterface_
  );
}


/**
 * Consolida as tarefas para uso no dashboard.
 *
 * @return {Object} Resumo global e por colaborador.
 */
function listarResumoTarefasDashboard_() {
  const config = getAirtableConfig_();
  const registros = listarTodosRegistrosGerenciamento_(
    config.tabelaTarefas
  );

  const porColaborador = {};
  const global = {
    total: 0,
    concluidas: 0,
    emAndamento: 0,
    pendentes: 0,
    atrasadas: 0
  };

  registros.forEach(function (registro) {
    const tarefa = normalizarTarefaGerenciamento_(registro);
    const relacionados = registro.fields && Array.isArray(registro.fields.Colaborador)
      ? registro.fields.Colaborador
      : [];

    global.total++;
    if (tarefa.concluida) global.concluidas++;
    else if (tarefa.emAndamento) global.emAndamento++;
    else global.pendentes++;
    if (tarefa.atrasada) global.atrasadas++;

    relacionados.forEach(function (recordId) {
      if (!porColaborador[recordId]) {
        porColaborador[recordId] = {
          total: 0,
          concluidas: 0,
          emAndamento: 0,
          pendentes: 0,
          atrasadas: 0
        };
      }

      const resumo = porColaborador[recordId];
      resumo.total++;
      if (tarefa.concluida) resumo.concluidas++;
      else if (tarefa.emAndamento) resumo.emAndamento++;
      else resumo.pendentes++;
      if (tarefa.atrasada) resumo.atrasadas++;
    });
  });

  return {
    global: global,
    porColaborador: porColaborador
  };
}

/**
 * Acrescenta os totais operacionais de tarefas aos colaboradores.
 *
 * @param {Array<Object>} colaboradores Lista normalizada.
 * @param {Object} resumoTarefas Resumo por Record ID.
 * @return {Array<Object>} Lista enriquecida.
 */
function enriquecerColaboradoresComTarefas_(colaboradores, resumoTarefas) {
  const mapa = resumoTarefas && resumoTarefas.porColaborador
    ? resumoTarefas.porColaborador
    : {};

  return colaboradores.map(function (colaborador) {
    const resumo = mapa[colaborador.recordId] || {};

    colaborador.quantidadeTarefas = Number(resumo.total || colaborador.quantidadeTarefas || 0);
    colaborador.tarefasConcluidas = Number(resumo.concluidas || 0);
    colaborador.tarefasEmAndamento = Number(resumo.emAndamento || 0);
    colaborador.tarefasPendentes = Number(resumo.pendentes || 0);
    colaborador.tarefasAtrasadas = Number(resumo.atrasadas || 0);

    return colaborador;
  });
}

/**
 * Monta os indicadores exibidos no dashboard.
 *
 * @param {Array<Object>} colaboradores Lista cadastrada.
 * @return {Object} Indicadores.
 */
function calcularIndicadoresDashboard_(
  colaboradores
) {
  const indicadores = {
    total: colaboradores.length,
    pendentes: 0,
    emAndamento: 0,
    concluidos: 0,
    cancelados: 0,
    eventosCriados: 0,
    emailsEnviados: 0,
    tarefasGeradas: 0,
    tarefasAtrasadas: 0,
    progressoMedio: 0
  };

  let somaProgresso = 0;

  colaboradores.forEach(
    function (colaborador) {
      switch (colaborador.status) {
        case 'Pendente':
          indicadores.pendentes++;
          break;

        case 'Em andamento':
          indicadores.emAndamento++;
          break;

        case 'Concluído':
          indicadores.concluidos++;
          break;

        case 'Cancelado':
          indicadores.cancelados++;
          break;
      }

      if (colaborador.eventoCriado) {
        indicadores.eventosCriados++;
      }

      if (colaborador.emailEnviado) {
        indicadores.emailsEnviados++;
      }

      indicadores.tarefasGeradas +=
        colaborador.quantidadeTarefas;

      indicadores.tarefasAtrasadas +=
        Number(colaborador.tarefasAtrasadas || 0);

      somaProgresso +=
        Number(colaborador.progresso || 0);
    }
  );

  indicadores.progressoMedio = colaboradores.length > 0
    ? Math.round(somaProgresso / colaboradores.length)
    : 0;

  return indicadores;
}

/**
 * Retorna todos os dados necessários para carregar
 * a página inicial do OnboardFlow.
 *
 * Esta função será chamada por google.script.run.
 *
 * @return {Object} Dados iniciais.
 */
function obterDadosIniciais() {
  try {
    const resumoTarefas =
      listarResumoTarefasDashboard_();

    const colaboradores =
      enriquecerColaboradoresComTarefas_(
        listarColaboradoresInterface_(),
        resumoTarefas
      );

    return {
      sucesso: true,

      indicadores:
        calcularIndicadoresDashboard_(
          colaboradores
        ),

      colaboradores:
        colaboradores,

      resumoTarefas:
        resumoTarefas.global,

      ambienteDemonstracao: true,

      mensagemAmbiente:
        'Notificações e eventos são direcionados ao ambiente de teste configurado para esta apresentação.'
    };
  } catch (error) {
    console.error(
      error.stack || error.message
    );

    return {
      sucesso: false,
      mensagem:
        'Não foi possível carregar os dados: ' +
        error.message
    };
  }
}

/**
 * Localiza um colaborador utilizando o Record ID.
 *
 * @param {string} recordId Record ID do Airtable.
 * @return {Object} Registro completo.
 */
function buscarColaboradorPorRecordId_(
  recordId
) {
  const config = getAirtableConfig_();

  const recordIdSeguro =
    escaparFormulaAirtable_(recordId);

  const resposta = airtableRequest_(
    config.tabelaColaboradores,
    {
      method: 'get',
      query: {
        filterByFormula:
          'RECORD_ID()="' +
          recordIdSeguro +
          '"',

        maxRecords: 1,
        pageSize: 1
      }
    }
  );

  const registros = resposta.records || [];

  if (registros.length === 0) {
    throw new Error(
      'O colaborador criado não foi localizado.'
    );
  }

  return registros[0];
}

/**
 * Limpa os textos recebidos da interface.
 *
 * @param {Object} dados Dados originais.
 * @return {Object} Dados normalizados.
 */
function normalizarDadosFormulario_(
  dados
) {
  const origem = dados || {};

  return {
    nome:
      String(origem.nome || '').trim(),

    email:
      String(origem.email || '').trim(),

    cargo:
      String(origem.cargo || '').trim(),

    departamento:
      String(
        origem.departamento || ''
      ).trim(),

    dataAdmissao:
      String(
        origem.dataAdmissao || ''
      ).trim(),

    liderResponsavel:
      String(
        origem.liderResponsavel || ''
      ).trim(),

    emailLider:
      String(
        origem.emailLider || ''
      ).trim(),

    modalidade:
      String(
        origem.modalidade || ''
      ).trim(),

    tipoVinculo:
      String(
        origem.tipoVinculo || ''
      ).trim(),

    observacoes:
      String(
        origem.observacoes || ''
      ).trim()
  };
}

/**
 * Executa todo o processo iniciado pelo formulário:
 *
 * 1. cria colaborador;
 * 2. gera tarefas;
 * 3. cria evento;
 * 4. envia e-mail;
 * 5. atualiza o Airtable;
 * 6. registra as automações.
 *
 * @param {Object} dados Dados enviados pela interface.
 * @return {Object} Resultado completo.
 */
function criarOnboardingCompleto(dados) {
  const lock =
    LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const dadosNormalizados =
      normalizarDadosFormulario_(dados);

    const onboarding =
      criarOnboarding_(
        dadosNormalizados
      );

    /*
     * Pequena pausa para aguardar a indexação
     * do registro criado no Airtable.
     */
    Utilities.sleep(400);

    const registroColaborador =
      buscarColaboradorPorRecordId_(
        onboarding.colaboradorRecordId
      );

    const evento =
      criarEventoIntegracaoAgenda_(
        registroColaborador
      );

    const email =
      enviarEmailBoasVindas_(
        registroColaborador
      );

    return {
      sucesso: true,

      mensagem:
        'Onboarding criado com sucesso.',

      colaborador:
        onboarding.colaborador,

      idOnboarding:
        onboarding.idOnboarding,

      tarefasCriadas:
        onboarding.tarefasCriadas,

      eventoCriado:
        Boolean(evento.sucesso),

      emailEnviado:
        Boolean(email.sucesso),

      destinatarioTeste:
        email.destinatario || '',

      detalhes: {
        onboarding: onboarding,
        evento: evento,
        email: email
      }
    };
  } catch (error) {
    console.error(
      error.stack || error.message
    );

    return {
      sucesso: false,

      mensagem:
        'Não foi possível concluir o onboarding: ' +
        error.message
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      /*
       * O bloqueio pode não ter sido obtido caso
       * a execução falhe antes do waitLock.
       */
    }
  }
}

/**
 * Testa apenas o carregamento dos dados da interface.
 *
 * Não cria novos registros.
 *
 * @return {Object} Resultado do teste.
 */
function testarDadosInterface() {
  const resultado =
    obterDadosIniciais();

  console.log(
    'Teste dos dados da interface concluído.'
  );

  console.log(
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}

/**
 * Executa uma validação somente de leitura da central operacional v0.4.7.
 *
 * Esta função não cria, altera nem exclui registros. Ela pode ser executada
 * manualmente no editor do Apps Script antes da publicação da implantação.
 *
 * @return {Object} Resumo da validação.
 */
function testarCentralOperacionalV047() {
  const dados = obterDadosIniciais();

  if (!dados || !dados.sucesso) {
    throw new Error(
      dados && dados.mensagem
        ? dados.mensagem
        : 'A central operacional não retornou dados válidos.'
    );
  }

  const primeiroColaborador = dados.colaboradores.length > 0
    ? dados.colaboradores[0]
    : null;

  let detalhesValidados = false;
  let quantidadeHistorico = 0;

  if (primeiroColaborador) {
    const detalhes = obterDetalhesOnboarding(
      primeiroColaborador.recordId
    );

    if (!detalhes || !detalhes.sucesso) {
      throw new Error(
        detalhes && detalhes.mensagem
          ? detalhes.mensagem
          : 'Não foi possível validar os detalhes do primeiro onboarding.'
      );
    }

    detalhesValidados = true;
    quantidadeHistorico = Array.isArray(detalhes.historico)
      ? detalhes.historico.length
      : 0;
  }

  const perfilApresentacao = dados.colaboradores.find(function (item) {
    return String(item.idOnboarding || '').indexOf('DEMO-V046-') === 0;
  }) || null;

  let historicoApresentacaoValidado = false;
  let observacaoTecnicaOculta = true;

  if (perfilApresentacao) {
    const detalhesApresentacao = obterDetalhesOnboarding(
      perfilApresentacao.recordId
    );

    if (!detalhesApresentacao || !detalhesApresentacao.sucesso) {
      throw new Error(
        detalhesApresentacao && detalhesApresentacao.mensagem
          ? detalhesApresentacao.mensagem
          : 'Não foi possível validar um perfil da apresentação.'
      );
    }

    const textoHistorico = (detalhesApresentacao.historico || [])
      .map(function (item) {
        return [item.acao, item.mensagem, item.detalhesTecnicos]
          .join(' ')
          .toLocaleLowerCase('pt-BR');
      })
      .join(' ');

    historicoApresentacaoValidado =
      detalhesApresentacao.historico.length >= 1 &&
      textoHistorico.indexOf('base demonstrativa') === -1 &&
      textoHistorico.indexOf('base_demonstracao_v046') === -1;

    observacaoTecnicaOculta =
      !String(
        detalhesApresentacao.colaborador.observacoes || ''
      ).trim();
  }

  const fonteIndex = HtmlService
    .createHtmlOutputFromFile('Index')
    .getContent();
  const fonteScripts = HtmlService
    .createHtmlOutputFromFile('Scripts')
    .getContent();

  const controlesDemonstracaoRemovidos =
    fonteIndex.indexOf('generateDemoBaseButton') === -1 &&
    fonteIndex.indexOf('clearDemoBaseButton') === -1 &&
    fonteIndex.indexOf('demo-base-panel') === -1;

  const seloDemoRemovido =
    fonteScripts.indexOf('demo-record-badge') === -1;

  const acaoReabrirDisponivel =
    fonteScripts.indexOf('data-onboarding-action="reabrir"') >= 0 &&
    typeof alterarSituacaoOnboarding === 'function';

  if (
    !controlesDemonstracaoRemovidos ||
    !seloDemoRemovido ||
    !observacaoTecnicaOculta ||
    (perfilApresentacao && !historicoApresentacaoValidado) ||
    !acaoReabrirDisponivel
  ) {
    throw new Error(
      'A validação da v0.4.7 encontrou elementos técnicos expostos ou ações operacionais incompletas.'
    );
  }

  const resultado = {
    sucesso: true,
    versao: '0.4.7',
    colaboradores: dados.colaboradores.length,
    tarefas: Number(dados.indicadores.tarefasGeradas || 0),
    tarefasAtrasadas: Number(dados.indicadores.tarefasAtrasadas || 0),
    detalhesValidados: detalhesValidados,
    eventosNoHistorico: quantidadeHistorico,
    perfisDemonstracao: obterCatalogoBaseDemonstracaoV046_().length,
    geradorAdministrativoPreservado: typeof gerarBaseDemonstracaoV046 === 'function',
    limpezaAdministrativaPreservada: typeof limparBaseDemonstracaoV046 === 'function',
    controlesDemonstracaoNaInterface: !controlesDemonstracaoRemovidos,
    seloDemoNaListagem: !seloDemoRemovido,
    observacaoTecnicaNaInterface: !observacaoTecnicaOculta,
    historicoApresentacaoValidado: historicoApresentacaoValidado,
    acaoReabrirDisponivel: acaoReabrirDisponivel,
    mensagem: 'Central operacional v0.4.7 validada em modo somente leitura, com base persistida, histórico operacional e controles técnicos removidos da interface pública.'
  };

  console.log(JSON.stringify(resultado, null, 2));
  return resultado;
}


/**
 * Alias de compatibilidade para quem ainda selecionar o teste da v0.4.6.
 *
 * @return {Object} Resultado atualizado da validação.
 */
function testarCentralOperacionalV046() {
  return testarCentralOperacionalV047();
}


/**
 * Alias de compatibilidade para quem ainda selecionar o teste da v0.4.5.
 *
 * @return {Object} Resultado atualizado da validação.
 */
function testarCentralOperacionalV045() {
  return testarCentralOperacionalV047();
}


/**
 * Alias de compatibilidade para quem ainda selecionar o teste da v0.4.4.
 *
 * @return {Object} Resultado atualizado da validação.
 */
function testarCentralOperacionalV044() {
  return testarCentralOperacionalV047();
}

/**
 * Alias de compatibilidade para quem ainda selecionar o teste da v0.4.3.
 *
 * @return {Object} Resultado atualizado da validação.
 */
function testarCentralOperacionalV043() {
  return testarCentralOperacionalV047();
}

/**
 * Alias de compatibilidade para quem ainda selecionar o teste da v0.4.2.
 *
 * @return {Object} Resultado atualizado da validação.
 */
function testarCentralOperacionalV042() {
  return testarCentralOperacionalV044();
}

/**
 * Alias de compatibilidade para quem ainda selecionar o teste da v0.4.1.
 *
 * @return {Object} Resultado atualizado da validação.
 */
function testarCentralOperacionalV041() {
  return testarCentralOperacionalV044();
}

/**
 * Alias de compatibilidade para quem ainda selecionar o teste da v0.4.0.
 *
 * @return {Object} Resultado atualizado da validação.
 */
function testarCentralOperacionalV040() {
  return testarCentralOperacionalV044();
}
