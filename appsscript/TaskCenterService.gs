/**
 * Central de Tarefas e Fluxo de Onboarding.
 *
 * Versão 0.5.2.
 *
 * Responsabilidades:
 * - consultar tarefas e colaboradores em lote;
 * - consolidar tarefas equivalentes por etapa do checklist;
 * - classificar as etapas em macrofases do onboarding;
 * - calcular indicadores operacionais;
 * - fornecer dados para a nova aba Tarefas.
 */

const ONBOARDFLOW_TASK_PHASES_V052 = Object.freeze([
  {
    id: 'cadastro',
    nome: 'Cadastro',
    descricao: 'Registro do colaborador e definição da liderança.',
    icone: 'fa-address-card',
    ordem: 1
  },
  {
    id: 'preparacao',
    nome: 'Preparação',
    descricao: 'Documentos, acessos, benefícios e equipamentos.',
    icone: 'fa-screwdriver-wrench',
    ordem: 2
  },
  {
    id: 'integracao',
    nome: 'Integração',
    descricao: 'Recepção, apresentação institucional e treinamentos.',
    icone: 'fa-people-group',
    ordem: 3
  },
  {
    id: 'acompanhamento',
    nome: 'Acompanhamento',
    descricao: 'Validações, primeira semana e feedbacks.',
    icone: 'fa-chart-line',
    ordem: 4
  },
  {
    id: 'conclusao',
    nome: 'Conclusão',
    descricao: 'Finalização das tarefas e encerramento do onboarding.',
    icone: 'fa-circle-check',
    ordem: 5
  }
]);

/**
 * Mapeamento determinístico das 25 etapas atualmente configuradas.
 *
 * A Central de Tarefas utiliza este mapa antes das heurísticas para impedir
 * que tarefas específicas de departamento sejam classificadas como conclusão
 * apenas por possuírem uma ordem alta no checklist.
 */
const ONBOARDFLOW_TASK_PHASE_BY_TITLE_V052 = Object.freeze({
  'validar documentacao admissional': 'cadastro',
  'cadastrar beneficios': 'preparacao',
  'orientar sobre registro de ponto': 'preparacao',
  'preparar equipamento de trabalho': 'preparacao',
  'criar conta institucional': 'preparacao',
  'configurar acessos aos sistemas': 'preparacao',
  'registrar patrimonio entregue': 'preparacao',
  'apresentar equipe e espacos': 'integracao',
  'explicar rotina e responsabilidades': 'integracao',
  'definir objetivos iniciais': 'integracao',
  'participar da integracao institucional': 'integracao',
  'validar acessos recebidos': 'acompanhamento',
  'ler politicas internas': 'integracao',
  'concluir treinamentos iniciais': 'integracao',
  'realizar acompanhamento da primeira semana': 'acompanhamento',
  'registrar feedback de 30 dias': 'conclusao',
  'apresentar diretrizes pedagogicas': 'integracao',
  'apresentar fluxos administrativos': 'integracao',
  'apresentar politicas de pessoas e confidencialidade': 'integracao',
  'apresentar politicas de seguranca da informacao': 'integracao',
  'apresentar controles e aprovacoes financeiras': 'integracao',
  'apresentar identidade visual e fluxo de aprovacao': 'integracao',
  'apresentar rotinas de atendimento e registros': 'integracao',
  'apresentar procedimentos de seguranca operacional': 'integracao',
  'apresentar procedimentos de controle de acesso': 'integracao'
});


/**
 * Normaliza textos utilizados para comparação e agrupamento.
 * O texto original continua sendo preservado para exibição.
 *
 * @param {*} valor Texto original.
 * @return {string} Texto normalizado.
 */
function normalizarTextoCentralTarefasV052_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Retorna a configuração de uma macrofase pelo identificador.
 *
 * @param {string} faseId Identificador da fase.
 * @return {Object} Configuração da fase.
 */
function obterFaseCentralTarefasV052_(faseId) {
  const encontrada = ONBOARDFLOW_TASK_PHASES_V052.filter(
    function (fase) {
      return fase.id === faseId;
    }
  )[0];

  return encontrada || ONBOARDFLOW_TASK_PHASES_V052[3];
}

/**
 * Verifica se um texto contém uma das expressões informadas.
 *
 * @param {string} texto Texto já normalizado.
 * @param {Array<string>} termos Termos procurados.
 * @return {boolean} Resultado.
 */
function contemTermoCentralTarefasV052_(texto, termos) {
  return termos.some(function (termo) {
    return texto.indexOf(termo) >= 0;
  });
}

/**
 * Classifica uma tarefa em uma macrofase do onboarding.
 *
 * A classificação utiliza primeiro o mapa determinístico das etapas,
 * depois palavras-chave e, por último, a ordem do checklist como fallback.
 * A regra permanece centralizada para evitar divergências entre telas.
 *
 * @param {Object} tarefa Tarefa normalizada.
 * @return {Object} Configuração da fase.
 */
function classificarFaseTarefaV052_(tarefa) {
  const tituloNormalizado = normalizarTextoCentralTarefasV052_(tarefa.titulo);
  const faseMapeada = ONBOARDFLOW_TASK_PHASE_BY_TITLE_V052[tituloNormalizado];

  if (faseMapeada) {
    return obterFaseCentralTarefasV052_(faseMapeada);
  }

  const texto = normalizarTextoCentralTarefasV052_([
    tarefa.titulo,
    tarefa.categoria,
    tarefa.areaResponsavel,
    tarefa.observacoes
  ].join(' '));

  const ordem = Number(tarefa.ordem || 0);

  /*
   * Heurísticas usadas somente para tarefas novas, ainda não incluídas no
   * mapa determinístico. As regras específicas têm prioridade sobre a ordem.
   */
  if (
    contemTermoCentralTarefasV052_(texto, [
      'encerramento',
      'finalizacao',
      'finalizar onboarding',
      'conclusao do onboarding',
      'validacao final',
      'fechamento'
    ])
  ) {
    return obterFaseCentralTarefasV052_('conclusao');
  }

  if (
    contemTermoCentralTarefasV052_(texto, [
      'documentacao admissional',
      'admissao',
      'cadastrar colaborador',
      'cadastro do colaborador',
      'registro do colaborador',
      'dados cadastrais'
    ])
  ) {
    return obterFaseCentralTarefasV052_('cadastro');
  }

  if (
    contemTermoCentralTarefasV052_(texto, [
      'equipamento',
      'beneficio',
      'registro de ponto',
      'conta institucional',
      'criar conta',
      'acesso',
      'sistema',
      'credencial',
      'estrutura',
      'patrimonio',
      'e-mail institucional',
      'email institucional',
      'documentos complementares'
    ])
  ) {
    return obterFaseCentralTarefasV052_('preparacao');
  }

  if (
    contemTermoCentralTarefasV052_(texto, [
      'integracao',
      'boas-vindas',
      'boas vindas',
      'recepcao',
      'apresentacao',
      'apresentar',
      'politica interna',
      'politicas internas',
      'seguranca da informacao',
      'treinamento inicial',
      'treinamentos iniciais',
      'rotina e responsabilidades',
      'objetivos iniciais'
    ])
  ) {
    return obterFaseCentralTarefasV052_('integracao');
  }

  if (
    contemTermoCentralTarefasV052_(texto, [
      'acompanhamento',
      'feedback',
      'primeira semana',
      '30 dias',
      'trinta dias',
      'validar acesso',
      'validar estrutura',
      'atividade especifica',
      'tarefa especifica',
      'avaliacao inicial'
    ])
  ) {
    return obterFaseCentralTarefasV052_('acompanhamento');
  }

  /*
   * Fallback alinhado ao checklist atual:
   * 1 Cadastro; 2-7 Preparação; 8-11 e 13-14 Integração;
   * 12 e 15 Acompanhamento; 16 Conclusão; 17+ Integração departamental.
   */
  if (ordem === 1) {
    return obterFaseCentralTarefasV052_('cadastro');
  }

  if (ordem >= 2 && ordem <= 7) {
    return obterFaseCentralTarefasV052_('preparacao');
  }

  if ((ordem >= 8 && ordem <= 11) || (ordem >= 13 && ordem <= 14)) {
    return obterFaseCentralTarefasV052_('integracao');
  }

  if (ordem === 12 || ordem === 15) {
    return obterFaseCentralTarefasV052_('acompanhamento');
  }

  if (ordem === 16) {
    return obterFaseCentralTarefasV052_('conclusao');
  }

  if (ordem >= 17) {
    return obterFaseCentralTarefasV052_('integracao');
  }

  return obterFaseCentralTarefasV052_('acompanhamento');
}

/**
 * Cria uma chave determinística para agrupar tarefas equivalentes.
 *
 * @param {Object} tarefa Tarefa normalizada.
 * @return {string} Chave do grupo.
 */
function criarChaveGrupoTarefaV052_(tarefa) {
  return [
    String(Number(tarefa.ordem || 0)).padStart(3, '0'),
    normalizarTextoCentralTarefasV052_(tarefa.titulo),
    normalizarTextoCentralTarefasV052_(tarefa.categoria),
    normalizarTextoCentralTarefasV052_(tarefa.areaResponsavel)
  ].join('|');
}

/**
 * Converte o status técnico da tarefa para o texto exibido na central.
 *
 * @param {Object} tarefa Tarefa normalizada.
 * @return {string} Status exibido.
 */
function obterStatusTarefaCentralV052_(tarefa, processoCancelado) {
  if (tarefa.concluida) {
    return 'Concluída';
  }

  if (processoCancelado) {
    return 'Onboarding cancelado';
  }

  if (tarefa.emAndamento) {
    return 'Em andamento';
  }

  if (tarefa.ignorada) {
    return 'Não aplicável';
  }

  return 'Pendente';
}

/**
 * Calcula os totais de um conjunto de execuções de tarefas.
 *
 * @param {Array<Object>} execucoes Execuções relacionadas.
 * @return {Object} Resumo calculado.
 */
function calcularResumoExecucoesCentralV052_(execucoes) {
  const resumo = {
    total: 0,
    pendentes: 0,
    emAndamento: 0,
    concluidas: 0,
    atrasadas: 0,
    canceladas: 0,
    ignoradas: 0,
    progresso: 0
  };

  (execucoes || []).forEach(function (execucao) {
    resumo.total++;

    if (execucao.status === 'Concluída') {
      resumo.concluidas++;
    } else if (execucao.status === 'Em andamento') {
      resumo.emAndamento++;
    } else if (execucao.status === 'Onboarding cancelado') {
      resumo.canceladas++;
    } else if (execucao.status === 'Não aplicável') {
      resumo.ignoradas++;
    } else {
      resumo.pendentes++;
    }

    if (execucao.atrasada) {
      resumo.atrasadas++;
    }
  });

  const ativas = Math.max(0, resumo.total - resumo.ignoradas);
  resumo.progresso = ativas > 0
    ? Math.round((resumo.concluidas / ativas) * 100)
    : 0;

  return resumo;
}

/**
 * Retorna os dados consolidados da Central de Tarefas.
 *
 * A consulta utiliza somente duas leituras paginadas principais:
 * - Colaboradores;
 * - Tarefas.
 *
 * Nenhum e-mail, evento ou alteração é disparado por esta função.
 *
 * @return {Object} Dados completos da central.
 */
function obterCentralTarefasV052() {
  try {
    const config = getAirtableConfig_();

    const registrosColaboradores = listarTodosRegistrosGerenciamento_(
      config.tabelaColaboradores
    );

    const registrosTarefas = listarTodosRegistrosGerenciamento_(
      config.tabelaTarefas
    );

    const colaboradoresPorRecordId = {};

    registrosColaboradores.forEach(function (registro) {
      const colaborador = normalizarColaboradorInterface_(registro);
      colaboradoresPorRecordId[colaborador.recordId] = colaborador;
    });

    const gruposPorChave = {};
    const execucoesGlobais = [];
    const colaboradoresEnvolvidos = {};
    const colaboradoresAtivos = {};
    const colaboradoresCancelados = {};

    registrosTarefas.forEach(function (registro) {
      const tarefa = normalizarTarefaGerenciamento_(registro);
      const fase = classificarFaseTarefaV052_(tarefa);
      const chave = criarChaveGrupoTarefaV052_(tarefa);
      const relacionados = registro.fields && Array.isArray(registro.fields.Colaborador)
        ? registro.fields.Colaborador
        : [];

      if (!gruposPorChave[chave]) {
        gruposPorChave[chave] = {
          chave: chave,
          titulo: tarefa.titulo || 'Tarefa sem título',
          tituloNormalizado: normalizarTextoCentralTarefasV052_(tarefa.titulo),
          categoria: tarefa.categoria || 'Sem categoria',
          areaResponsavel: tarefa.areaResponsavel || 'Área não informada',
          fase: fase.id,
          faseNome: fase.nome,
          faseOrdem: fase.ordem,
          faseIcone: fase.icone,
          ordem: Number(tarefa.ordem || 0),
          obrigatoria: Boolean(tarefa.obrigatoria),
          colaboradores: []
        };
      }

      const idsRelacionados = relacionados.length > 0
        ? relacionados
        : [''];

      idsRelacionados.forEach(function (colaboradorRecordId) {
        const colaborador = colaboradoresPorRecordId[colaboradorRecordId] || {};
        const processoCancelado =
          normalizarTextoCentralTarefasV052_(colaborador.status) === 'cancelado';
        const statusTarefa = obterStatusTarefaCentralV052_(tarefa, processoCancelado);
        const atrasada = Boolean(tarefa.atrasada && !processoCancelado);

        const execucao = {
          tarefaRecordId: tarefa.recordId,
          colaboradorRecordId: colaboradorRecordId || '',
          nome: colaborador.nome || 'Colaborador não identificado',
          cargo: colaborador.cargo || '',
          departamento: colaborador.departamento || 'Não informado',
          statusOnboarding: colaborador.status || '',
          progressoOnboarding: Number(colaborador.progresso || 0),
          status: statusTarefa,
          prazo: tarefa.prazo || '',
          atrasada: atrasada,
          obrigatoria: Boolean(tarefa.obrigatoria),
          processoCancelado: processoCancelado,
          processoStatus: processoCancelado ? 'cancelled' : 'active',
          ordem: Number(tarefa.ordem || 0)
        };

        gruposPorChave[chave].colaboradores.push(execucao);
        execucoesGlobais.push(execucao);

        if (colaboradorRecordId) {
          colaboradoresEnvolvidos[colaboradorRecordId] = true;

          if (processoCancelado) {
            colaboradoresCancelados[colaboradorRecordId] = true;
          } else {
            colaboradoresAtivos[colaboradorRecordId] = true;
          }
        }
      });
    });

    const grupos = Object.keys(gruposPorChave).map(function (chave) {
      const grupo = gruposPorChave[chave];
      const resumo = calcularResumoExecucoesCentralV052_(grupo.colaboradores);

      grupo.total = resumo.total;
      grupo.pendentes = resumo.pendentes;
      grupo.emAndamento = resumo.emAndamento;
      grupo.concluidas = resumo.concluidas;
      grupo.atrasadas = resumo.atrasadas;
      grupo.canceladas = resumo.canceladas;
      grupo.ignoradas = resumo.ignoradas;
      grupo.progresso = resumo.progresso;

      grupo.colaboradores.sort(function (a, b) {
        const prioridade = {
          'Em andamento': 1,
          'Pendente': 2,
          'Concluída': 3,
          'Onboarding cancelado': 4,
          'Não aplicável': 5
        };

        const diferencaStatus =
          Number(prioridade[a.status] || 99) -
          Number(prioridade[b.status] || 99);

        if (diferencaStatus !== 0) {
          return diferencaStatus;
        }

        const diferencaPrazo = String(a.prazo || '9999')
          .localeCompare(String(b.prazo || '9999'));

        if (diferencaPrazo !== 0) {
          return diferencaPrazo;
        }

        return String(a.nome).localeCompare(String(b.nome), 'pt-BR');
      });

      return grupo;
    }).sort(function (a, b) {
      if (a.faseOrdem !== b.faseOrdem) {
        return a.faseOrdem - b.faseOrdem;
      }

      if (a.ordem !== b.ordem) {
        return a.ordem - b.ordem;
      }

      return String(a.titulo).localeCompare(String(b.titulo), 'pt-BR');
    });

    const fases = ONBOARDFLOW_TASK_PHASES_V052.map(function (fase) {
      const gruposDaFase = grupos.filter(function (grupo) {
        return grupo.fase === fase.id;
      });

      const execucoes = [];
      gruposDaFase.forEach(function (grupo) {
        grupo.colaboradores.forEach(function (execucao) {
          execucoes.push(execucao);
        });
      });

      const resumo = calcularResumoExecucoesCentralV052_(execucoes);

      return {
        id: fase.id,
        nome: fase.nome,
        descricao: fase.descricao,
        icone: fase.icone,
        ordem: fase.ordem,
        etapas: gruposDaFase.length,
        total: resumo.total,
        pendentes: resumo.pendentes,
        emAndamento: resumo.emAndamento,
        concluidas: resumo.concluidas,
        atrasadas: resumo.atrasadas,
        canceladas: resumo.canceladas,
        progresso: resumo.progresso
      };
    });

    const resumoGlobal = calcularResumoExecucoesCentralV052_(execucoesGlobais);

    const areas = {};
    const departamentos = {};

    grupos.forEach(function (grupo) {
      if (grupo.areaResponsavel) {
        areas[grupo.areaResponsavel] = true;
      }

      grupo.colaboradores.forEach(function (colaborador) {
        if (colaborador.departamento) {
          departamentos[colaborador.departamento] = true;
        }
      });
    });

    return {
      sucesso: true,
      versao: '0.5.2',
      resumo: {
        totalTarefas: resumoGlobal.total,
        etapasConsolidadas: grupos.length,
        pendentes: resumoGlobal.pendentes,
        emAndamento: resumoGlobal.emAndamento,
        concluidas: resumoGlobal.concluidas,
        atrasadas: resumoGlobal.atrasadas,
        canceladas: resumoGlobal.canceladas,
        colaboradores: Object.keys(colaboradoresEnvolvidos).length,
        colaboradoresAtivos: Object.keys(colaboradoresAtivos).length,
        colaboradoresCancelados: Object.keys(colaboradoresCancelados).length,
        progresso: resumoGlobal.progresso
      },
      fases: fases,
      grupos: grupos,
      opcoes: {
        areas: Object.keys(areas).sort(function (a, b) {
          return a.localeCompare(b, 'pt-BR');
        }),
        departamentos: Object.keys(departamentos).sort(function (a, b) {
          return a.localeCompare(b, 'pt-BR');
        }),
        fases: ONBOARDFLOW_TASK_PHASES_V052.map(function (fase) {
          return {
            id: fase.id,
            nome: fase.nome
          };
        })
      },
      geradoEm: new Date().toISOString()
    };
  } catch (error) {
    console.error(error.stack || error.message);

    return {
      sucesso: false,
      versao: '0.5.2',
      mensagem:
        'Não foi possível carregar a Central de Tarefas: ' +
        error.message
    };
  }
}

/**
 * Alias em inglês mantido para facilitar integrações futuras.
 *
 * @return {Object} Dados da central.
 */
function getTaskCenterData() {
  return obterCentralTarefasV052();
}

/**
 * Alias da versão anterior, mantido para compatibilidade com implantações
 * que ainda estejam carregando o HTML da v0.5.0 em cache.
 *
 * @return {Object} Dados da central.
 */
function obterCentralTarefasV051() {
  return obterCentralTarefasV052();
}

/**
 * Alias da v0.5.0 mantido para compatibilidade.
 *
 * @return {Object} Dados da central.
 */
function obterCentralTarefasV050() {
  return obterCentralTarefasV052();
}

/**
 * Teste somente de leitura da v0.5.2.
 *
 * Além dos totais, valida a classificação das etapas e garante que
 * tarefas de processos cancelados não sejam contabilizadas como pendentes.
 *
 * @return {Object} Resultado resumido.
 */
function testarCentralOperacionalV052() {
  const resultado = obterCentralTarefasV052();

  if (!resultado || !resultado.sucesso) {
    throw new Error(
      resultado && resultado.mensagem
        ? resultado.mensagem
        : 'A Central de Tarefas não retornou sucesso.'
    );
  }

  const validarFase = function (titulo, ordem, faseEsperada) {
    return classificarFaseTarefaV052_({
      titulo: titulo,
      categoria: '',
      areaResponsavel: '',
      observacoes: '',
      ordem: ordem
    }).id === faseEsperada;
  };

  const validacoesFase = {
    registroPontoPreparacao:
      validarFase('Orientar sobre registro de ponto', 3, 'preparacao'),
    identidadeVisualIntegracao:
      validarFase('Apresentar identidade visual e fluxo de aprovação', 22, 'integracao'),
    segurancaOperacionalIntegracao:
      validarFase('Apresentar procedimentos de segurança operacional', 24, 'integracao'),
    feedbackTrintaDiasConclusao:
      validarFase('Registrar feedback de 30 dias', 16, 'conclusao')
  };

  const fasesValidas = Object.keys(validacoesFase).every(function (chave) {
    return validacoesFase[chave];
  });

  const execucoesCanceladas = resultado.grupos.reduce(function (lista, grupo) {
    (grupo.colaboradores || []).forEach(function (execucao) {
      if (execucao.processoCancelado) {
        lista.push(execucao);
      }
    });
    return lista;
  }, []);

  const canceladosNaoViraramPendentes = execucoesCanceladas.every(function (execucao) {
    return execucao.status === 'Concluída' ||
      execucao.status === 'Onboarding cancelado' ||
      execucao.status === 'Não aplicável';
  });

  const totaisColaboradoresCoerentes =
    Number(resultado.resumo.colaboradoresAtivos || 0) +
    Number(resultado.resumo.colaboradoresCancelados || 0) ===
    Number(resultado.resumo.colaboradores || 0);

  const resumoTeste = {
    sucesso: true,
    versao: resultado.versao,
    totalTarefas: resultado.resumo.totalTarefas,
    etapasConsolidadas: resultado.resumo.etapasConsolidadas,
    colaboradores: resultado.resumo.colaboradores,
    fases: resultado.fases.length,
    gruposComColaboradores: resultado.grupos.filter(function (grupo) {
      return grupo.colaboradores.length > 0;
    }).length,
    classificacaoFases: validacoesFase,
    processos: {
      ativos: resultado.resumo.colaboradoresAtivos,
      cancelados: resultado.resumo.colaboradoresCancelados,
      tarefasCanceladas: resultado.resumo.canceladas,
      canceladosNaoContamComoPendentes: canceladosNaoViraramPendentes,
      totaisCoerentes: totaisColaboradoresCoerentes
    },
    detalhesValidados:
      resultado.fases.length === 5 &&
      resultado.grupos.length > 0 &&
      resultado.resumo.totalTarefas > 0 &&
      fasesValidas &&
      canceladosNaoViraramPendentes &&
      totaisColaboradoresCoerentes,
    mensagem:
      'Central de Tarefas v0.5.2 validada em modo somente leitura.'
  };

  if (!resumoTeste.detalhesValidados) {
    throw new Error(
      'A validação da v0.5.2 encontrou inconsistências na Central de Tarefas.'
    );
  }

  console.log(JSON.stringify(resumoTeste, null, 2));
  return resumoTeste;
}

/**
 * Alias do teste anterior, mantido para compatibilidade.
 *
 * @return {Object} Resultado resumido.
 */
function testarCentralOperacionalV051() {
  return testarCentralOperacionalV052();
}

/**
 * Alias do teste da v0.5.0, mantido para compatibilidade.
 *
 * @return {Object} Resultado resumido.
 */
function testarCentralOperacionalV050() {
  return testarCentralOperacionalV052();
}
