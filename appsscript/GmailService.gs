/**
 * Serviço de integração com o Gmail.
 *
 * Responsabilidades:
 * - enviar o e-mail de boas-vindas;
 * - utilizar um destinatário de teste controlado;
 * - evitar envios duplicados;
 * - organizar o e-mail enviado em um marcador;
 * - atualizar o Airtable;
 * - registrar a automação.
 */

/**
 * Retorna as configurações utilizadas pelo Gmail.
 *
 * @return {Object} Configurações da integração.
 */
function getGmailConfig_() {
  const properties =
    PropertiesService.getScriptProperties();

  const destinatarioTeste =
    properties.getProperty(
      'ONBOARDFLOW_EMAIL_TESTE'
    );

  const nomeMarcador =
    properties.getProperty(
      'GMAIL_LABEL_ONBOARDFLOW'
    ) || 'OnboardFlow - Enviados';

  if (
    !destinatarioTeste ||
    !destinatarioTeste.trim()
  ) {
    throw new Error(
      'A propriedade ONBOARDFLOW_EMAIL_TESTE ' +
      'não foi configurada.'
    );
  }

  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      destinatarioTeste.trim()
    );

  if (!emailValido) {
    throw new Error(
      'O e-mail salvo em ONBOARDFLOW_EMAIL_TESTE ' +
      'não possui um formato válido.'
    );
  }

  return {
    destinatarioTeste:
      destinatarioTeste.trim(),

    nomeMarcador:
      nomeMarcador.trim()
  };
}

/**
 * Escapa conteúdo para utilização segura em HTML.
 *
 * @param {*} valor Valor original.
 * @return {string} Texto convertido.
 */
function escaparHtml_(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Mascara um endereço de e-mail para os registros técnicos.
 *
 * @param {string} email Endereço completo.
 * @return {string} Endereço parcialmente mascarado.
 */
function mascararEmail_(email) {
  const partes = String(email || '').split('@');

  if (partes.length !== 2) {
    return 'destinatário configurado';
  }

  const usuario = partes[0];
  const dominio = partes[1];

  const usuarioMascarado =
    usuario.length <= 2
      ? usuario.charAt(0) + '*'
      : usuario.substring(0, 2) +
        '*'.repeat(
          Math.min(usuario.length - 2, 6)
        );

  return usuarioMascarado + '@' + dominio;
}

/**
 * Retorna o marcador do projeto, criando-o quando necessário.
 *
 * @return {GmailLabel} Marcador do OnboardFlow.
 */
function getOrCreateGmailLabel_() {
  const config = getGmailConfig_();

  let marcador =
    GmailApp.getUserLabelByName(
      config.nomeMarcador
    );

  if (!marcador) {
    marcador =
      GmailApp.createLabel(
        config.nomeMarcador
      );
  }

  return marcador;
}

/**
 * Localiza o colaborador fictício criado mais recentemente.
 *
 * @return {Object} Registro do Airtable.
 */
function buscarColaboradorTesteParaEmail_() {
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
      'Nenhum colaborador de teste foi encontrado.'
    );
  }

  return registros[0];
}

/**
 * Atualiza o indicador de envio no Airtable.
 *
 * @param {string} recordId Record ID do colaborador.
 */
function atualizarEmailNoColaborador_(
  recordId
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
              'Email de Boas-vindas Enviado': true
            }
          }
        ],
        typecast: false
      }
    }
  );
}

/**
 * Procura no Gmail o e-mail enviado para um onboarding.
 *
 * @param {string} idOnboarding Identificador único.
 * @return {GmailThread|null} Conversa encontrada.
 */
function buscarThreadEmailOnboarding_(
  idOnboarding
) {
  const query =
    'in:sent subject:"' +
    idOnboarding +
    '"';

  const threads =
    GmailApp.search(query, 0, 5);

  return threads.length > 0
    ? threads[0]
    : null;
}

/**
 * Aguarda o Gmail indexar o e-mail recém-enviado.
 *
 * @param {string} idOnboarding Identificador único.
 * @return {GmailThread|null} Conversa encontrada.
 */
function aguardarThreadEmail_(
  idOnboarding
) {
  const tentativas = 6;

  for (
    let tentativa = 1;
    tentativa <= tentativas;
    tentativa++
  ) {
    const thread =
      buscarThreadEmailOnboarding_(
        idOnboarding
      );

    if (thread) {
      return thread;
    }

    Utilities.sleep(1500);
  }

  return null;
}

/**
 * Monta os conteúdos do e-mail.
 *
 * @param {Object} fields Campos do colaborador.
 * @return {Object} Assunto, texto e HTML.
 */
function montarEmailBoasVindas_(fields) {
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
    String(
      fields['Data de Admissão'] || ''
    ).substring(0, 10);

  const idOnboarding =
    String(
      fields['ID Onboarding'] || ''
    ).trim();

  const assunto =
    '[OnboardFlow] Boas-vindas - ' +
    nome +
    ' - ' +
    idOnboarding;

  const corpoTexto = [
    'Olá, ' + nome + '!',
    '',
    'Seja bem-vindo(a).',
    '',
    'Seu processo de onboarding foi iniciado.',
    '',
    'Cargo: ' + cargo,
    'Departamento: ' + departamento,
    'Data de admissão: ' + dataAdmissao,
    'Líder responsável: ' + lider,
    '',
    'Sua integração está agendada para a data de admissão,',
    'das 09:00 às 10:00, na Sala de Integração.',
    '',
    'ID do onboarding: ' + idOnboarding,
    '',
    'Esta é uma mensagem automática do projeto acadêmico',
    'OnboardFlow, utilizando dados fictícios.'
  ].join('\n');

  const corpoHtml =
    '<div style="' +
      'font-family:Arial,Helvetica,sans-serif;' +
      'max-width:640px;margin:0 auto;' +
      'color:#1f2937;' +
    '">' +

      '<div style="' +
        'background:#005490;' +
        'padding:24px;' +
        'border-radius:16px 16px 0 0;' +
        'color:#ffffff;' +
      '">' +
        '<h1 style="margin:0;font-size:28px;">' +
          'OnboardFlow' +
        '</h1>' +
        '<p style="margin:8px 0 0;">' +
          'Central Inteligente de Onboarding' +
        '</p>' +
      '</div>' +

      '<div style="' +
        'padding:28px;' +
        'border:1px solid #dbe3ea;' +
        'border-top:0;' +
        'border-radius:0 0 16px 16px;' +
      '">' +

        '<h2 style="margin-top:0;color:#005490;">' +
          'Olá, ' +
          escaparHtml_(nome) +
          '!' +
        '</h2>' +

        '<p>Seja bem-vindo(a). Seu processo de ' +
          'onboarding foi iniciado.</p>' +

        '<table style="' +
          'width:100%;border-collapse:collapse;' +
          'margin:22px 0;' +
        '">' +

          '<tr>' +
            '<td style="padding:9px;border-bottom:1px solid #e5e7eb;">' +
              '<strong>Cargo</strong>' +
            '</td>' +
            '<td style="padding:9px;border-bottom:1px solid #e5e7eb;">' +
              escaparHtml_(cargo) +
            '</td>' +
          '</tr>' +

          '<tr>' +
            '<td style="padding:9px;border-bottom:1px solid #e5e7eb;">' +
              '<strong>Departamento</strong>' +
            '</td>' +
            '<td style="padding:9px;border-bottom:1px solid #e5e7eb;">' +
              escaparHtml_(departamento) +
            '</td>' +
          '</tr>' +

          '<tr>' +
            '<td style="padding:9px;border-bottom:1px solid #e5e7eb;">' +
              '<strong>Data de admissão</strong>' +
            '</td>' +
            '<td style="padding:9px;border-bottom:1px solid #e5e7eb;">' +
              escaparHtml_(dataAdmissao) +
            '</td>' +
          '</tr>' +

          '<tr>' +
            '<td style="padding:9px;border-bottom:1px solid #e5e7eb;">' +
              '<strong>Líder responsável</strong>' +
            '</td>' +
            '<td style="padding:9px;border-bottom:1px solid #e5e7eb;">' +
              escaparHtml_(lider) +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<div style="' +
          'background:#eff6ff;' +
          'border-left:4px solid #005490;' +
          'padding:16px;' +
          'border-radius:8px;' +
          'margin:20px 0;' +
        '">' +
          '<strong>Integração institucional</strong>' +
          '<br>' +
          'Na data de admissão, das 09:00 às 10:00.' +
          '<br>' +
          'Local: Sala de Integração.' +
        '</div>' +

        '<p><strong>ID do onboarding:</strong> ' +
          escaparHtml_(idOnboarding) +
        '</p>' +

        '<p style="' +
          'margin-top:28px;' +
          'font-size:12px;' +
          'color:#64748b;' +
        '">' +
          'Mensagem automática do projeto acadêmico ' +
          'OnboardFlow. Os dados apresentados são fictícios.' +
        '</p>' +
      '</div>' +
    '</div>';

  return {
    assunto: assunto,
    corpoTexto: corpoTexto,
    corpoHtml: corpoHtml
  };
}

/**
 * Envia e organiza o e-mail de boas-vindas.
 *
 * @param {Object} registro Registro do colaborador.
 * @return {Object} Resultado da operação.
 */
function enviarEmailBoasVindas_(
  registro
) {
  const lock =
    LockService.getUserLock();

  lock.waitLock(30000);

  try {
    const gmailConfig =
      getGmailConfig_();

    const fields =
      registro.fields || {};

    const nome =
      String(fields.Nome || '').trim();

    const idOnboarding =
      String(
        fields['ID Onboarding'] || ''
      ).trim();

    if (!nome || !idOnboarding) {
      throw new Error(
        'O colaborador não possui nome ou ID de onboarding.'
      );
    }

    /*
     * Verifica se já existe uma mensagem enviada
     * com esse ID, evitando duplicidade.
     */
    let threadExistente =
      buscarThreadEmailOnboarding_(
        idOnboarding
      );

    if (
      fields['Email de Boas-vindas Enviado'] ||
      threadExistente
    ) {
      if (threadExistente) {
        const marcador =
          getOrCreateGmailLabel_();

        threadExistente.addLabel(
          marcador
        );
      }

      if (
        !fields[
          'Email de Boas-vindas Enviado'
        ]
      ) {
        atualizarEmailNoColaborador_(
          registro.id
        );
      }

      return {
        sucesso: true,
        jaEnviado: true,
        colaborador: nome,
        mensagem:
          'O e-mail de boas-vindas já havia sido enviado.'
      };
    }

    const email =
      montarEmailBoasVindas_(fields);

    GmailApp.sendEmail(
      gmailConfig.destinatarioTeste,
      email.assunto,
      email.corpoTexto,
      {
        htmlBody:
          email.corpoHtml,

        name:
          'OnboardFlow'
      }
    );

    const threadEnviada =
      aguardarThreadEmail_(
        idOnboarding
      );

    let marcadorAplicado = false;

    if (threadEnviada) {
      const marcador =
        getOrCreateGmailLabel_();

      threadEnviada.addLabel(
        marcador
      );

      marcadorAplicado = true;
    } else {
      console.warn(
        'O e-mail foi enviado, mas ainda não foi ' +
        'localizado para aplicação do marcador.'
      );
    }

    atualizarEmailNoColaborador_(
      registro.id
    );

    Utilities.sleep(250);

    registrarAutomacao_({
      acao:
        'Email de boas-vindas enviado',

      tipo:
        'Email de boas-vindas',

      resultado:
        'Sucesso',

      mensagem:
        'O e-mail de boas-vindas do colaborador ' +
        nome +
        ' foi enviado para o destinatário de teste.',

      identificadorExterno:
        idOnboarding,

      colaboradorRecordId:
        registro.id,

      detalhesTecnicos:
        'Destinatário: ' +
        mascararEmail_(
          gmailConfig.destinatarioTeste
        ) +
        '. Marcador aplicado: ' +
        marcadorAplicado +
        '.'
    });

    return {
      sucesso: true,
      jaEnviado: false,
      colaborador: nome,
      destinatario:
        mascararEmail_(
          gmailConfig.destinatarioTeste
        ),
      marcador:
        gmailConfig.nomeMarcador,
      marcadorAplicado:
        marcadorAplicado
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Testa o envio para o endereço configurado
 * em ONBOARDFLOW_EMAIL_TESTE.
 *
 * Execute somente uma vez.
 *
 * @return {Object} Resultado do teste.
 */
function testarEnvioEmailBoasVindas() {
  const colaborador =
    buscarColaboradorTesteParaEmail_();

  const resultado =
    enviarEmailBoasVindas_(
      colaborador
    );

  console.log(
    'Teste do Gmail concluído.'
  );

  console.log(
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}
