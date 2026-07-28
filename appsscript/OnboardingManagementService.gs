/**
 * Serviço de gestão e acompanhamento do onboarding.
 *
 * Versão 0.5.2.
 *
 * Responsabilidades:
 * - consultar colaborador, tarefas e histórico;
 * - calcular progresso e identificar atrasos;
 * - iniciar, concluir e reabrir tarefas;
 * - sincronizar o progresso e o status do onboarding;
 * - registrar as alterações no histórico;
 * - cancelar, reativar e reabrir processos com rastreabilidade.
 */

/**
 * Escapa um valor para utilização em fórmulas do Airtable.
 *
 * @param {*} valor Valor original.
 * @return {string} Valor escapado.
 */
function escaparFormulaGerenciamento_(valor) {
  return String(valor || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Valida minimamente um Record ID do Airtable.
 *
 * @param {string} recordId Identificador recebido.
 * @return {string} Record ID validado.
 */
function validarRecordIdGerenciamento_(recordId) {
  const valor = String(recordId || '').trim();

  if (!/^rec[A-Za-z0-9]{10,}$/.test(valor)) {
    throw new Error(
      'Record ID do Airtable inválido.'
    );
  }

  return valor;
}

/**
 * Lista todos os registros de uma tabela,
 * percorrendo as páginas retornadas pelo Airtable.
 *
 * @param {string} tabela Nome da tabela.
 * @param {Object=} queryInicial Parâmetros opcionais.
 * @return {Array<Object>} Todos os registros encontrados.
 */
function listarTodosRegistrosGerenciamento_(
  tabela,
  queryInicial
) {
  const registros = [];
  const queryBase = queryInicial || {};

  let offset = '';
  let quantidadePaginas = 0;

  do {
    const query = {};

    Object.keys(queryBase).forEach(
      function (chave) {
        query[chave] = queryBase[chave];
      }
    );

    query.pageSize = 100;

    if (offset) {
      query.offset = offset;
    }

    const resposta = airtableRequest_(
      tabela,
      {
        method: 'get',
        query: query
      }
    );

    const registrosDaPagina =
      resposta.records || [];

    registrosDaPagina.forEach(
      function (registro) {
        registros.push(registro);
      }
    );

    offset = resposta.offset || '';
    quantidadePaginas++;

    if (quantidadePaginas > 100) {
      throw new Error(
        'A consulta excedeu o limite de segurança de paginação.'
      );
    }

    if (offset) {
      Utilities.sleep(250);
    }
  } while (offset);

  return registros;
}

/**
 * Normaliza textos para comparações internas.
 *
 * @param {*} valor Texto original.
 * @return {string} Texto normalizado.
 */
function normalizarTextoGerenciamento_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Converte uma data ISO em uma data local.
 *
 * @param {*} valor Data recebida.
 * @return {Date|null} Data convertida.
 */
function converterDataLocalGerenciamento_(valor) {
  const texto =
    String(valor || '').substring(0, 10);

  if (!texto) {
    return null;
  }

  const partes = texto
    .split('-')
    .map(function (parte) {
      return Number(parte);
    });

  if (
    partes.length !== 3 ||
    !partes[0] ||
    !partes[1] ||
    !partes[2]
  ) {
    return null;
  }

  const data = new Date(
    partes[0],
    partes[1] - 1,
    partes[2],
    12,
    0,
    0,
    0
  );

  return isNaN(data.getTime())
    ? null
    : data;
}

/**
 * Verifica se uma tarefa está concluída.
 *
 * @param {string} status Status da tarefa.
 * @return {boolean} Resultado.
 */
function tarefaEstaConcluida_(status) {
  const valor =
    normalizarTextoGerenciamento_(status);

  return (
    valor === 'concluida' ||
    valor === 'concluido'
  );
}

/**
 * Verifica se uma tarefa não deve entrar
 * no cálculo do progresso.
 *
 * @param {string} status Status da tarefa.
 * @return {boolean} Resultado.
 */
function tarefaEstaIgnorada_(status) {
  const valor =
    normalizarTextoGerenciamento_(status);

  return (
    valor === 'cancelada' ||
    valor === 'cancelado' ||
    valor === 'nao aplicavel'
  );
}

/**
 * Verifica se uma tarefa está em andamento.
 *
 * @param {string} status Status da tarefa.
 * @return {boolean} Resultado.
 */
function tarefaEstaEmAndamento_(status) {
  return (
    normalizarTextoGerenciamento_(status) ===
    'em andamento'
  );
}

/**
 * Verifica se o prazo da tarefa está vencido.
 *
 * @param {*} prazo Data do prazo.
 * @param {string} status Status da tarefa.
 * @return {boolean} Resultado.
 */
function tarefaEstaAtrasada_(
  prazo,
  status
) {
  if (
    tarefaEstaConcluida_(status) ||
    tarefaEstaIgnorada_(status)
  ) {
    return false;
  }

  const dataPrazo =
    converterDataLocalGerenciamento_(prazo);

  if (!dataPrazo) {
    return false;
  }

  const hoje = new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  dataPrazo.setHours(
    0,
    0,
    0,
    0
  );

  return dataPrazo.getTime() < hoje.getTime();
}

/**
 * Normaliza uma tarefa recebida do Airtable.
 *
 * @param {Object} registro Registro original.
 * @return {Object} Tarefa normalizada.
 */
function normalizarTarefaGerenciamento_(
  registro
) {
  const fields = registro.fields || {};
  const status = fields.Status || 'Pendente';

  return {
    recordId:
      registro.id,

    titulo:
      fields['Título'] || '',

    idTarefa:
      fields['ID Tarefa'] || '',

    areaResponsavel:
      fields['Área Responsável'] || '',

    responsavel:
      fields.Responsável || '',

    emailResponsavel:
      fields['Email do Responsável'] || '',

    categoria:
      fields.Categoria || '',

    prazo:
      String(fields.Prazo || '')
        .substring(0, 10),

    status:
      status,

    obrigatoria:
      Boolean(fields['Obrigatória']),

    ordem:
      Number(fields.Ordem || 0),

    concluidaEm:
      fields['Concluída em'] || '',

    observacoes:
      fields.Observações || '',

    criadoEm:
      fields['Criado em'] || '',

    atualizadoEm:
      fields['Atualizado em'] || '',

    concluida:
      tarefaEstaConcluida_(status),

    ignorada:
      tarefaEstaIgnorada_(status),

    emAndamento:
      tarefaEstaEmAndamento_(status),

    atrasada:
      tarefaEstaAtrasada_(
        fields.Prazo,
        status
      )
  };
}

/**
 * Normaliza um registro do histórico.
 *
 * @param {Object} registro Registro original.
 * @return {Object} Histórico normalizado.
 */
function normalizarHistoricoGerenciamento_(
  registro
) {
  const fields = registro.fields || {};

  return {
    recordId:
      registro.id,

    acao:
      fields['Ação'] || '',

    idAutomacao:
      fields['ID Automação'] || '',

    tipo:
      fields.Tipo || '',

    dataHora:
      fields['Data e Hora'] || '',

    resultado:
      fields.Resultado || '',

    mensagem:
      fields.Mensagem || '',

    identificadorExterno:
      fields['Identificador Externo'] || '',

    detalhesTecnicos:
      fields['Detalhes Técnicos'] || '',

    criadoEm:
      fields['Criado em'] || ''
  };
}

/**
 * Busca o registro principal do colaborador.
 *
 * @param {string} recordId Record ID do colaborador.
 * @return {Object} Registro encontrado.
 */
function buscarColaboradorGerenciamento_(
  recordId
) {
  const config = getAirtableConfig_();

  const recordIdValidado =
    validarRecordIdGerenciamento_(recordId);

  const formula =
    'RECORD_ID()="' +
    escaparFormulaGerenciamento_(
      recordIdValidado
    ) +
    '"';

  const resposta = airtableRequest_(
    config.tabelaColaboradores,
    {
      method: 'get',
      query: {
        filterByFormula:
          formula,

        maxRecords:
          1,

        pageSize:
          1
      }
    }
  );

  const registros =
    resposta.records || [];

  if (registros.length === 0) {
    throw new Error(
      'O colaborador solicitado não foi encontrado.'
    );
  }

  return registros[0];
}

/**
 * Lista as tarefas vinculadas ao colaborador.
 *
 * O campo de relacionamento retornado pela API
 * contém os Record IDs relacionados.
 *
 * @param {string} colaboradorRecordId Record ID.
 * @return {Array<Object>} Tarefas normalizadas.
 */
function listarTarefasDoColaborador_(
  colaboradorRecordId
) {
  const config = getAirtableConfig_();

  const recordId =
    validarRecordIdGerenciamento_(
      colaboradorRecordId
    );

  const registros =
    listarTodosRegistrosGerenciamento_(
      config.tabelaTarefas
    );

  return registros
    .filter(function (registro) {
      const relacionados =
        registro.fields &&
        Array.isArray(
          registro.fields.Colaborador
        )
          ? registro.fields.Colaborador
          : [];

      return relacionados.indexOf(recordId) >= 0;
    })
    .map(normalizarTarefaGerenciamento_)
    .sort(function (tarefaA, tarefaB) {
      const ordemA =
        Number(tarefaA.ordem || 999999);

      const ordemB =
        Number(tarefaB.ordem || 999999);

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return String(tarefaA.titulo)
        .localeCompare(
          String(tarefaB.titulo),
          'pt-BR'
        );
    });
}

/**
 * Lista o histórico vinculado ao colaborador.
 *
 * @param {string} colaboradorRecordId Record ID.
 * @return {Array<Object>} Histórico normalizado.
 */
function listarHistoricoDoColaborador_(
  colaboradorRecordId
) {
  const config = getAirtableConfig_();

  const recordId =
    validarRecordIdGerenciamento_(
      colaboradorRecordId
    );

  const registros =
    listarTodosRegistrosGerenciamento_(
      config.tabelaAutomacoes
    );

  return registros
    .filter(function (registro) {
      const relacionados =
        registro.fields &&
        Array.isArray(
          registro.fields.Colaborador
        )
          ? registro.fields.Colaborador
          : [];

      return relacionados.indexOf(recordId) >= 0;
    })
    .map(normalizarHistoricoGerenciamento_)
    .sort(function (historicoA, historicoB) {
      const dataA = new Date(
        historicoA.dataHora ||
        historicoA.criadoEm ||
        0
      ).getTime();

      const dataB = new Date(
        historicoB.dataHora ||
        historicoB.criadoEm ||
        0
      ).getTime();

      return dataB - dataA;
    });
}

/**
 * Calcula o resumo operacional das tarefas.
 *
 * @param {Array<Object>} tarefas Tarefas normalizadas.
 * @param {string} statusAtual Status atual do colaborador.
 * @return {Object} Resumo calculado.
 */
function calcularResumoTarefasGerenciamento_(
  tarefas,
  statusAtual
) {
  const tarefasAtivas =
    tarefas.filter(function (tarefa) {
      return !tarefa.ignorada;
    });

  const tarefasConcluidas =
    tarefasAtivas.filter(function (tarefa) {
      return tarefa.concluida;
    });

  const tarefasEmAndamento =
    tarefasAtivas.filter(function (tarefa) {
      return tarefa.emAndamento;
    });

  const tarefasPendentes =
    tarefasAtivas.filter(function (tarefa) {
      return (
        !tarefa.concluida &&
        !tarefa.emAndamento
      );
    });

  const tarefasAtrasadas =
    tarefasAtivas.filter(function (tarefa) {
      return tarefa.atrasada;
    });

  const tarefasObrigatorias =
    tarefasAtivas.filter(function (tarefa) {
      return tarefa.obrigatoria;
    });

  const obrigatoriasConcluidas =
    tarefasObrigatorias.filter(
      function (tarefa) {
        return tarefa.concluida;
      }
    );

  const quantidadeAtivas =
    tarefasAtivas.length;

  const percentual =
    quantidadeAtivas > 0
      ? Math.round(
          (
            tarefasConcluidas.length /
            quantidadeAtivas
          ) * 100
        )
      : 0;

  const statusAtualNormalizado =
    normalizarTextoGerenciamento_(
      statusAtual
    );

  let statusSugerido = 'Pendente';

  if (
    statusAtualNormalizado ===
    'cancelado'
  ) {
    statusSugerido = 'Cancelado';
  } else if (
    quantidadeAtivas > 0 &&
    tarefasConcluidas.length ===
      quantidadeAtivas
  ) {
    statusSugerido = 'Concluído';
  } else if (
    tarefasConcluidas.length > 0 ||
    tarefasEmAndamento.length > 0
  ) {
    statusSugerido = 'Em andamento';
  }

  return {
    total:
      tarefas.length,

    ativas:
      quantidadeAtivas,

    concluidas:
      tarefasConcluidas.length,

    pendentes:
      tarefasPendentes.length,

    emAndamento:
      tarefasEmAndamento.length,

    atrasadas:
      tarefasAtrasadas.length,

    ignoradas:
      tarefas.length -
      tarefasAtivas.length,

    obrigatorias:
      tarefasObrigatorias.length,

    obrigatoriasConcluidas:
      obrigatoriasConcluidas.length,

    percentualCalculado:
      percentual,

    statusSugerido:
      statusSugerido
  };
}

/**
 * Normaliza os dados principais do colaborador.
 *
 * @param {Object} registro Registro original.
 * @return {Object} Colaborador normalizado.
 */
function normalizarColaboradorGerenciamento_(
  registro
) {
  const fields = registro.fields || {};

  let progressoAtual =
    Number(fields.Progresso || 0);

  if (
    isFinite(progressoAtual) &&
    progressoAtual <= 1
  ) {
    progressoAtual *= 100;
  }

  if (!isFinite(progressoAtual)) {
    progressoAtual = 0;
  }

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

    progressoAtual:
      Math.round(progressoAtual),

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

    eventoId:
      fields[
        'ID do Evento no Calendar'
      ] || '',

    observacoes:
      fields.Observações || '',

    criadoEm:
      fields['Criado em'] || '',

    atualizadoEm:
      fields['Atualizado em'] || ''
  };
}

/**
 * Identifica registros do lote de apresentação criado na v0.4.6.
 * A identificação permanece no Airtable, mas não é exposta na interface.
 *
 * @param {Object} colaborador Colaborador normalizado.
 * @return {boolean} Verdadeiro quando pertence ao lote de apresentação.
 */
function ehPerfilApresentacaoV047_(colaborador) {
  return String(
    colaborador && colaborador.idOnboarding
      ? colaborador.idOnboarding
      : ''
  ).indexOf('DEMO-V046-') === 0;
}

/**
 * Cria uma data ISO determinística para a linha do tempo de apresentação.
 *
 * @param {string} referencia Data de referência.
 * @param {number} minutos Minutos adicionados.
 * @return {string} Data em formato ISO.
 */
function criarDataHistoricoApresentacaoV047_(referencia, minutos) {
  const data = new Date(
    referencia || '2026-07-24T12:00:00.000Z'
  );

  const base = isNaN(data.getTime())
    ? new Date('2026-07-24T12:00:00.000Z')
    : data;

  return new Date(
    base.getTime() + Number(minutos || 0) * 60000
  ).toISOString();
}

/**
 * Monta um evento virtual compatível com o histórico da interface.
 * Nenhum registro é criado ou alterado no Airtable.
 *
 * @param {string} codigo Código interno.
 * @param {string} acao Ação exibida.
 * @param {string} tipo Tipo do evento.
 * @param {string} mensagem Descrição do evento.
 * @param {string} dataHora Data em ISO.
 * @return {Object} Evento normalizado.
 */
function criarEventoHistoricoApresentacaoV047_(
  codigo,
  acao,
  tipo,
  mensagem,
  dataHora
) {
  return {
    recordId: 'VIRTUAL-V047-' + codigo,
    acao: acao,
    idAutomacao: 'VIRTUAL-V047-' + codigo,
    tipo: tipo,
    dataHora: dataHora,
    resultado: 'Sucesso',
    mensagem: mensagem,
    identificadorExterno: '',
    detalhesTecnicos: '',
    criadoEm: dataHora,
    virtual: true
  };
}

/**
 * Converte o evento técnico da base em uma linha do tempo operacional
 * coerente com o status atual do perfil.
 *
 * @param {Object} colaborador Colaborador normalizado.
 * @param {Array<Object>} tarefas Tarefas do processo.
 * @param {Array<Object>} historico Histórico original do Airtable.
 * @return {Array<Object>} Histórico pronto para a interface.
 */
function prepararHistoricoApresentacaoV047_(
  colaborador,
  tarefas,
  historico
) {
  if (!ehPerfilApresentacaoV047_(colaborador)) {
    return historico;
  }

  const eventosOperacionais = (historico || []).filter(function (item) {
    const texto = [
      item.acao,
      item.mensagem,
      item.detalhesTecnicos,
      item.idAutomacao
    ].join(' ').toLocaleLowerCase('pt-BR');

    return (
      texto.indexOf('base demonstrativa') === -1 &&
      texto.indexOf('base_demonstracao_v046') === -1 &&
      texto.indexOf('demo-aut-') === -1
    );
  });

  const referencia =
    colaborador.criadoEm ||
    colaborador.atualizadoEm ||
    '2026-07-24T12:00:00.000Z';

  const totalTarefas = Array.isArray(tarefas)
    ? tarefas.length
    : 0;

  const status = normalizarTextoGerenciamento_(
    colaborador.status
  );

  const percentual = Math.max(
    0,
    Math.min(
      100,
      Number(colaborador.progressoAtual || 0)
    )
  );

  const eventos = [];
  const codigo = String(
    colaborador.idOnboarding ||
    colaborador.recordId ||
    'PERFIL'
  );

  eventos.push(
    criarEventoHistoricoApresentacaoV047_(
      codigo + '-CRIACAO',
      'Onboarding criado com ' + totalTarefas + ' tarefas',
      'Cadastro do colaborador',
      'Colaborador cadastrado e checklist de onboarding preparado.',
      criarDataHistoricoApresentacaoV047_(referencia, 0)
    )
  );

  if (colaborador.eventoCriado) {
    eventos.push(
      criarEventoHistoricoApresentacaoV047_(
        codigo + '-AGENDA',
        'Evento de integração criado no Google Agenda',
        'Criação de evento no calendário',
        'A agenda de integração foi registrada para acompanhamento do processo.',
        criarDataHistoricoApresentacaoV047_(referencia, 8)
      )
    );
  }

  if (colaborador.emailEnviado) {
    eventos.push(
      criarEventoHistoricoApresentacaoV047_(
        codigo + '-EMAIL',
        'E-mail de boas-vindas enviado',
        'Envio de e-mail',
        'A comunicação inicial do onboarding foi registrada como enviada.',
        criarDataHistoricoApresentacaoV047_(referencia, 12)
      )
    );
  }

  if (
    status === 'em andamento' ||
    status === 'concluido' ||
    status === 'cancelado' ||
    percentual > 0
  ) {
    eventos.push(
      criarEventoHistoricoApresentacaoV047_(
        codigo + '-EXECUCAO',
        'Checklist do onboarding iniciado',
        'Criação de tarefas',
        'As primeiras etapas foram iniciadas e o processo entrou em acompanhamento.',
        criarDataHistoricoApresentacaoV047_(referencia, 45)
      )
    );
  }

  if (percentual > 0 && status !== 'concluido') {
    eventos.push(
      criarEventoHistoricoApresentacaoV047_(
        codigo + '-PROGRESSO',
        'Progresso do onboarding atualizado para ' + percentual + '%',
        'Sincronização do processo',
        'O percentual foi recalculado com base nas tarefas concluídas.',
        criarDataHistoricoApresentacaoV047_(referencia, 75)
      )
    );
  }

  if (status === 'concluido') {
    eventos.push(
      criarEventoHistoricoApresentacaoV047_(
        codigo + '-CONCLUSAO',
        'Onboarding concluído',
        'Conclusão do processo',
        'Todas as tarefas ativas foram concluídas e o processo foi finalizado.',
        criarDataHistoricoApresentacaoV047_(referencia, 120)
      )
    );
  }

  if (status === 'cancelado') {
    eventos.push(
      criarEventoHistoricoApresentacaoV047_(
        codigo + '-CANCELAMENTO',
        'Onboarding cancelado',
        'Interrupção do processo',
        'O processo foi interrompido sem excluir tarefas, dados ou histórico.',
        criarDataHistoricoApresentacaoV047_(referencia, 120)
      )
    );
  }

  return eventos
    .concat(eventosOperacionais)
    .sort(function (eventoA, eventoB) {
      return new Date(
        eventoB.dataHora || 0
      ).getTime() - new Date(
        eventoA.dataHora || 0
      ).getTime();
    });
}

/**
 * Retorna todos os detalhes necessários
 * para o futuro modal de acompanhamento.
 *
 * Esta função poderá ser chamada pela interface.
 *
 * @param {string} recordId Record ID do colaborador.
 * @return {Object} Detalhes completos.
 */
function obterDetalhesOnboarding(recordId) {
  const registroColaborador =
    buscarColaboradorGerenciamento_(
      recordId
    );

  const colaborador =
    normalizarColaboradorGerenciamento_(
      registroColaborador
    );

  const tarefas =
    listarTarefasDoColaborador_(
      colaborador.recordId
    );

  const historicoOriginal =
    listarHistoricoDoColaborador_(
      colaborador.recordId
    );

  if (ehPerfilApresentacaoV047_(colaborador)) {
    colaborador.observacoes = '';
  }

  const historico =
    prepararHistoricoApresentacaoV047_(
      colaborador,
      tarefas,
      historicoOriginal
    );

  const resumo =
    calcularResumoTarefasGerenciamento_(
      tarefas,
      colaborador.status
    );

  resumo.progressoAtual =
    colaborador.progressoAtual;

  resumo.progressoDivergente =
    resumo.percentualCalculado !==
    colaborador.progressoAtual;

  resumo.statusAtual =
    colaborador.status;

  resumo.statusDivergente =
    resumo.statusSugerido !==
    colaborador.status;

  return {
    sucesso:
      true,

    colaborador:
      colaborador,

    resumo:
      resumo,

    tarefas:
      tarefas,

    historico:
      historico
  };
}

/**
 * Testa a consulta dos detalhes do onboarding
 * mais recentemente cadastrado.
 *
 * Esta função não altera nenhum registro.
 *
 * @return {Object} Resultado resumido.
 */
function testarDetalhesOnboarding() {
  const colaboradores =
    listarColaboradoresInterface_();

  if (colaboradores.length === 0) {
    throw new Error(
      'Nenhum colaborador foi encontrado para o teste.'
    );
  }

  const recordId =
    colaboradores[0].recordId;

  const resultado =
    obterDetalhesOnboarding(recordId);

  const retornoDoTeste = {
    sucesso:
      resultado.sucesso,

    colaborador:
      resultado.colaborador.nome,

    statusAtual:
      resultado.resumo.statusAtual,

    statusSugerido:
      resultado.resumo.statusSugerido,

    progressoAtual:
      resultado.resumo.progressoAtual,

    progressoCalculado:
      resultado.resumo.percentualCalculado,

    totalTarefas:
      resultado.resumo.total,

    tarefasAtivas:
      resultado.resumo.ativas,

    concluidas:
      resultado.resumo.concluidas,

    pendentes:
      resultado.resumo.pendentes,

    atrasadas:
      resultado.resumo.atrasadas,

    quantidadeHistorico:
      resultado.historico.length,

    primeiraTarefa:
      resultado.tarefas.length > 0
        ? resultado.tarefas[0].titulo
        : 'Nenhuma tarefa encontrada'
  };

  console.log(
    'Consulta de detalhes concluída com sucesso.'
  );

  console.log(
    JSON.stringify(
      retornoDoTeste,
      null,
      2
    )
  );

  return retornoDoTeste;
}

/**
 * Busca uma tarefa utilizando o Record ID do Airtable.
 *
 * @param {string} recordId Record ID da tarefa.
 * @return {Object} Registro completo da tarefa.
 */
function buscarTarefaGerenciamento_(recordId) {
  const config = getAirtableConfig_();

  const recordIdValidado =
    validarRecordIdGerenciamento_(recordId);

  const resposta = airtableRequest_(
    config.tabelaTarefas,
    {
      method: 'get',
      query: {
        filterByFormula:
          'RECORD_ID()="' +
          escaparFormulaGerenciamento_(
            recordIdValidado
          ) +
          '"',

        maxRecords: 1,
        pageSize: 1
      }
    }
  );

  const registros = resposta.records || [];

  if (registros.length === 0) {
    throw new Error(
      'A tarefa solicitada não foi encontrada.'
    );
  }

  return registros[0];
}

/**
 * Retorna o colaborador vinculado a uma tarefa.
 *
 * @param {Object} registroTarefa Registro da tarefa.
 * @return {string} Record ID do colaborador.
 */
function obterColaboradorDaTarefa_(
  registroTarefa
) {
  const fields =
    registroTarefa.fields || {};

  const relacionados =
    Array.isArray(fields.Colaborador)
      ? fields.Colaborador
      : [];

  if (relacionados.length !== 1) {
    throw new Error(
      'A tarefa não possui um único colaborador vinculado.'
    );
  }

  return validarRecordIdGerenciamento_(
    relacionados[0]
  );
}

/**
 * Atualiza um registro existente no Airtable.
 *
 * @param {string} tabela Nome da tabela.
 * @param {string} recordId Record ID do registro.
 * @param {Object} fields Campos que serão atualizados.
 * @return {Object} Registro atualizado.
 */
function atualizarRegistroGerenciamento_(
  tabela,
  recordId,
  fields
) {
  const recordIdValidado =
    validarRecordIdGerenciamento_(recordId);

  const resposta = airtableRequest_(
    tabela,
    {
      method: 'patch',
      payload: {
        records: [
          {
            id: recordIdValidado,
            fields: fields
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
      'O Airtable não retornou o registro atualizado.'
    );
  }

  return registro;
}

/**
 * Valida a transição solicitada para uma tarefa.
 *
 * Fluxo permitido:
 * Pendente -> Em andamento
 * Em andamento -> Concluída
 * Concluída -> Pendente
 *
 * @param {string} statusAtual Status atual.
 * @param {string} novoStatus Novo status.
 */
function validarTransicaoTarefa_(
  statusAtual,
  novoStatus
) {
  const atual =
    normalizarTextoGerenciamento_(
      statusAtual
    );

  const destino =
    normalizarTextoGerenciamento_(
      novoStatus
    );

  const transicoes = {
    pendente: [
      'em andamento'
    ],

    atrasada: [
      'em andamento'
    ],

    'em andamento': [
      'concluida'
    ],

    concluida: [
      'pendente'
    ],

    concluido: [
      'pendente'
    ]
  };

  const destinosPermitidos =
    transicoes[atual] || [];

  if (
    destinosPermitidos.indexOf(
      destino
    ) === -1
  ) {
    throw new Error(
      'Transição de tarefa não permitida: ' +
      '"' +
      String(statusAtual || '') +
      '" para "' +
      String(novoStatus || '') +
      '".'
    );
  }
}

/**
 * Atualiza o progresso e o status do colaborador.
 *
 * O campo Percent do Airtable recebe um valor
 * decimal entre 0 e 1.
 *
 * @param {string} colaboradorRecordId Record ID.
 * @param {Object} resumo Resumo calculado.
 * @return {Object} Registro atualizado.
 */
function atualizarResumoColaborador_(
  colaboradorRecordId,
  resumo
) {
  const config = getAirtableConfig_();

  const percentual =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          resumo.percentualCalculado || 0
        )
      )
    );

  return atualizarRegistroGerenciamento_(
    config.tabelaColaboradores,
    colaboradorRecordId,
    {
      'Progresso':
        percentual / 100,

      'Status':
        resumo.statusSugerido
    }
  );
}

/**
 * Retorna uma descrição amigável da ação executada.
 *
 * @param {string} novoStatus Novo status da tarefa.
 * @return {string} Ação no passado.
 */
function descreverAcaoTarefa_(novoStatus) {
  const status =
    normalizarTextoGerenciamento_(
      novoStatus
    );

  if (status === 'em andamento') {
    return 'iniciada';
  }

  if (status === 'concluida') {
    return 'concluída';
  }

  return 'reaberta';
}

/**
 * Atualiza o status de uma tarefa e recalcula
 * o onboarding completo.
 *
 * Esta função é chamada pela interface web.
 *
 * @param {string} taskRecordId Record ID da tarefa.
 * @param {string} novoStatus Novo status.
 * @return {Object} Detalhes atualizados do onboarding.
 */
function atualizarStatusTarefa(
  taskRecordId,
  novoStatus
) {
  const lock =
    LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const config = getAirtableConfig_();

    const registroTarefa =
      buscarTarefaGerenciamento_(
        taskRecordId
      );

    const fieldsTarefa =
      registroTarefa.fields || {};

    const colaboradorRecordId =
      obterColaboradorDaTarefa_(
        registroTarefa
      );

    const registroColaborador =
      buscarColaboradorGerenciamento_(
        colaboradorRecordId
      );

    const colaborador =
      normalizarColaboradorGerenciamento_(
        registroColaborador
      );

    if (
      normalizarTextoGerenciamento_(
        colaborador.status
      ) === 'cancelado'
    ) {
      throw new Error(
        'Não é possível alterar tarefas de um onboarding cancelado.'
      );
    }

    const statusAtual =
      fieldsTarefa.Status ||
      'Pendente';

    const statusDestino =
      String(novoStatus || '').trim();

    const statusPermitidos = [
      'Pendente',
      'Em andamento',
      'Concluída'
    ];

    if (
      statusPermitidos.indexOf(
        statusDestino
      ) === -1
    ) {
      throw new Error(
        'Status de tarefa inválido.'
      );
    }

    validarTransicaoTarefa_(
      statusAtual,
      statusDestino
    );

    const camposAtualizados = {
      'Status':
        statusDestino,

      'Concluída em':
        statusDestino === 'Concluída'
          ? new Date().toISOString()
          : null
    };

    atualizarRegistroGerenciamento_(
      config.tabelaTarefas,
      registroTarefa.id,
      camposAtualizados
    );

    Utilities.sleep(250);

    const tarefasAtualizadas =
      listarTarefasDoColaborador_(
        colaboradorRecordId
      );

    const resumoAtualizado =
      calcularResumoTarefasGerenciamento_(
        tarefasAtualizadas,
        colaborador.status
      );

    atualizarResumoColaborador_(
      colaboradorRecordId,
      resumoAtualizado
    );

    const acaoExecutada =
      descreverAcaoTarefa_(
        statusDestino
      );

    registrarAutomacao_({
      acao:
        'Tarefa "' +
        String(
          fieldsTarefa['Título'] ||
          'Sem título'
        ) +
        '" ' +
        acaoExecutada,

      tipo:
        'Criação de tarefas',

      resultado:
        'Sucesso',

      mensagem:
        'Status alterado de "' +
        statusAtual +
        '" para "' +
        statusDestino +
        '". Progresso atualizado para ' +
        resumoAtualizado.percentualCalculado +
        '%.',

      identificadorExterno:
        colaborador.idOnboarding,

      colaboradorRecordId:
        colaboradorRecordId,

      detalhesTecnicos:
        'Tarefa: ' +
        registroTarefa.id +
        '. Status anterior: ' +
        statusAtual +
        '. Novo status: ' +
        statusDestino +
        '.'
    });

    Utilities.sleep(250);

    const resultado =
      obterDetalhesOnboarding(
        colaboradorRecordId
      );

    resultado.mensagem =
      'Tarefa ' +
      acaoExecutada +
      ' com sucesso.';

    resultado.acao = {
      tarefaRecordId:
        registroTarefa.id,

      titulo:
        fieldsTarefa['Título'] || '',

      statusAnterior:
        statusAtual,

      novoStatus:
        statusDestino
    };

    return resultado;
  } catch (error) {
    console.error(
      error.stack || error.message
    );

    return {
      sucesso: false,
      mensagem:
        'Não foi possível atualizar a tarefa: ' +
        error.message
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      // O bloqueio pode não ter sido obtido.
    }
  }
}

/**
 * Cancela, reativa ou reabre um onboarding preservando o histórico.
 *
 * O cancelamento é não destrutivo: tarefas, evento e registros
 * permanecem disponíveis para auditoria e eventual reativação.
 * A reabertura de um processo concluído devolve a última tarefa
 * concluída ao status Pendente e recalcula o processo.
 *
 * @param {string} recordId Record ID do colaborador.
 * @param {string} acao Ação: cancelar, reativar ou reabrir.
 * @return {Object} Detalhes atualizados.
 */
function alterarSituacaoOnboarding(recordId, acao) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const acaoNormalizada =
      normalizarTextoGerenciamento_(acao);

    if (
      ['cancelar', 'reativar', 'reabrir']
        .indexOf(acaoNormalizada) === -1
    ) {
      throw new Error(
        'Ação de onboarding inválida.'
      );
    }

    const detalhes =
      obterDetalhesOnboarding(recordId);

    if (!detalhes.sucesso) {
      return detalhes;
    }

    const colaborador =
      detalhes.colaborador;

    const statusNormalizado =
      normalizarTextoGerenciamento_(
        colaborador.status
      );

    if (acaoNormalizada === 'cancelar') {
      if (statusNormalizado === 'cancelado') {
        detalhes.mensagem =
          'O onboarding já está cancelado.';
        return detalhes;
      }

      if (statusNormalizado === 'concluido') {
        throw new Error(
          'Um onboarding concluído deve ser reaberto antes de qualquer interrupção.'
        );
      }

      atualizarRegistroGerenciamento_(
        getAirtableConfig_().tabelaColaboradores,
        colaborador.recordId,
        {
          Status: 'Cancelado'
        }
      );

      registrarAutomacao_({
        acao: 'Onboarding cancelado',
        tipo: 'Criação de tarefas',
        resultado: 'Sucesso',
        mensagem:
          'O processo foi cancelado sem excluir tarefas, histórico ou integrações.',
        identificadorExterno:
          colaborador.idOnboarding,
        colaboradorRecordId:
          colaborador.recordId,
        detalhesTecnicos:
          'Cancelamento não destrutivo executado pela interface.'
      });
    } else if (
      acaoNormalizada === 'reativar'
    ) {
      if (statusNormalizado !== 'cancelado') {
        detalhes.mensagem =
          'O onboarding não está cancelado.';
        return detalhes;
      }

      const resumoReativado =
        calcularResumoTarefasGerenciamento_(
          detalhes.tarefas,
          'Pendente'
        );

      atualizarResumoColaborador_(
        colaborador.recordId,
        resumoReativado
      );

      registrarAutomacao_({
        acao: 'Onboarding reativado',
        tipo: 'Criação de tarefas',
        resultado: 'Sucesso',
        mensagem:
          'O processo foi reativado com status "' +
          resumoReativado.statusSugerido +
          '" e progresso de ' +
          resumoReativado.percentualCalculado +
          '%.',
        identificadorExterno:
          colaborador.idOnboarding,
        colaboradorRecordId:
          colaborador.recordId,
        detalhesTecnicos:
          'Reativação executada pela interface com recálculo das tarefas.'
      });
    } else {
      if (statusNormalizado !== 'concluido') {
        detalhes.mensagem =
          'Somente um onboarding concluído pode ser reaberto.';
        return detalhes;
      }

      const tarefasConcluidas =
        detalhes.tarefas
          .filter(function (tarefa) {
            return (
              tarefa.concluida &&
              !tarefa.ignorada
            );
          })
          .sort(function (tarefaA, tarefaB) {
            return (
              Number(tarefaB.ordem || 0) -
              Number(tarefaA.ordem || 0)
            );
          });

      if (tarefasConcluidas.length === 0) {
        throw new Error(
          'Nenhuma tarefa concluída foi encontrada para reabertura.'
        );
      }

      const tarefaReaberta =
        tarefasConcluidas[0];

      atualizarRegistroGerenciamento_(
        getAirtableConfig_().tabelaTarefas,
        tarefaReaberta.recordId,
        {
          Status: 'Pendente',
          'Concluída em': null
        }
      );

      Utilities.sleep(250);

      const tarefasAtualizadas =
        listarTarefasDoColaborador_(
          colaborador.recordId
        );

      const resumoReaberto =
        calcularResumoTarefasGerenciamento_(
          tarefasAtualizadas,
          'Pendente'
        );

      atualizarResumoColaborador_(
        colaborador.recordId,
        resumoReaberto
      );

      registrarAutomacao_({
        acao: 'Onboarding reaberto',
        tipo: 'Criação de tarefas',
        resultado: 'Sucesso',
        mensagem:
          'A tarefa "' +
          tarefaReaberta.titulo +
          '" foi reaberta. O processo retornou ao status "' +
          resumoReaberto.statusSugerido +
          '" com progresso de ' +
          resumoReaberto.percentualCalculado +
          '%.',
        identificadorExterno:
          colaborador.idOnboarding,
        colaboradorRecordId:
          colaborador.recordId,
        detalhesTecnicos:
          'Reabertura do processo executada pela interface. Tarefa: ' +
          tarefaReaberta.recordId + '.'
      });
    }

    Utilities.sleep(250);

    const resultado =
      obterDetalhesOnboarding(recordId);

    resultado.mensagem =
      acaoNormalizada === 'cancelar'
        ? 'Onboarding cancelado com sucesso.'
        : acaoNormalizada === 'reabrir'
          ? 'Onboarding reaberto com sucesso.'
          : 'Onboarding reativado com sucesso.';

    return resultado;
  } catch (error) {
    console.error(
      error.stack || error.message
    );

    return {
      sucesso: false,
      mensagem:
        'Não foi possível alterar o onboarding: ' +
        error.message
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      // O bloqueio pode não ter sido obtido.
    }
  }
}

/**
 * Sincroniza o status e o progresso armazenados
 * com o cálculo atual das tarefas.
 *
 * Esta função é útil para registros criados
 * antes da versão 0.3.2.
 *
 * @param {string} recordId Record ID do colaborador.
 * @return {Object} Detalhes atualizados.
 */
function sincronizarOnboarding(recordId) {
  const lock =
    LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const detalhes =
      obterDetalhesOnboarding(
        recordId
      );

    if (!detalhes.sucesso) {
      return detalhes;
    }

    const precisaAtualizar =
      detalhes.resumo.progressoDivergente ||
      detalhes.resumo.statusDivergente;

    if (precisaAtualizar) {
      atualizarResumoColaborador_(
        detalhes.colaborador.recordId,
        detalhes.resumo
      );

      registrarAutomacao_({
        acao:
          'Status e progresso do onboarding sincronizados',

        tipo:
          'Criação de tarefas',

        resultado:
          'Sucesso',

        mensagem:
          'O status foi ajustado para "' +
          detalhes.resumo.statusSugerido +
          '" e o progresso para ' +
          detalhes.resumo.percentualCalculado +
          '%.',

        identificadorExterno:
          detalhes.colaborador.idOnboarding,

        colaboradorRecordId:
          detalhes.colaborador.recordId,

        detalhesTecnicos:
          'Sincronização manual executada pela interface.'
      });

      Utilities.sleep(250);
    }

    const resultado =
      obterDetalhesOnboarding(
        recordId
      );

    resultado.mensagem =
      precisaAtualizar
        ? 'Status e progresso sincronizados.'
        : 'O onboarding já estava sincronizado.';

    return resultado;
  } catch (error) {
    console.error(
      error.stack || error.message
    );

    return {
      sucesso: false,
      mensagem:
        'Não foi possível sincronizar o onboarding: ' +
        error.message
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      // O bloqueio pode não ter sido obtido.
    }
  }
}

