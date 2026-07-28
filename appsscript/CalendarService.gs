/**
 * Serviço de integração com o Google Agenda.
 *
 * A agenda utilizada pelo projeto é definida na propriedade:
 * GOOGLE_CALENDAR_ID
 */

/**
 * Obtém o ID da agenda exclusiva do OnboardFlow.
 *
 * @return {string} ID da agenda.
 */
function getGoogleCalendarId_() {
  const properties =
    PropertiesService.getScriptProperties();

  const calendarId =
    properties.getProperty('GOOGLE_CALENDAR_ID');

  if (!calendarId || !calendarId.trim()) {
    throw new Error(
      'A propriedade GOOGLE_CALENDAR_ID não foi configurada.'
    );
  }

  return calendarId.trim();
}

/**
 * Retorna a agenda compartilhada utilizada pelo projeto.
 *
 * @return {Calendar} Agenda do OnboardFlow.
 */
function getAgendaOnboardFlow_() {
  const calendarId = getGoogleCalendarId_();

  const agenda =
    CalendarApp.getCalendarById(calendarId);

  if (!agenda) {
    throw new Error(
      'A agenda do OnboardFlow não foi localizada. ' +
      'Verifique o ID, o compartilhamento e as permissões.'
    );
  }

  return agenda;
}

/**
 * Verifica se a conta executora consegue localizar
 * a agenda compartilhada.
 *
 * Este teste não cria, altera nem exclui eventos.
 *
 * @return {Object} Informações básicas da agenda.
 */
function testarAcessoAgendaCompartilhada() {
  const agenda = getAgendaOnboardFlow_();

  const resultado = {
    sucesso: true,
    nome: agenda.getName(),
    fusoHorario: agenda.getTimeZone(),
    agendaPrincipal:
      agenda.isMyPrimaryCalendar(),
    proprietarioDaAgenda:
      agenda.isOwnedByMe()
  };

  console.log(
    'Agenda compartilhada localizada com sucesso.'
  );

  console.log(
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}

/**
 * Localiza o colaborador de teste criado mais recentemente.
 *
 * @return {Object} Registro do colaborador no Airtable.
 */
function buscarColaboradorTesteParaAgenda_() {
  const config = getAirtableConfig_();

  const resposta = airtableRequest_(
    config.tabelaColaboradores,
    {
      method: 'get',
      query: {
        filterByFormula:
          'LEFT({Nome}, 17)="Colaborador Teste"',

        'sort[0][field]':
          'Criado em',

        'sort[0][direction]':
          'desc',

        maxRecords: 1,
        pageSize: 1
      }
    }
  );

  const registros = resposta.records || [];

  if (registros.length === 0) {
    throw new Error(
      'Nenhum colaborador de teste foi encontrado no Airtable.'
    );
  }

  return registros[0];
}

/**
 * Converte uma data yyyy-MM-dd em um horário local.
 *
 * O projeto está configurado com o fuso America/Sao_Paulo.
 *
 * @param {string} dataIso Data do Airtable.
 * @param {number} hora Hora do evento.
 * @param {number} minuto Minuto do evento.
 * @return {Date} Data e horário.
 */
function criarDataHoraEvento_(
  dataIso,
  hora,
  minuto
) {
  const dataTexto =
    String(dataIso || '').substring(0, 10);

  const partes = dataTexto
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
    throw new Error(
      'Data de admissão inválida: ' + dataIso
    );
  }

  const data = new Date(
    partes[0],
    partes[1] - 1,
    partes[2],
    hora,
    minuto,
    0,
    0
  );

  if (isNaN(data.getTime())) {
    throw new Error(
      'Não foi possível interpretar a data do evento.'
    );
  }

  return data;
}

/**
 * Atualiza o colaborador depois da criação do evento.
 *
 * @param {string} recordId Record ID do colaborador.
 * @param {string} eventoId Identificador do evento.
 */
function atualizarEventoNoColaborador_(
  recordId,
  eventoId
) {
  const config = getAirtableConfig_();

  airtableRequest_(
    config.tabelaColaboradores,
    {
      method: 'patch',
      payload: {
        records: [
          {
            id: recordId,
            fields: {
              'Evento de Integração Criado': true,
              'ID do Evento no Calendar': eventoId
            }
          }
        ],
        typecast: false
      }
    }
  );
}

/**
 * Cria o evento de integração na agenda compartilhada.
 *
 * @param {Object} registro Registro do colaborador.
 * @return {Object} Resultado da operação.
 */
function criarEventoIntegracaoAgenda_(
  registro
) {
  const fields = registro.fields || {};

  const nome =
    String(fields.Nome || '').trim();

  const cargo =
    String(fields.Cargo || '').trim();

  const departamento =
    String(fields.Departamento || '').trim();

  const lider =
    String(
      fields['Líder Responsável'] || ''
    ).trim();

  const dataAdmissao =
    fields['Data de Admissão'];

  const idOnboarding =
    fields['ID Onboarding'] || '';

  if (!nome) {
    throw new Error(
      'O colaborador não possui nome.'
    );
  }

  if (!dataAdmissao) {
    throw new Error(
      'O colaborador não possui data de admissão.'
    );
  }

  /*
   * Evita criar o evento novamente caso a função
   * seja executada mais de uma vez.
   */
  if (
    fields['Evento de Integração Criado'] &&
    fields['ID do Evento no Calendar']
  ) {
    return {
      sucesso: true,
      jaExistia: true,
      colaborador: nome,
      eventoId:
        fields['ID do Evento no Calendar'],
      mensagem:
        'O colaborador já possui um evento de integração.'
    };
  }

  const agenda = getAgendaOnboardFlow_();

  const inicio = criarDataHoraEvento_(
    dataAdmissao,
    9,
    0
  );

  const fim = new Date(
    inicio.getTime() + 60 * 60 * 1000
  );

  const titulo =
    'Integração OnboardFlow - ' + nome;

  const descricao = [
    'Integração institucional do OnboardFlow.',
    '',
    'Colaborador: ' + nome,
    'Cargo: ' + cargo,
    'Departamento: ' + departamento,
    'Líder responsável: ' + lider,
    'ID do onboarding: ' + idOnboarding,
    '',
    'Evento criado automaticamente pela integração',
    'entre Google Apps Script, Google Agenda e Airtable.',
    '',
    'Projeto acadêmico com dados fictícios.'
  ].join('\n');

  const evento = agenda.createEvent(
    titulo,
    inicio,
    fim,
    {
      description: descricao,
      location: 'Sala de Integração'
    }
  );

  if (!evento) {
    throw new Error(
      'O Google Agenda não retornou o evento criado.'
    );
  }

  const eventoId = evento.getId();

  if (!eventoId) {
    throw new Error(
      'O Google Agenda não retornou o identificador do evento.'
    );
  }

  /*
   * Caso a atualização do Airtable falhe,
   * o evento é removido para evitar duplicidade.
   */
  try {
    atualizarEventoNoColaborador_(
      registro.id,
      eventoId
    );
  } catch (error) {
    try {
      evento.deleteEvent();
    } catch (erroExclusao) {
      console.error(
        'Não foi possível remover o evento após a falha: ' +
        erroExclusao.message
      );
    }

    throw error;
  }

  Utilities.sleep(250);

  registrarAutomacao_({
    acao:
      'Evento de integração criado no Google Agenda',

    tipo:
      'Evento no Calendar',

    resultado:
      'Sucesso',

    mensagem:
      'Evento de integração criado para ' +
      nome +
      ' em ' +
      dataAdmissao +
      ', das 09:00 às 10:00.',

    identificadorExterno:
      eventoId,

    colaboradorRecordId:
      registro.id,

    detalhesTecnicos:
      'Agenda: ' +
      agenda.getName() +
      '. ID do onboarding: ' +
      idOnboarding +
      '.'
  });

  return {
    sucesso: true,
    jaExistia: false,
    colaborador: nome,
    agenda: agenda.getName(),
    eventoId: eventoId,
    data: String(dataAdmissao).substring(0, 10),
    inicio: '09:00',
    fim: '10:00',
    conviteEnviado: false
  };
}

/**
 * Testa a criação do evento para o colaborador
 * fictício cadastrado anteriormente.
 *
 * A função possui proteção contra duplicidade.
 *
 * @return {Object} Resultado do teste.
 */
function testarCriacaoEventoAgendaCompartilhada() {
  const colaborador =
    buscarColaboradorTesteParaAgenda_();

  const resultado =
    criarEventoIntegracaoAgenda_(
      colaborador
    );

  console.log(
    'Teste de criação do evento concluído.'
  );

  console.log(
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}
