/**
 * Base demonstrativa do OnboardFlow.
 *
 * Catálogo administrativo criado na versão 0.4.6 e preservado na v0.4.7.
 * Os controles de geração e limpeza não são exibidos na interface pública.
 *
 * Responsabilidades:
 * - fornecer 20 perfis fictícios e realistas para apresentação;
 * - criar colaboradores, tarefas e histórico sem enviar e-mails reais;
 * - distribuir os registros entre departamentos e estados operacionais;
 * - permitir reexecução sem duplicar a base;
 * - remover exclusivamente os registros identificados como demonstração.
 */

const ONBOARDFLOW_DEMO_V046 = Object.freeze({
  versao: '0.4.6',
  prefixo: 'DEMO-V046-',
  marcador: '[BASE_DEMONSTRACAO_V046]',
  total: 20,
  cacheProgresso: 'ONBOARDFLOW_DEMO_V046_PROGRESS'
});

/**
 * Retorna o catálogo oficial de pessoas fictícias da demonstração.
 *
 * @return {Array<Object>} Perfis demonstrativos.
 */
function obterCatalogoBaseDemonstracaoV046_() {
  return [
    {
      codigo: '01', nome: 'Mariana Alves Rocha', email: 'mariana.rocha.demo@example.com',
      cargo: 'Analista de Recursos Humanos', departamento: 'Recursos Humanos',
      dataAdmissao: '2026-08-03', liderResponsavel: 'Simone Castro Almeida',
      emailLider: 'simone.almeida.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Pendente', progressoAlvo: 0,
      eventoCriado: true, emailEnviado: false
    },
    {
      codigo: '02', nome: 'Ricardo Mendes Costa', email: 'ricardo.costa.demo@example.com',
      cargo: 'Assistente de Departamento Pessoal', departamento: 'Recursos Humanos',
      dataAdmissao: '2026-08-10', liderResponsavel: 'Simone Castro Almeida',
      emailLider: 'simone.almeida.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 18,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '03', nome: 'Rafael Nogueira Martins', email: 'rafael.martins.demo@example.com',
      cargo: 'Analista de Suporte', departamento: 'Tecnologia da Informação',
      dataAdmissao: '2026-08-17', liderResponsavel: 'Marcelo Guimarães Lima',
      emailLider: 'marcelo.lima.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 41,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '04', nome: 'Camila Azevedo Santos', email: 'camila.santos.demo@example.com',
      cargo: 'Analista de Sistemas', departamento: 'Tecnologia da Informação',
      dataAdmissao: '2026-07-06', liderResponsavel: 'Marcelo Guimarães Lima',
      emailLider: 'marcelo.lima.demo@example.com', modalidade: 'Híbrido',
      tipoVinculo: 'CLT', status: 'Concluído', progressoAlvo: 100,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '05', nome: 'Bruno Ferreira Duarte', email: 'bruno.duarte.demo@example.com',
      cargo: 'Assistente Financeiro', departamento: 'Financeiro',
      dataAdmissao: '2026-08-24', liderResponsavel: 'Eduardo Martins Ribeiro',
      emailLider: 'eduardo.ribeiro.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Pendente', progressoAlvo: 0,
      eventoCriado: true, emailEnviado: false
    },
    {
      codigo: '06', nome: 'Juliana Monteiro Freitas', email: 'juliana.freitas.demo@example.com',
      cargo: 'Analista Financeira', departamento: 'Financeiro',
      dataAdmissao: '2026-08-31', liderResponsavel: 'Eduardo Martins Ribeiro',
      emailLider: 'eduardo.ribeiro.demo@example.com', modalidade: 'Híbrido',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 59,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '07', nome: 'Larissa Gomes Vieira', email: 'larissa.vieira.demo@example.com',
      cargo: 'Analista de Marketing', departamento: 'Marketing',
      dataAdmissao: '2026-08-12', liderResponsavel: 'Bianca Nascimento Prado',
      emailLider: 'bianca.prado.demo@example.com', modalidade: 'Híbrido',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 29,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '08', nome: 'Thiago Barros Teixeira', email: 'thiago.teixeira.demo@example.com',
      cargo: 'Designer Gráfico', departamento: 'Marketing',
      dataAdmissao: '2026-07-13', liderResponsavel: 'Bianca Nascimento Prado',
      emailLider: 'bianca.prado.demo@example.com', modalidade: 'Remoto',
      tipoVinculo: 'PJ', status: 'Concluído', progressoAlvo: 100,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '09', nome: 'Renata Cardoso Melo', email: 'renata.melo.demo@example.com',
      cargo: 'Assistente de Secretaria', departamento: 'Secretaria',
      dataAdmissao: '2026-09-08', liderResponsavel: 'Sônia Ribeiro Matos',
      emailLider: 'sonia.matos.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Pendente', progressoAlvo: 0,
      eventoCriado: false, emailEnviado: false
    },
    {
      codigo: '10', nome: 'Isabela Moraes Castro', email: 'isabela.castro.demo@example.com',
      cargo: 'Secretária Escolar', departamento: 'Secretaria',
      dataAdmissao: '2026-08-05', liderResponsavel: 'Sônia Ribeiro Matos',
      emailLider: 'sonia.matos.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 71,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '11', nome: 'André Luiz Prado', email: 'andre.prado.demo@example.com',
      cargo: 'Professor de Matemática', departamento: 'Pedagógico',
      dataAdmissao: '2026-08-18', liderResponsavel: 'Helena Duarte Campos',
      emailLider: 'helena.campos.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 35,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '12', nome: 'Beatriz Campos Tavares', email: 'beatriz.tavares.demo@example.com',
      cargo: 'Professora Polivalente', departamento: 'Pedagógico',
      dataAdmissao: '2026-07-08', liderResponsavel: 'Helena Duarte Campos',
      emailLider: 'helena.campos.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Concluído', progressoAlvo: 100,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '13', nome: 'Patrícia Peixoto Ramos', email: 'patricia.ramos.demo@example.com',
      cargo: 'Coordenadora Pedagógica', departamento: 'Pedagógico',
      dataAdmissao: '2026-07-01', liderResponsavel: 'Débora Almeida Nunes',
      emailLider: 'debora.nunes.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Concluído', progressoAlvo: 100,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '14', nome: 'Diego Amaral Batista', email: 'diego.batista.demo@example.com',
      cargo: 'Assistente Administrativo', departamento: 'Administrativo',
      dataAdmissao: '2026-08-07', liderResponsavel: 'Débora Almeida Nunes',
      emailLider: 'debora.nunes.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 82,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '15', nome: 'Helena Duarte Moreira', email: 'helena.moreira.demo@example.com',
      cargo: 'Analista Administrativa', departamento: 'Administrativo',
      dataAdmissao: '2026-08-14', liderResponsavel: 'Débora Almeida Nunes',
      emailLider: 'debora.nunes.demo@example.com', modalidade: 'Híbrido',
      tipoVinculo: 'Temporário', status: 'Cancelado', progressoAlvo: 24,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '16', nome: 'Marcos Vinícius Lacerda', email: 'marcos.lacerda.demo@example.com',
      cargo: 'Auxiliar de Manutenção', departamento: 'Manutenção',
      dataAdmissao: '2026-09-14', liderResponsavel: 'Roberto Freitas Moura',
      emailLider: 'roberto.moura.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'Terceirizado', status: 'Pendente', progressoAlvo: 0,
      eventoCriado: false, emailEnviado: true
    },
    {
      codigo: '17', nome: 'Paulo Henrique Nunes', email: 'paulo.nunes.demo@example.com',
      cargo: 'Técnico de Manutenção', departamento: 'Manutenção',
      dataAdmissao: '2026-08-21', liderResponsavel: 'Roberto Freitas Moura',
      emailLider: 'roberto.moura.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 53,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '18', nome: 'Eduardo Souza Pires', email: 'eduardo.pires.demo@example.com',
      cargo: 'Agente de Portaria', departamento: 'Portaria',
      dataAdmissao: '2026-08-11', liderResponsavel: 'Carlos Henrique Paiva',
      emailLider: 'carlos.paiva.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'Terceirizado', status: 'Cancelado', progressoAlvo: 47,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '19', nome: 'Aline Barbosa Farias', email: 'aline.farias.demo@example.com',
      cargo: 'Recepcionista', departamento: 'Portaria',
      dataAdmissao: '2026-08-28', liderResponsavel: 'Carlos Henrique Paiva',
      emailLider: 'carlos.paiva.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Em andamento', progressoAlvo: 12,
      eventoCriado: true, emailEnviado: true
    },
    {
      codigo: '20', nome: 'Carolina Fonseca Reis', email: 'carolina.reis.demo@example.com',
      cargo: 'Orientadora Educacional', departamento: 'Pedagógico',
      dataAdmissao: '2026-07-15', liderResponsavel: 'Helena Duarte Campos',
      emailLider: 'helena.campos.demo@example.com', modalidade: 'Presencial',
      tipoVinculo: 'CLT', status: 'Concluído', progressoAlvo: 100,
      eventoCriado: true, emailEnviado: true
    }
  ];
}

/**
 * Atualiza o estado consultado pela tela durante uma operação longa.
 *
 * @param {string} estado Estado da operação.
 * @param {string} titulo Título visível.
 * @param {string} mensagem Mensagem visível.
 * @param {number} percentual Percentual aproximado.
 */
function definirProgressoBaseDemonstracaoV046_(estado, titulo, mensagem, percentual) {
  const progresso = {
    estado: estado || 'idle',
    titulo: titulo || '',
    mensagem: mensagem || '',
    percentual: Math.max(0, Math.min(100, Number(percentual || 0))),
    atualizadoEm: new Date().toISOString()
  };

  CacheService.getScriptCache().put(
    ONBOARDFLOW_DEMO_V046.cacheProgresso,
    JSON.stringify(progresso),
    21600
  );
}

/**
 * Retorna o andamento da geração ou limpeza da base.
 *
 * @return {Object} Progresso atual.
 */
function obterProgressoBaseDemonstracaoV046() {
  const valor = CacheService.getScriptCache().get(
    ONBOARDFLOW_DEMO_V046.cacheProgresso
  );

  if (!valor) {
    return {
      estado: 'idle',
      titulo: 'Base demonstrativa',
      mensagem: 'Nenhuma operação em andamento.',
      percentual: 0
    };
  }

  try {
    return JSON.parse(valor);
  } catch (error) {
    return {
      estado: 'idle',
      titulo: 'Base demonstrativa',
      mensagem: 'Nenhuma operação em andamento.',
      percentual: 0
    };
  }
}

/**
 * Cria registros em lotes de até 10, conforme o limite do Airtable.
 *
 * @param {string} tabela Nome da tabela.
 * @param {Array<Object>} registros Registros no formato {fields:{}}.
 * @param {boolean=} typecast Permite conversão de tipos.
 * @return {Array<Object>} Registros criados.
 */
function criarRegistrosEmLotesDemoV046_(tabela, registros, typecast) {
  const criados = [];
  const tamanhoLote = 10;

  for (let indice = 0; indice < registros.length; indice += tamanhoLote) {
    const lote = registros.slice(indice, indice + tamanhoLote);
    const resposta = airtableRequest_(tabela, {
      method: 'post',
      payload: {
        records: lote,
        typecast: Boolean(typecast)
      }
    });

    (resposta.records || []).forEach(function (registro) {
      criados.push(registro);
    });

    if (indice + tamanhoLote < registros.length) {
      Utilities.sleep(240);
    }
  }

  if (criados.length !== registros.length) {
    throw new Error(
      'O Airtable retornou uma quantidade inesperada de registros. ' +
      'Esperado: ' + registros.length + '. Recebido: ' + criados.length + '.'
    );
  }

  return criados;
}

/**
 * Atualiza registros em lotes de até 10.
 *
 * @param {string} tabela Nome da tabela.
 * @param {Array<Object>} registros Registros no formato {id, fields}.
 * @return {Array<Object>} Registros atualizados.
 */
function atualizarRegistrosEmLotesDemoV046_(tabela, registros) {
  const atualizados = [];
  const tamanhoLote = 10;

  for (let indice = 0; indice < registros.length; indice += tamanhoLote) {
    const lote = registros.slice(indice, indice + tamanhoLote);
    const resposta = airtableRequest_(tabela, {
      method: 'patch',
      payload: {
        records: lote,
        typecast: false
      }
    });

    (resposta.records || []).forEach(function (registro) {
      atualizados.push(registro);
    });

    if (indice + tamanhoLote < registros.length) {
      Utilities.sleep(240);
    }
  }

  return atualizados;
}

/**
 * Exclui registros em lotes de até 10.
 *
 * @param {string} tabela Nome da tabela.
 * @param {Array<string>} recordIds Record IDs.
 * @return {number} Quantidade removida.
 */
function excluirRegistrosEmLotesDemoV046_(tabela, recordIds) {
  const ids = Array.isArray(recordIds) ? recordIds.filter(Boolean) : [];
  const tamanhoLote = 10;
  let removidos = 0;

  for (let indice = 0; indice < ids.length; indice += tamanhoLote) {
    const lote = ids.slice(indice, indice + tamanhoLote);
    const resposta = airtableRequest_(tabela, {
      method: 'delete',
      query: {
        'records[]': lote
      }
    });

    removidos += (resposta.records || []).filter(function (registro) {
      return Boolean(registro && registro.deleted);
    }).length;

    if (indice + tamanhoLote < ids.length) {
      Utilities.sleep(240);
    }
  }

  return removidos;
}

/**
 * Prepara campos e tarefas de um perfil com base nas configurações atuais.
 *
 * @param {Object} perfil Perfil demonstrativo.
 * @param {Array<Object>} configuracoes Configurações aplicáveis.
 * @return {Object} Planejamento do perfil.
 */
function planejarPerfilDemonstracaoV046_(perfil, configuracoes) {
  const totalTarefas = configuracoes.length;

  if (!totalTarefas) {
    throw new Error(
      'Nenhuma tarefa ativa foi encontrada para o departamento ' +
      perfil.departamento + '.'
    );
  }

  let concluidas = perfil.status === 'Concluído'
    ? totalTarefas
    : Math.round((Number(perfil.progressoAlvo || 0) / 100) * totalTarefas);

  concluidas = Math.max(0, Math.min(totalTarefas, concluidas));

  if (perfil.status === 'Em andamento' && concluidas >= totalTarefas) {
    concluidas = Math.max(0, totalTarefas - 1);
  }

  if (perfil.status === 'Pendente') {
    concluidas = 0;
  }

  const progressoReal = totalTarefas > 0
    ? Math.round((concluidas / totalTarefas) * 100)
    : 0;

  return {
    perfil: perfil,
    configuracoes: configuracoes,
    totalTarefas: totalTarefas,
    concluidas: concluidas,
    progressoReal: progressoReal
  };
}

/**
 * Monta uma tarefa demonstrativa com estado operacional coerente.
 *
 * @param {Object} planejamento Planejamento do colaborador.
 * @param {Object} configuracao Configuração da tarefa.
 * @param {number} indice Índice da tarefa.
 * @param {string} colaboradorRecordId Record ID do colaborador.
 * @return {Object} Registro pronto para criação.
 */
function montarTarefaDemonstracaoV046_(planejamento, configuracao, indice, colaboradorRecordId) {
  const perfil = planejamento.perfil;
  const camposConfiguracao = configuracao.fields || {};
  let status = 'Pendente';

  if (indice < planejamento.concluidas) {
    status = 'Concluída';
  } else if (
    perfil.status === 'Em andamento' &&
    indice === planejamento.concluidas
  ) {
    status = 'Em andamento';
  }

  const fields = {
    'Título': camposConfiguracao['Tarefa Padrão'],
    'ID Tarefa': 'DEMO-TSK-' + perfil.codigo + '-' + String(indice + 1).padStart(2, '0'),
    'Colaborador': [colaboradorRecordId],
    'Área Responsável': camposConfiguracao['Área Responsável'],
    'Categoria': camposConfiguracao.Categoria,
    'Prazo': adicionarDias_(perfil.dataAdmissao, camposConfiguracao['Dias para Conclusão']),
    'Status': status,
    'Obrigatória': Boolean(camposConfiguracao['Obrigatória']),
    'Ordem': Number(camposConfiguracao.Ordem || 0),
    'Observações': String(camposConfiguracao.Orientações || '') +
      (camposConfiguracao.Orientações ? ' ' : '') +
      ONBOARDFLOW_DEMO_V046.marcador
  };

  if (status === 'Concluída') {
    fields['Concluída em'] = new Date(
      Date.UTC(2026, 6, Math.min(28, 8 + Number(perfil.codigo) + indice), 13, 0, 0)
    ).toISOString();
  }

  return { fields: fields };
}

/**
 * Monta os campos do colaborador demonstrativo.
 *
 * @param {Object} planejamento Planejamento do perfil.
 * @return {Object} Campos do Airtable.
 */
function montarCamposColaboradorDemonstracaoV046_(planejamento) {
  const perfil = planejamento.perfil;

  return {
    'Nome': perfil.nome,
    'ID Onboarding': ONBOARDFLOW_DEMO_V046.prefixo + perfil.codigo,
    'Email': perfil.email,
    'Cargo': perfil.cargo,
    'Departamento': perfil.departamento,
    'Data de Admissão': perfil.dataAdmissao,
    'Líder Responsável': perfil.liderResponsavel,
    'Email do Líder': perfil.emailLider,
    'Modalidade': perfil.modalidade,
    'Tipo de Vínculo': perfil.tipoVinculo,
    'Status': perfil.status,
    'Progresso': planejamento.progressoReal / 100,
    'Email de Boas-vindas Enviado': Boolean(perfil.emailEnviado),
    'Evento de Integração Criado': Boolean(perfil.eventoCriado),
    'Observações':
      ONBOARDFLOW_DEMO_V046.marcador + ' ' +
      'Perfil fictício criado para apresentação. Os indicadores de e-mail e agenda ' +
      'deste lote são simulados e não disparam mensagens nem eventos reais.'
  };
}

/**
 * Gera ou completa a base demonstrativa com 20 colaboradores.
 *
 * @return {Object} Resumo da operação.
 */
function gerarBaseDemonstracaoV046() {
  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(5000)) {
      throw new Error('Já existe uma operação de demonstração em andamento.');
    }

    definirProgressoBaseDemonstracaoV046_(
      'running',
      'Preparando base demonstrativa',
      'Validando os perfis e as configurações do Airtable.',
      3
    );

    const config = getAirtableConfig_();
    const catalogo = obterCatalogoBaseDemonstracaoV046_();
    const departamentos = [];

    catalogo.forEach(function (perfil) {
      if (departamentos.indexOf(perfil.departamento) === -1) {
        departamentos.push(perfil.departamento);
      }
    });

    const configuracoesPorDepartamento = {};

    departamentos.forEach(function (departamento, indice) {
      definirProgressoBaseDemonstracaoV046_(
        'running',
        'Preparando checklists',
        'Carregando tarefas de ' + departamento + '.',
        5 + Math.round(((indice + 1) / departamentos.length) * 10)
      );

      configuracoesPorDepartamento[departamento] =
        buscarConfiguracoesOnboarding_(departamento);

      Utilities.sleep(180);
    });

    const planejamentos = catalogo.map(function (perfil) {
      return planejarPerfilDemonstracaoV046_(
        perfil,
        configuracoesPorDepartamento[perfil.departamento] || []
      );
    });

    const colaboradoresExistentes = listarTodosRegistrosGerenciamento_(
      config.tabelaColaboradores
    );

    const mapaColaboradores = {};

    colaboradoresExistentes.forEach(function (registro) {
      const idOnboarding = registro.fields
        ? registro.fields['ID Onboarding']
        : '';

      if (String(idOnboarding || '').indexOf(ONBOARDFLOW_DEMO_V046.prefixo) === 0) {
        mapaColaboradores[idOnboarding] = registro;
      }
    });

    const novosPlanejamentos = planejamentos.filter(function (planejamento) {
      const id = ONBOARDFLOW_DEMO_V046.prefixo + planejamento.perfil.codigo;
      return !mapaColaboradores[id];
    });

    if (novosPlanejamentos.length > 0) {
      definirProgressoBaseDemonstracaoV046_(
        'running',
        'Criando colaboradores',
        'Registrando ' + novosPlanejamentos.length + ' perfis fictícios no Airtable.',
        18
      );

      const registrosCriados = criarRegistrosEmLotesDemoV046_(
        config.tabelaColaboradores,
        novosPlanejamentos.map(function (planejamento) {
          return {
            fields: montarCamposColaboradorDemonstracaoV046_(planejamento)
          };
        }),
        false
      );

      registrosCriados.forEach(function (registro) {
        const idOnboarding = registro.fields['ID Onboarding'];
        mapaColaboradores[idOnboarding] = registro;
      });
    }

    const atualizacoesColaboradores = planejamentos.map(function (planejamento) {
      const id = ONBOARDFLOW_DEMO_V046.prefixo + planejamento.perfil.codigo;
      const registro = mapaColaboradores[id];

      if (!registro) {
        throw new Error('Não foi possível localizar o perfil ' + id + ' após a criação.');
      }

      return {
        id: registro.id,
        fields: montarCamposColaboradorDemonstracaoV046_(planejamento)
      };
    });

    atualizarRegistrosEmLotesDemoV046_(
      config.tabelaColaboradores,
      atualizacoesColaboradores
    );

    const tarefasExistentes = listarTodosRegistrosGerenciamento_(
      config.tabelaTarefas
    );

    const tarefasPorColaborador = {};

    tarefasExistentes.forEach(function (registro) {
      const relacionados = registro.fields && Array.isArray(registro.fields.Colaborador)
        ? registro.fields.Colaborador
        : [];

      relacionados.forEach(function (recordId) {
        if (!tarefasPorColaborador[recordId]) {
          tarefasPorColaborador[recordId] = [];
        }
        tarefasPorColaborador[recordId].push(registro);
      });
    });

    const logsParaCriar = [];
    let colaboradoresReparados = 0;

    planejamentos.forEach(function (planejamento, indicePerfil) {
      const idOnboarding = ONBOARDFLOW_DEMO_V046.prefixo + planejamento.perfil.codigo;
      const colaborador = mapaColaboradores[idOnboarding];
      const tarefasAtuais = tarefasPorColaborador[colaborador.id] || [];
      const concluidasAtuais = tarefasAtuais.filter(function (tarefa) {
        return normalizarTextoGerenciamento_(tarefa.fields && tarefa.fields.Status) === 'concluida';
      }).length;
      const emAndamentoAtuais = tarefasAtuais.filter(function (tarefa) {
        return normalizarTextoGerenciamento_(tarefa.fields && tarefa.fields.Status) === 'em andamento';
      }).length;
      const emAndamentoEsperadas = planejamento.perfil.status === 'Em andamento' ? 1 : 0;
      const precisaRecriar =
        tarefasAtuais.length !== planejamento.totalTarefas ||
        concluidasAtuais !== planejamento.concluidas ||
        emAndamentoAtuais !== emAndamentoEsperadas;

      definirProgressoBaseDemonstracaoV046_(
        'running',
        'Montando checklists',
        'Processando ' + planejamento.perfil.nome + ' (' + (indicePerfil + 1) + ' de ' + catalogo.length + ').',
        25 + Math.round(((indicePerfil + 1) / catalogo.length) * 60)
      );

      if (precisaRecriar) {
        if (tarefasAtuais.length > 0) {
          excluirRegistrosEmLotesDemoV046_(
            config.tabelaTarefas,
            tarefasAtuais.map(function (tarefa) { return tarefa.id; })
          );
          Utilities.sleep(180);
        }

        const tarefas = planejamento.configuracoes.map(function (configuracao, indiceTarefa) {
          return montarTarefaDemonstracaoV046_(
            planejamento,
            configuracao,
            indiceTarefa,
            colaborador.id
          );
        });

        criarRegistrosEmLotesDemoV046_(
          config.tabelaTarefas,
          tarefas,
          false
        );

        colaboradoresReparados++;

        logsParaCriar.push({
          fields: {
            'Ação': 'Base demonstrativa v0.4.6 preparada',
            'ID Automação': 'DEMO-AUT-' + planejamento.perfil.codigo + '-' + Utilities.getUuid(),
            'Tipo': 'Cadastro do colaborador',
            'Data e Hora': new Date().toISOString(),
            'Resultado': 'Sucesso',
            'Mensagem':
              'Perfil fictício criado com ' + planejamento.totalTarefas +
              ' tarefas e status inicial "' + planejamento.perfil.status + '".',
            'Identificador Externo': idOnboarding,
            'Detalhes Técnicos':
              ONBOARDFLOW_DEMO_V046.marcador +
              ' Integrações de e-mail e agenda simuladas para apresentação.',
            'Colaborador': [colaborador.id]
          }
        });
      }

      Utilities.sleep(150);
    });

    if (logsParaCriar.length > 0) {
      definirProgressoBaseDemonstracaoV046_(
        'running',
        'Registrando histórico',
        'Finalizando os registros de auditoria da base fictícia.',
        90
      );

      criarRegistrosEmLotesDemoV046_(
        config.tabelaAutomacoes,
        logsParaCriar,
        false
      );
    }

    definirProgressoBaseDemonstracaoV046_(
      'done',
      'Base demonstrativa pronta',
      'Os 20 perfis fictícios estão disponíveis para apresentação.',
      100
    );

    return {
      sucesso: true,
      versao: ONBOARDFLOW_DEMO_V046.versao,
      totalCatalogo: catalogo.length,
      criados: novosPlanejamentos.length,
      atualizados: planejamentos.length,
      checklistsPreparados: colaboradoresReparados,
      departamentos: departamentos.length,
      mensagem: novosPlanejamentos.length > 0 || colaboradoresReparados > 0
        ? 'Base demonstrativa criada com sucesso.'
        : 'A base demonstrativa já estava completa e foi validada.'
    };
  } catch (error) {
    definirProgressoBaseDemonstracaoV046_(
      'error',
      'Falha na base demonstrativa',
      error.message,
      0
    );

    console.error(error.stack || error.message);

    return {
      sucesso: false,
      mensagem: 'Não foi possível gerar a base demonstrativa: ' + error.message
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
 * Remove somente os registros pertencentes à base demonstrativa v0.4.6.
 *
 * @return {Object} Resumo da limpeza.
 */
function limparBaseDemonstracaoV046() {
  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(5000)) {
      throw new Error('Já existe uma operação de demonstração em andamento.');
    }

    definirProgressoBaseDemonstracaoV046_(
      'running',
      'Localizando base demonstrativa',
      'Identificando registros fictícios com segurança.',
      8
    );

    const config = getAirtableConfig_();
    const colaboradores = listarTodosRegistrosGerenciamento_(
      config.tabelaColaboradores
    ).filter(function (registro) {
      const id = registro.fields ? registro.fields['ID Onboarding'] : '';
      return String(id || '').indexOf(ONBOARDFLOW_DEMO_V046.prefixo) === 0;
    });

    if (colaboradores.length === 0) {
      definirProgressoBaseDemonstracaoV046_(
        'done',
        'Base demonstrativa vazia',
        'Nenhum perfil fictício foi encontrado.',
        100
      );

      return {
        sucesso: true,
        colaboradoresRemovidos: 0,
        tarefasRemovidas: 0,
        historicosRemovidos: 0,
        mensagem: 'Nenhum registro da base demonstrativa foi encontrado.'
      };
    }

    const idsColaboradores = colaboradores.map(function (registro) {
      return registro.id;
    });
    const mapaIds = {};

    idsColaboradores.forEach(function (id) {
      mapaIds[id] = true;
    });

    definirProgressoBaseDemonstracaoV046_(
      'running',
      'Removendo checklists',
      'Excluindo somente tarefas vinculadas aos perfis fictícios.',
      30
    );

    const tarefas = listarTodosRegistrosGerenciamento_(
      config.tabelaTarefas
    ).filter(function (registro) {
      const relacionados = registro.fields && Array.isArray(registro.fields.Colaborador)
        ? registro.fields.Colaborador
        : [];

      return relacionados.some(function (id) { return Boolean(mapaIds[id]); });
    });

    const tarefasRemovidas = excluirRegistrosEmLotesDemoV046_(
      config.tabelaTarefas,
      tarefas.map(function (registro) { return registro.id; })
    );

    definirProgressoBaseDemonstracaoV046_(
      'running',
      'Removendo histórico',
      'Limpando os registros de auditoria gerados para a apresentação.',
      62
    );

    const historicos = listarTodosRegistrosGerenciamento_(
      config.tabelaAutomacoes
    ).filter(function (registro) {
      const relacionados = registro.fields && Array.isArray(registro.fields.Colaborador)
        ? registro.fields.Colaborador
        : [];

      return relacionados.some(function (id) { return Boolean(mapaIds[id]); });
    });

    const historicosRemovidos = excluirRegistrosEmLotesDemoV046_(
      config.tabelaAutomacoes,
      historicos.map(function (registro) { return registro.id; })
    );

    definirProgressoBaseDemonstracaoV046_(
      'running',
      'Removendo colaboradores',
      'Concluindo a limpeza dos perfis fictícios.',
      88
    );

    const colaboradoresRemovidos = excluirRegistrosEmLotesDemoV046_(
      config.tabelaColaboradores,
      idsColaboradores
    );

    definirProgressoBaseDemonstracaoV046_(
      'done',
      'Base demonstrativa removida',
      'Os registros reais ou manuais foram preservados.',
      100
    );

    return {
      sucesso: true,
      colaboradoresRemovidos: colaboradoresRemovidos,
      tarefasRemovidas: tarefasRemovidas,
      historicosRemovidos: historicosRemovidos,
      mensagem: 'Base demonstrativa removida com segurança.'
    };
  } catch (error) {
    definirProgressoBaseDemonstracaoV046_(
      'error',
      'Falha ao limpar a base',
      error.message,
      0
    );

    console.error(error.stack || error.message);

    return {
      sucesso: false,
      mensagem: 'Não foi possível limpar a base demonstrativa: ' + error.message
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      // O bloqueio pode não ter sido obtido.
    }
  }
}
