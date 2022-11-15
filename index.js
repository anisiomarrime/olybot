const express = require('express');
const { WebhookClient } = require('dialogflow-fulfillment');
const rp = require('request-promise');
const OpenWeatherMapHelper = require('openweathermap-node');
const cheerio = require('cheerio');
const admin = require("firebase-admin");
const app = express()

const serviceAccount = {
  "type": "service_account",
  "project_id": "olygran-91adf",
  "private_key_id": "d642df9bbac8576eaa346acd3ea1e3557769e772",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwBd9apg78Ssxu\ndHp+CafX05P7kHFzhRfp++Fp8LBioE3zkb1dwWXszzxflfk4YDOLkcF6654T0ZNQ\nI3J5lsnUcJEryAPU6YVmU6xEtRFJYY3NFKnLCJq3vnYLAy3m/Oejd+XPyjyi3/Zg\nfGctTmEOQCA8ObjkOmoe8vw4pGLAg3cKvpW4G25jixAgM6Hsi9iHrLDUcety68C5\nQl+8hXf0FSPKgXnHSipOIzPApzV7Q9SG0LBItmVPBjo0bhrtVtsEXwumXdZZGJs4\n+WUQ43YuKQumSHiKNjLoonOS82JZm8EbQQp6y5TuP+BD60/eByUIkZoM2t88QdoY\nxrK90EVBAgMBAAECggEAQ/PAaeo5VsQ5b1qf/xATL4qKUk9MvN/gf3+xYYh9T1W7\nQhA9HniOtIC8OdpXv5/Dxlmaa62R9OyvBfzpMG85sz1RjalFcWhFC1+53TxZVA7J\nAya69Zp4v/5S66VqjwWLFtwuZ60XA3maT103J5JefXXb++P8sH6sgQ4kuGkdhluU\nlleCKwhAfar2RuGLwdOgVQz4BeQz9dT0mPgrCMR/himjodLX+AxeNsj5Z5v3tkMN\nDi4/EuC1oR3tKw7cAbJq4KsYh0uCKP9O6D6+qR8cqM6DTE5IraU3dRxiCgF7ld/T\npJp7MkUhzRBX2kTAU0jBSDSoh5K19uKhYEPSK7lqUQKBgQD0DEHvARFJZe6Sj7iV\nmGAjEeX4a4ZxQteG4yPmE7okh7i4BBLI/A/oL2sh6kF3ZijI6gaGQ7/jps4Qiqoy\nIWaGdtWFc1+qY1lr6Q2oiS2zCgmneKzikukSl1/W0pb8bI3yhhWsKrpD2Y5BvBJP\nbEma/K3eBr0kH7JRJVhmrCulZwKBgQC4pMEg6/Sd8u5981IaGK4DpkqyOpMQCyg8\ncqAdSZp4biur+Qpq5+uiYGBmgPuV1BNxbvB7CZ6hsbw/bakf9R36v+hiRjfAftvh\nzvP2u8hSa8VBBJdd1DDdL/3vnl4Kn1llylTGkSWiVL4yjyra4j9/G9Eb3V2+5mZp\nEX270rWvFwKBgQDAhXruBLWSZWsTC3Xd7VrJz7DPjGN+rfBAZKdJNX6+mqLJ58y5\n6L7Tt7SYCKikfF7oQFXtTTzvZgNhYUJqUZcDtHM015M8YyuDyVIRBkaa2uxKxRP9\nmU9sbyYX3gFmGGzSSZyHOR2/sLxcdvUq2o4mSfcPE9nZyXduNDvMoz27OQKBgFJ/\nupLdGmTgQFMiPpLOaCHVURalOUQ31/h6NrQfSNd6UiT6lv8BNLVOXoQuKTrekPlj\n2ir/N1ODuFqWwrQ2rvh0en4+ZXaqt9ACydp6OJ0q7e2JAaC4yERrxwgjOF2CqUzj\nxFEcVTZcqsaoVTuLT1eZtCrBE7vR8fwMBqO/F9JtAoGACurQEFvTOIQyTRJtrHge\nk1HWa36SokfOGwouqaCzLDBWjdXlPzKMm8DrtKK9CydUUvyJAQ0JP0kKAhCKjLW0\nnKuCW1LYelkV6TPsFyr36CKCQAZoKvQ4/ZPPLQYSB/kuUkT9Loj0yoXr1mi7hr0v\nr57snp96ogw73rG8MbKPAYk=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-sasxh@olygran-91adf.iam.gserviceaccount.com",
  "client_id": "117449330761195738147",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-sasxh%40olygran-91adf.iam.gserviceaccount.com"
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://olygran-91adf.firebaseio.com"
});

app.get('/', (req, res) => res.send('online'))

app.post('/dialogflow', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })
  const dbref = admin.database().ref().child("oly-service");

  function cambio() {
    var options = {
      method: 'GET',
      url: 'https://currency-exchange.p.rapidapi.com/exchange',
      qs: { q: 1, from: agent.parameters['from'], to: agent.parameters['to'] },
      headers: {
        'x-rapidapi-host': 'currency-exchange.p.rapidapi.com',
        'x-rapidapi-key': '31bf17fe7amsh7ff82356fd46c14p143f26jsn3aa9c1d53b19',
        useQueryString: true
      }
    };

    return rp(options)
      .then(function (body) {
        let total = parseFloat(body) * parseFloat(agent.parameters['montante'])
        let saida = '*Conversor de Moeda* 💱💰'
          + "\n\n1.0 " + agent.parameters['from'] + ' = ' + body + ' ' + agent.parameters['to']
          + "\n\n" + agent.parameters['montante'].toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ' + agent.parameters['from'] + ' = *' + total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ' + agent.parameters['to'] + '*'

        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "rate": 1 });
        } catch (err) { }

        agent.add(saida);
      }).catch(function (err) {
        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "rate": 0 });
        } catch (err) { }

        agent.add('Não foi possível fazer a conversão desejada, por favor tente novamente.');
      });
  }

  function love_calc() {
    var options = {
      method: 'GET',
      url: 'https://love-calculator.p.rapidapi.com/getPercentage',
      qs: { fname: agent.parameters['f_name'], sname: agent.parameters['s_name'] },
      headers: {
        'x-rapidapi-host': 'love-calculator.p.rapidapi.com',
        'x-rapidapi-key': '31bf17fe7amsh7ff82356fd46c14p143f26jsn3aa9c1d53b19',
        useQueryString: true
      }
    };

    return rp(options)
      .then(function (body) {
        let resultado = JSON.parse(body)
        let saida = '*hhCalculadora do Amor* 💘👩‍❤‍💋‍👨'
          + "\n\n*" + agent.parameters['f_name'] + '* e *' + agent.parameters['s_name'] + '*'
          + "\n\Resultado: *" + resultado["percentage"] + '%* 💗'
          + "\n\n";

        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "lovecalculator": 1 });
        } catch (err) { }

        return rp({ "uri": "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=" + resultado["result"], json: true })
          .then(function (response) {
            var trad = response[0][0][0]
            try {
              var trad = trad + response[0][1][0]
            } catch (e) { }

            agent.add(saida + trad);

          })
          .catch(function (err) {
            agent.add(saida + resultado["result"])
          });

      }).catch(function (err) {
        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "lovecalculator": 0 });
        } catch (err) { }
        agent.add('Não foi possível calcular o Amor, por favor tente novamente.');
      });
  }

  function covid() {
    agent.add('Por favor aguarde um instante!🔄');
    return rp('https://www.worldometers.info/coronavirus/')
      .then(function (htmlString) {
        const $ = cheerio.load(htmlString)
        let confirmed = $('div.maincounter-number span').text().trim();
        let active = $('div.number-table-main').text().trim();

        let saida = '*TOTAL DE CASOS CONFIRMADOS (A NÍVEL MUNDIAL 😷🌍):* ' + confirmed.substring(0, 9) + "\n"
          + "\n" + '*🔘Casos Activos:* ' + active.substring(0, 9)
          + "\n" + '*🔘Casos Recuperados:* ' + confirmed.substring(18).trim()
          + "\n" + '*🔘Casos Fatais:* ' + confirmed.substring(10, 18).trim()
          + "\n\n\n" + 'Fonte: https://www.worldometers.info/coronavirus/'

        try {
          dbref.update({ "covid": 1 });
        } catch (err) { }
        agent.add(saida);
      })
      .catch(function (err) {
        try {
          dbref.update({ "covid": 0 });
        } catch (err) { }
        agent.add(err.message);
      });
  }

  function covid_test() {
    return rp({
      uri: "https://www.worldometers.info/coronavirus/",
      transform: function (body) {
        return cheerio.load(body);
      }
    })
      .then($ => {
        agent.add('Por favor aguarde um instante!🔄');
        let isNotFound = false

        $("table#main_table_countries_today tbody tr").each(function (i, obj) {
          const data = $(this).text().trim();
          let pais = agent.parameters['pais'];


          if (data.includes(pais)) {
            if (pais.trim().length > 2) {
              let total = $(this).find("td").eq(2).html();
              let active = $(this).find("td").eq(8).html()
              let recovered = $(this).find("td").eq(6).html()
              let fatal = $(this).find("td").eq(4).html()
              let tested = $(this).find("td").eq(12).html()

              if (!recovered.trim().length >= 1) recovered = 0;
              if (!fatal.trim().length >= 1) fatal = 0;

              let saida = '*TOTAL DE CASOS CONFIRMADOS (' + pais + ' 😷🌍):* ' + total + "\n"
                + "\n" + '*🔘Casos Activos:* ' + active
                + "\n" + '*🔘Casos Recuperados:* ' + recovered
                + "\n" + '*🔘Casos Fatais:* ' + fatal
                + "\n" + '*🔘Testes Realizados:* ' + tested
                + "\n\n\n" + 'Fonte: https://www.worldometers.info/coronavirus/'

              try {
                dbref.update({ "covid": 1 });
              } catch (err) { }
              agent.add(saida);
            } else {
              isNotFound = true
            }
          }
        });

        if (isNotFound) agent.add('Desculpe mas não foi possível encontrar dados para o país desejado.');

      })
      .catch(err => {
        try {
          dbref.update({ "covid": 0 });
        } catch (err) { }
      });
  }

  function get_icon(icon) {
    if (icon == "01d" || icon == "01n") {
      return "☀"
    }
    if (icon == "02d" || icon == "02n") {
      return "⛅"
    }
    if (icon == "03d" || icon == "03n" || icon == "04d" || icon == "04n") {
      return "☁"
    }
    if (icon == "09d" || icon == "09n" || icon == "10d" || icon == "010n") {
      return "🌧"
    }
    if (icon == "11d" || icon == "11n") {
      return "⛈"
    }
  }

  function temperatura_semanal() {
    return rp({ "uri": 'https://api.openweathermap.org/data/2.5/forecast?q=' + agent.parameters['provincia'] + '&appid=bfada4720a0c16a5008ab7283c7e478e&units=metric&cnt=15&lang=pt', json: true })
      .then(function (response) {
        var data_hoje = "", data_amanha = 0, hoje_icon = "", amanha_icon = ""

        for (let i = 0; i < 14; i++) {
          let data = response.list[i].dt_txt.split(' ')[0]
          if (i == 0) {
            data_hoje = data
          }
          if (data.split(' ')[0] != data_hoje && response.list[i].dt_txt.split(' ')[1] == "12:00:00") {
            data_amanha = i
          }
        }

        var tempo_hoje = response.list[0], tempo_amanha = response.list[data_amanha]

        hoje_icon = get_icon(tempo_hoje.weather[0].icon)
        amanha_icon = get_icon(tempo_amanha.weather[0].icon)

        let desc_hoje = tempo_hoje.weather[0].description.split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ')
        let desc_amanha = tempo_amanha.weather[0].description.split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ')
        let saida = "*Previsão de Tempo* ☀🌧\n" + agent.parameters['provincia'] + "📍🌍\n\n" + hoje_icon + " *Agora*\n" + desc_hoje + " " + parseInt(tempo_hoje.main.temp_max) + "°\nHumidade: " + tempo_hoje.main.humidity + "%"
          + "\n\n" + amanha_icon + " *Amanhã*\n" + desc_amanha + " " + parseInt(tempo_amanha.main.temp_max) + "°\nHumidade: " + tempo_amanha.main.humidity + "%" + "\n\n" + 'Provedor: https://openweathermap.org/'

        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "weather": 1 });
        } catch (err) { }
        agent.add(saida);
      })
      .catch(function (err) {
        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "weather": 0 });
        } catch (err) { }
        agent.add("Não consegui obter informações sobre temperatura, por favor tente novamente!");
      });
  }

  function tradutor() {
    if (agent.parameters['idioma'] == null || agent.parameters['idioma'] == '')
      return agent.add("Ainda não está disponível a tradução para o idioma desejado.");

    var text = agent.parameters['texto'];

    return rp({ "uri": "https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=" + agent.parameters['idioma'] + "&dt=t&q=" + agent.parameters['texto'], json: true })
      .then(function (response) {
        var saida = response[0][0][0].split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ')
        agent.add(saida);
      }).catch(function (err) {
        agent.add("Oops!! De momento não foi possível traduzir o idioma escolhido, por favor tente mais tarde. 😉");
      });
  }

  function Donate() {
    let mobile = agent.parameters['phone']
    let amount = agent.parameters['amount']

    return rp({ "uri": 'https://www.olypay.co.mz/api/v1/send_payment/?phone=' + mobile + '&amount=' + amount + '&description=Doação', json: true, timeout: 600000, resolveWithFullResponse: true })
      .then(function (res) {
        agent.add("Pagamento efectuado com sucesso.");
      }).catch(function (err) {
        agent.add("Oops!! Ocorreu um pequeno erro técnico tente novamente. 😉" + JSON.stringify(err));
      });
  }

  function olyPay_netflix_pagamentos() {
    agent.add('Por favor aguarde um instante!🔄');

    let sessions = req.body.session.split("/");
    sessions = sessions[sessions.length - 1];

    return rp({ "uri": 'https://www.olypay.co.mz/api/v1/check_payments/?s=' + sessions, json: true, timeout: 600000, resolveWithFullResponse: true })
      .then(function (res) {
        if (res.body['message'] == "") {
          agent.add('Por favor conecte ao *OLY Pay*, já tens uma conta ?');
        } else {
          agent.add(res.body['message']);
        }
      }).catch(function (err) {
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉")
      });
  }

  function olypay_account() {
    agent.add('Verificando a sua sessão no *OLY Pay*!🔄');

    let sessions = req.body.session.split("/");
    sessions = sessions[sessions.length - 1];

    return rp({ "uri": 'https://www.olypay.co.mz/api/v1/check_session/?s=' + sessions, json: true, timeout: 600000, resolveWithFullResponse: true })
      .then(function (res) {
        if (res.body['message'] == "") {
          agent.add('Por favor conecte ao *OLY Pay*, já tens uma conta ?');
        } else {
          agent.setContext({
            name: 'OlyPay_Menu',
            lifespan: 5,
            parameters: {}
          });

          agent.add(res.body['message']);
        }
      }).catch(function (err) {
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉")
      });
  }

  function olypay_account_create() {
    var sessions = req.body.session.split("/");
    var s = sessions[sessions.length - 1];

    agent.add('Perfeito ' + agent.parameters['name'] + '!');
    agent.add('Por favor finalize o registo pelo link: https://www.olypay.co.mz/account/register/bot?e=' + agent.parameters['email'] + '&s=' + s + '&n=' + agent.parameters['name'].replace(" ", "%20") + '&m=' + agent.parameters['mobile']);
  }

  function olypay_account_login() {
    var sessions = req.body.session.split("/");
    var s = sessions[sessions.length - 1];

    return rp({ "uri": 'https://www.olypay.co.mz/api/v1/check_session/?s=' + s + '&u=' + agent.parameters['uuid'], json: true, timeout: 600000, resolveWithFullResponse: true })
      .then(function (res) {
        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "olypay": 1 });
        } catch (err) { }

        if (res.body['message'] == "") {
          agent.add('Por favor conecte ao *OLY Pay*, já tens uma conta ?');
        } else {
          agent.add(res.body['message']);
        }
      }).catch(function (err) {
        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "olypay": 0 });
        } catch (err) { }
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉");
      });
  }

  function OlyPay_Menu_Netlix() {
    var sessions = req.body.session.split("/");
    var s = sessions[sessions.length - 1];
    agent.add('Solicitando pagamento, por favor confirme...');

    return rp({ "uri": 'https://www.olypay.co.mz/api/v1/send_payment/?s=' + s + '&package=' + agent.parameters['netflix'] + '&phone=' + agent.parameters['mobile'], json: true, timeout: 600000, resolveWithFullResponse: true })
      .then(function (res) {
        agent.add('Obrigado pela preferência! 😎');
        agent.add('Em breve receberá uma notificação através do contacto: *' + agent.parameters['mobile'] + '* para activação do pacote Netflix.');
      }).catch(function (err) {
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉")
      });
  }

  function Movies_Upcoming() {
    agent.add('Por favor aguarde um instante!🔄');
    let page = getRndInteger(1, 2);
    return rp({ "uri": 'https://api.themoviedb.org/3/movie/upcoming?api_key=f10be8accbe3d4c5d6fd034d42d4de56&page=' + page, json: true, timeout: 600000, resolveWithFullResponse: true })
      .then(function (res) {
        let saida = "*Últimos Lançamentos de Filmes 2020*🍿🆕🔜\n\n"
        res.body.results.forEach(function (entry) {
          if (entry.original_language == 'pt' || entry.original_language == 'en' || entry.original_language == 'es')
            saida = saida + '📺 *Título: ' + entry.original_title + '*\n'
              + '*Género: ' + getGenre(entry.genre_ids[0]) + '*\n'
              + '*Data de Lançamento:* ' + entry.release_date + '\n'
              + '*Descrição:* ' + entry.overview.substring(0, (entry.overview.length / 2)) + '...\n\n'
        });

        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "olyflix": 1 });
        } catch (err) { }

        agent.add(saida);
        agent.add('Pergunte novamente para receber uma lista diferente 🙂');
      }).catch(function (err) {
        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "olyflix": 0 });
        } catch (err) { }
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉");
      });
  }

  function Movies_Popular() {
    agent.add('Por favor aguarde um instante!🔄');
    let page = getRndInteger(1, 4);
    return rp({ "uri": 'https://api.themoviedb.org/3/movie/popular?api_key=f10be8accbe3d4c5d6fd034d42d4de56&page=' + page, json: true, timeout: 600000, resolveWithFullResponse: true })
      .then(function (res) {
        let saida = "*Filmes Populares 2020*🍿🔝\n\n"
        res.body.results.forEach(function (entry) {
          if (entry.original_language == 'pt' || entry.original_language == 'en' || entry.original_language == 'es')
            saida = saida + '📺 *Título: ' + entry.original_title + '*\n'
              + '*Género: ' + getGenre(entry.genre_ids[0]) + '*\n'
              + '*Data de Lançamento:* ' + entry.release_date + '\n'
              + '*Descrição:* ' + entry.overview.substring(0, (entry.overview.length / 2)) + '...\n\n'
        });

        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "olyflix": 1 });
        } catch (err) { }

        agent.add(saida);
        agent.add('Pergunte novamente para receber uma lista diferente 🙂');
      }).catch(function (err) {
        try {
          const ref = admin.database().ref().child("oly-service");
          ref.update({ "olyflix": 0 });
        } catch (err) { }
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉");
      });
  }

  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function getGenre(id) {
    let saida = "Outros"
    var generos = [{ "id": 28, "name": "Ação" },
    { "id": 12, "name": "Aventura" },
    { "id": 16, "name": "Animação" },
    { "id": 35, "name": "Comédia" },
    { "id": 80, "name": "Crime" },
    { "id": 99, "name": "Documentário" },
    { "id": 18, "name": "Drama" },
    { "id": 10751, "name": "Família" },
    { "id": 14, "name": "Fantasia" },
    { "id": 36, "name": "História" },
    { "id": 27, "name": "Terror" },
    { "id": 10402, "name": "Música" },
    { "id": 9648, "name": "Mistério" },
    { "id": 10749, "name": "Romance" },
    { "id": 878, "name": "Ficção científica" },
    { "id": 10770, "name": "Cinema TV" },
    { "id": 53, "name": "Thriller" },
    { "id": 10752, "name": "Guerra" },
    { "id": 37, "name": "Faroeste" }]

    generos.forEach(function (entry) {
      if (id == entry.id)
        saida = entry.name
    });
    return saida;
  }

  function Movie_Recommend() {
    agent.add('Por favor aguarde um instante!🔄');
    return rp({ "uri": 'https://api.themoviedb.org/3/search/movie?api_key=f10be8accbe3d4c5d6fd034d42d4de56&page=1&include_adult=false&query=' + agent.parameters['query'], json: true, timeout: 600000, resolveWithFullResponse: true })
      .then(function (res) {
        if (res.body.total_pages == 0) {
          agent.add("Nenhum filme semelhate ao *" + agent.parameters['query'] + '* foi encontrado, por favor tente novamente com outro título.')
        } else {
          return rp({ "uri": 'https://api.themoviedb.org/3/movie/' + res.body.results[0].id + '/recommendations?api_key=f10be8accbe3d4c5d6fd034d42d4de56&page=1', json: true, timeout: 600000, resolveWithFullResponse: true })
            .then(function (resp) {
              let saida = "*Filmes Recomendados*🍿✅🔝\n\n"
              resp.body.results.forEach(function (entry) {
                if (entry.original_language == 'pt' || entry.original_language == 'en' || entry.original_language == 'es' && entry.vote_average >= 6)
                  saida = saida + '📺 *Título: ' + entry.original_title + '*\n'
                    + '*Género: ' + getGenre(entry.genre_ids[0]) + '*\n'
                    + '*Data de Lançamento:* ' + entry.release_date + '\n'
                    + '*Descrição:* ' + entry.overview.substring(0, (entry.overview.length / 2)) + '...\n\n';
              });

              try {
                const ref = admin.database().ref().child("oly-service");
                ref.update({ "olyflix": 1 });
              } catch (err) { }
              agent.add(saida);
            }).catch(function (err) {
              try {
                const ref = admin.database().ref().child("oly-service");
                ref.update({ "olyflix": 0 });
              } catch (err) { }
              agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉");
            });
        }
      }).catch(function (err) {
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉");
      });
  }

  function Estado_Oly() {
    dbref.on("value", function (snapshot) { agent.add('Por favor aguarde um instante!🔄'); });

    return dbref.on("value", function (snapshot) {
      let covid = "🟢", love = "🟢", olyflix = "🟢", olypay = "🟢", rate = "🟢", translate = "🟢", weather = "🟢", footballstands = "🟢";

      if (JSON.stringify(snapshot.child("covid")).toString() == "0") covid = "🔴";
      if (JSON.stringify(snapshot.child("lovecalculator").toString()) == "0") love = "🔴";
      if (JSON.stringify(snapshot.child("olyflix").toString()) == "0") olyflix = "🔴";
      if (JSON.stringify(snapshot.child("olypay").toString()) == "0") olypay = "🔴";
      if (JSON.stringify(snapshot.child("rate").toString()) == "0") rate = "🔴";
      if (JSON.stringify(snapshot.child("translate").toString()) == "0") translate = "🔴";
      if (JSON.stringify(snapshot.child("weather").toString()) == "0") weather = "🔴";
      if (JSON.stringify(snapshot.child("footballstands").toString()) == "0") footballstands = "🔴";

      let saida = '*Serviços OLY* 📡 🔌\n\n'
        + "\n" + covid + '* Covid19 Tracker*'
        + "\n" + love + '* Love Calculator*'
        + "\n" + olyflix + '* OlyFlix*'
        + "\n" + olypay + '* OlyPay*'
        + "\n" + rate + '* Rates*'
        + "\n" + translate + '* Translator*'
        + "\n" + weather + '* Weather*';
        + "\n" + footballstands + '* Football Stands*';

      agent.add(saida);
    }, function (errorObject) {
      agent.add('Por favor, tente novamente!');
    });
  }

  function FindPlace() {
    let query = agent.parameters['query'], location = agent.parameters['location']

    if (!location.includes('maputo') || !location.includes('matola')) location = 'Maputo ' + location

    var options = {
      uri: 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + location,
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        'accept-language': 'en-US,en;q=0.9',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      },
      json: true
    };

    return rp(options).then(function (res) {
      if (res.length > 0) {
        let place_name = res[0]['display_name'], lat = res[0]['lat'], lng = res[0]['lon'], icon = "⛳"
        place_name = place_name.split(',');
        place_name = place_name[0].toString() + ', ' + place_name[1].toString();

        agent.add('Procurando: *' + query.charAt(0).toUpperCase() + query.substr(1).toLowerCase().replace('?', '') + '* perto de ' + place_name);

        if (query == 'atm') icon = "💳";
        if (query == 'bar') icon = "🍺";
        if (query == 'bank') icon = "🏦";
        if (query == 'cafe') icon = "☕";
        if (query == 'pharmacy') icon = "💊";
        if (query == 'gym') icon = "🏋‍♂";
        if (query == 'bakery') icon = "🍞";
        if (query == 'restaurant') icon = "🍝";

        const opts = {
          method: 'GET',
          url: 'https://trueway-places.p.rapidapi.com/FindPlacesNearby',
          qs: {
            location: '-25.9558338,32.5663708',
            type: query,
            radius: '10000',
            language: 'en'
          },
          headers: {
            'x-rapidapi-key': '31bf17fe7amsh7ff82356fd46c14p143f26jsn3aa9c1d53b19',
            'x-rapidapi-host': 'trueway-places.p.rapidapi.com',
            useQueryString: true
          },
          json: true
        };

        return rp(opts).then(function (resps) {
          let data = resps.results, saida = '*Lugares Próximos Encontrados* ' + icon + '\n\n', index = 0

          data.forEach(function (entry) {
            if (index < 5 && !entry.name.includes('IGREJA')) {
              saida = saida + '🟢 *Nome: ' + entry.name + '*\n'
                + '*Endereço:* ' + entry.address + '\n'
                + '*Distância: * ~' + entry.distance + 'm\n\n';
              index = index + 1
            }
          });
          saida = saida + '\n\n\n⚠ Fase Experimental';
          agent.add(saida);
        }).catch(function (err) {
          agent.add('Ops, não foi possível pesquisar! por favor tente novamente.');
        });

      } else {
        agent.add('Ops, não foi possível identificar a sua localização: *' + location + '* \n\nPor favor tente novamente com nome de uma Cidade, Avenida ou Bairro 🙂');
      }
    }).catch(function (err) {
      agent.add('Ops, não foi possível pesquisar! por favor tente novamente.');
    });
  }

  function vagas() {
    agent.add('Por favor, aguarde só um instante 🙂');

    return rp('https://www.emprego.co.mz/').then(function (htmlString) {
      const $ = cheerio.load(htmlString);
      let total_available = $("ul.grid-display li").length;
      let saida = "*(" + total_available + ") Últimas Vagas de Emprego 💼⛑*\n\n";

      $("ul.grid-display li").each(function (i, obj) {
        let name = $(this).find(".grid-info h3 a").text();
        let desc = $(this).find(".grid-info h4").text();
        saida = saida + (i + 1) + '. ' + name + '\n' + desc + '\n\n';
      });

      saida = saida + 'Digite o número da Vaga para ver mais detalhes 🙂' + "\n\n" + 'Fonte: www.emprego.co.mz';
      agent.add(saida);
    })
      .catch(function (err) {
        agent.add(err.message);
      });
  }

  function Vagas_Details() {
    return rp('https://www.emprego.co.mz/').then(function (htmlString) {
      const $ = cheerio.load(htmlString);
      let code = agent.parameters['code'];
      let link = ''

      $("ul.grid-display li").each(function (i, obj) {
        if (i == (parseInt(code) - 1)) {
          link = $(this).find(".grid-item a").attr('href');
        }
      });

      return rp(link).then(function (htmlString) {
        const $ = cheerio.load(htmlString);
        let main = $(".content-vacancy");

        let name = main.find("h1.h3").text();
        let company = main.find("h3.h4").text();
        let desc = main.first("div").text();
        let functions = '\n', requirements = '\n';

        let firstss = $($(".content-vacancy div").find('ul')[0]).find('li');
        let seccs = []

        if (firstss.length <= 1) {
          firstss = $($(".content-vacancy div").find('ul')[1]).find('li');
          seccs = $($(".content-vacancy div").find('ul')[2]).find('li');
        } else seccs = $($(".content-vacancy div").find('ul')[1]).find('li');

        $(firstss).each(function (i, obj) {
          functions = functions + '•' + $(this).text() + '\n';
        });

        $(seccs).each(function (i, obj) {
          requirements = requirements + '•' + $(this).text() + '\n';
        });

        let category = $($("#vacancy-meta").find('ul li.clearfix')[2]).find('span.right').text();
        let pub = $($("#vacancy-meta").find('ul li.clearfix')[3]).find('span.right').text();
        let expire = $($("#vacancy-meta").find('ul li.clearfix')[4]).find('span.right').text();

        let saida = '*' + name + '*\nEntidade: ' + company + '\n\n' + '*Funções:*' + functions + '\n*Requisitos:*' + requirements + '\n' + category + '\nPublicado: ' + pub + '\nExpira: ' + expire + '\n\nPara se candidatar aceda ao link: ' + link

        agent.add(saida);
        agent.add('Digite o número da Vaga para ver os detalhes ou *Vagas disponíveis* para ter acesso a lista das últimas vagas 🙂.');
      }).catch(function (err) {
        agent.add(err.message);
      });
    })
      .catch(function (err) {
        agent.add(err.message);
      });
  }

  function Vagas_Category() {
    let category = agent.parameters['category'];
    agent.add('Por favor, aguarde só um instante 🙂');

    return rp('https://www.emprego.co.mz/categoria/' + category).then(function (htmlString) {
      const $ = cheerio.load(htmlString);
      let saida = "*" + $("h1.page-small-title").text().trim() + " 💼⛑*\n\n";

      $("div.content-display ul").each(function (i, obj) {
        let name = $(this).find("li.col1 h3 a").text().trim();
        let desc = $(this).find("li.col1 h4").text().trim();
        let valid = $(this).find("li.col3").text().trim();
        let location = $(this).find("li.col2 a").text().trim();

        saida = saida + (i + 1) + '. ' + name + '\n' + desc + '\n*Local: * ' + location + ' Validade: ' + valid + '\n\n';
      });

      agent.add(saida + 'Digite o número da Vaga para ver mais detalhes 🙂' + "\n\n" + 'Fonte: www.emprego.co.mz');
    })
      .catch(function (err) {
        agent.add(err.message);
      });
  }

  function Owner_Name() {
    var sessions = req.body.session.split("/");
    var s = sessions[sessions.length - 1];

    let person = agent.parameters['person'];
    person = person.charAt(0).toUpperCase() + person.substr(1).toLowerCase();
    agent.add('Anotado ' + person.charAt(0).toUpperCase() + person.substr(1).toLowerCase() + ' 🙂');
    agent.add('Quando quiser mudar o nome envie: Me chame de novonome por exemplo [Me chame de Marcos]')
    agent.add('O que precisas saber?\n\n_(Digite *o que posso saber?* no campo de textos)_') 
    const ref = admin.database().ref().child("names");
    ref.update({ [s]: person });
  }

  function Saudacao() {
    var sessions = req.body.session.split("/");
    var s = sessions[sessions.length - 1];
    return rp({ "uri": 'https://equinox-bead-globeflower.glitch.me/olynames', json: true, headers: {'User-Agent': 'Request-Promise'}, timeout: 600000, rejectUnauthorized: false })
      .then(function (res) {
        let name = res[s]
        const intent = req.body.queryResult.intent.displayName;
        
        if(name == undefined) {
            switch(intent){
              case 'Saudação Oly 1': agent.add('Olá');break;
              case 'Saudação Oly 2': agent.add('Óptimo');break;
              case 'saudação_formal':
                let cumprimento = agent.parameters['cumprimentoformal'];    
                agent.add(cumprimento);break;
            }
          agent.add('Gostaria de conhecer o seu nome para ficarmos mais próximos')
          agent.add('Qual é o seu nome ? 😊')
        }else { 
          if(intent == 'Saudação Oly 1'){
            agent.add('Olá ' + name + '!') 
            agent.add('tudo bem? 🙂')
          }else if(intent == 'Saudação Oly 2'){
            agent.add('Óptimo ' + name + '😁!\nO que precisas saber?\n\n_(Digite *o que posso saber?* no campo de textos)_') 
          }else {
            let cumprimentoformal = agent.parameters['cumprimentoformal'];
            agent.add(cumprimentoformal + ' ' + name + '!') 
            agent.add('tudo bem? 🙂')
          }
        }
      }).catch(function (err) {
        agent.add('Olá!\nO que precisas saber?\n\n_(Digite *o que posso saber?* no campo de textos)_') 
    });
  }

  function Vagas_Category_Details() {
    let category = agent.contexts[0].parameters['category'];

    return rp('https://www.emprego.co.mz/categoria/' + category).then(function (htmlString) {
      const $ = cheerio.load(htmlString);
      let code = agent.parameters['code'];
      let link = ''

      $("div.content-display ul").each(function (i, obj) {
        if (i == (parseInt(code) - 1)) {
          link = $(this).find("li.col1 h3 a").attr('href');
        }
      });

      return rp(link).then(function (htmlString) {
        const $ = cheerio.load(htmlString);
        let main = $(".content-vacancy");

        let name = main.find("h1.h3").text();
        let company = main.find("h3.h4").text();
        let desc = main.first("div").text();
        let functions = '\n', requirements = '\n';

        let firstss = $($(".content-vacancy div").find('ul')[0]).find('li');
        let seccs = []

        if (firstss.length <= 1) {
          firstss = $($(".content-vacancy div").find('ul')[1]).find('li');
          seccs = $($(".content-vacancy div").find('ul')[2]).find('li');
        } else seccs = $($(".content-vacancy div").find('ul')[1]).find('li');

        $(firstss).each(function (i, obj) {
          functions = functions + '•' + $(this).text() + '\n';
        });

        $(seccs).each(function (i, obj) {
          requirements = requirements + '•' + $(this).text() + '\n';
        });

        let category = $($("#vacancy-meta").find('ul li.clearfix')[2]).find('span.right').text();
        let pub = $($("#vacancy-meta").find('ul li.clearfix')[3]).find('span.right').text();
        let expire = $($("#vacancy-meta").find('ul li.clearfix')[4]).find('span.right').text();

        let saida = '*' + name + '*\nEntidade: ' + company + '\n\n' + '*Funções:*' + functions + '\n*Requisitos:*' + requirements + '\n' + category + '\nPublicado: ' + pub + '\nExpira: ' + expire + '\n\nPara se candidatar aceda ao link: ' + link

        agent.add(saida);
        agent.add('Digite o número da Vaga para ver os detalhes ou *Vagas disponíveis* para ter acesso a lista das últimas vagas 🙂.');
      }).catch(function (err) {
        agent.add(err.message);
      });
    })
      .catch(function (err) {
        agent.add(err.message);
      });
  }
  
  function Football_Stands() {
    let league = agent.parameters['League'];
    let league_code = 0;
    switch(league) {
      case 'Premier League': league_code = 152; break;
      case 'Bundesliga': league_code = 175; break;
      case 'Serie A': league_code = 207; break;
      case 'Primeira Liga': league_code = 266; break;
      case 'Ligue 1': league_code = 168; break;
      case 'La Liga': league_code = 302; break;
      default: agent.add('A liga solicitada ainda não se encontra disponível.');
    }

    if(league_code > 0){
      
      return rp({ "uri": 'https://apiv3.apifootball.com/?action=get_standings&league_id='+ league_code +'&APIkey=a8b27edffa33fb6267d22eed0cde3bceb30d84aa14c62a8fc0352fd70d64734c', json: true, timeout: 600000, rejectUnauthorized: false })
      .then(function (res) {
        let saida = "📊 Top 10 Classificação da "+ league +" ⚽\n\n";
        let index = 1;
        updateServiceStatus(1, "footballstands");
        res.forEach(function (entry) {
          if(index >= 11) {}
          else{
            saida = saida + getIconNumber(entry.overall_league_position) + entry.team_name + '  ' + entry.overall_league_payed
              + 'PD '+ entry.overall_league_W + 'V ' + entry.overall_league_D + 'E ' + entry.overall_league_L + 'L ' 
              + '*' + entry.overall_league_PTS + 'Pts*' + '\n';
            index = index + 1
          }
        });
        agent.add(saida)
      }).catch(function (err) {
        updateServiceStatus(0, "footballstands");
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉" + JSON.stringify(err.message));
      });
    }
  }

  function Football_Results(){
    let league = agent.parameters['league'];
    let league_code = 0;
    switch(league) {
      case 'Premier League': league_code = '39'; break;
      case 'Bundesliga': league_code = '78'; break;
      case 'Serie A': league_code = '135'; break;
      case 'Primeira Liga': league_code = '94'; break;
      case 'Ligue 1': league_code = '61'; break;
      case 'La Liga': league_code = '140'; break;
      default: agent.add('A liga solicitada ainda não se encontra disponível.');
    }
    if (league_code != 0){
      var today = new Date();  
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;
      
      var start = new Date();
      start.setDate(start.getDate()-14);
      dd = String(start.getDate()).padStart(2, '0');
      mm = String(start.getMonth() + 1).padStart(2, '0');
      yyyy = start.getFullYear();
      start = yyyy + '-' + mm + '-' + dd;

      var options = {
        uri: 'https://api-football-v1.p.rapidapi.com/v3/fixtures',
        qs: {league: league_code, season: '2021', from: start, to: today},
        headers: {
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
          'x-rapidapi-key': '65cce74b49msh7eed8a84648541ep1179abjsn1208825c3079',
          useQueryString: true
        },
        json: true,
        timeout: 600000, 
        rejectUnauthorized: false
      };

      return rp(options)
      .then(function (res) {
        let saida = "📋 Últimos Jogos da "+ league +" ⚽\n\n";
        updateServiceStatus(1, "footballresults");
        if(res.response.length >= 1){
          res.response.forEach(function (entry) {
            if (entry.goals.home != null){
              let icon_home = "🔴 ", icon_away = " 🔴";
              if(entry.goals.home > entry.goals.away) icon_home = "🟢 "
              else if (entry.goals.home < entry.goals.away) icon_away = " 🟢"
              else{
                icon_home = "⚫ ";
                icon_away = " ⚫";
              }
              saida = saida + icon_home + entry.teams.home.name + ' ' + entry.goals.home + ' - ' + entry.goals.away + ' ' + entry.teams.away.name + icon_away + '\n';
            }
          });
        }else saida = 'Não houverão jogos na ' + league + " nos últimos 14 dias.";

        agent.add(saida);
      }).catch(function (err) {
        updateServiceStatus(0, "footballresults");
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉" + JSON.stringify(err.message));
      });
    }
  }

  function Football_NextPlays(){
    let league = agent.parameters['League'];
    let league_code = 0;
    switch(league) {
      case 'Premier League': league_code = '39'; break;
      case 'Bundesliga': league_code = '78'; break;
      case 'Serie A': league_code = '135'; break;
      case 'Primeira Liga': league_code = '94'; break;
      case 'Ligue 1': league_code = '61'; break;
      case 'La Liga': league_code = '140'; break;
      default: agent.add('A liga solicitada ainda não se encontra disponível.');
    }

    if(league_code > 0){
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;
      
      var tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate()+1);
      dd = String(tomorrow.getDate()).padStart(2, '0');
      mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      yyyy = tomorrow.getFullYear();
      tomorrow = yyyy + '-' + mm + '-' + dd;

      var options = {
        uri: 'https://api-football-v1.p.rapidapi.com/v3/fixtures',
        qs: {league: league_code, season: '2021', from: today, to: tomorrow},
        headers: {
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
          'x-rapidapi-key': '65cce74b49msh7eed8a84648541ep1179abjsn1208825c3079',
          useQueryString: true
        },
        json: true,
        timeout: 600000, 
        rejectUnauthorized: false
    };

    return rp(options)
      .then(function (res) {
        let saida = "📅 Jogos da "+ league +" ⚽\n\n";
        updateServiceStatus(1, "footballnextplays");
        let saidaHoje = '🗓 Hoje\n', saidaAmanha = '🗓 Amanhã\n';
        res.response.forEach(function (entry) {
          let play_date = new Date(entry.fixture.date);
          play_date.setHours(play_date.getHours() + 2);
          let min = play_date.getMinutes();
          if(min == 0) min = '00';
          let play_time = play_date.getHours() + ':' + min;
          play_date = play_date.getFullYear() + '-' + String(play_date.getMonth() + 1).padStart(2, '0') + '-' + String(play_date.getDate()).padStart(2, '0')

          if(play_date == today) {
            if(entry.fixture.status.short == "NS"){
              saidaHoje = saidaHoje + entry.teams.home.name + ' v ' + entry.teams.away.name + ' - ' + play_time + '\n';
            }else {
              saidaHoje = saidaHoje + entry.teams.home.name + ' ' + entry.goals.home + ' - ' + entry.goals.away + ' ' + entry.teams.away.name + '\n';
            }
          }else{
            saidaAmanha = saidaAmanha + entry.teams.home.name + ' v ' + entry.teams.away.name + ' - ' + play_time + '\n';
          }
        });

        if(saidaHoje == '🗓 Hoje\n' && saidaAmanha == '🗓 Amanhã\n') saida = 'Nenhum jogo está agendado para hoje ou amanhã na ' + league + "."
        else if (saidaHoje != '🗓 Hoje\n' && saidaAmanha == '🗓 Amanhã\n') saida = saida + saidaHoje;
        else if (saidaAmanha != '🗓 Amanhã\n' && saidaHoje == '🗓 Hoje\n') saida = saida + saidaAmanha;
        else saida = saida + saidaHoje + '\n' + saidaAmanha;
        agent.add(saida);
      }).catch(function (err) {
        updateServiceStatus(0, "footballnextplays");
        agent.add("Oops!! Ocorreu um pequeno erro técnico, por favor tente novamente. 😉" + JSON.stringify(err.message));
      });
    }
  }
  
  function WhatIs () {
    agent.add('Por favor aguarde um instante!🔄');
    return rp({uri: 'https://www.significados.com.br/comunismo/', rejectUnauthorized: false})
      .then(function (htmlString) {
        const $ = cheerio.load(htmlString)
        let saida = $('article.article').text()
        agent.add(saida);
      })
      .catch(function (err) {
        console.log(err.message);
      });
  }
  
  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }

  function updateServiceStatus(status, service){
    try {
      const ref = admin.database().ref().child("oly-service");
      ref.update({ service : status });
    } catch (err) { }
  }
  
  function getIconNumber(number){
    switch(number){
      case '1': return "1⃣";break;
      case '2': return "2⃣";break;
      case '3': return "3⃣";break;
      case '4': return "4⃣";break;
      case '5': return "5⃣";break;
      case '6': return "6⃣";break;
      case '7': return "7⃣";break;
      case '8': return "8⃣";break;
      case '9': return "9⃣";break;
      case '10': return "🔟";break;
    }
  }

  let intentMap = new Map()
  intentMap.set('Saudação Oly 1', Saudacao)
  intentMap.set('Saudação Oly 2', Saudacao)
  intentMap.set('saudação_formal', Saudacao)
  intentMap.set('Owner_Name', Owner_Name)
  intentMap.set('covid', covid)
  intentMap.set('cambio', cambio)
  intentMap.set('covid_test', covid_test)
  intentMap.set('Status Oly', Estado_Oly)
  intentMap.set('Find Location', FindPlace)
  intentMap.set('Temperatura', temperatura_semanal)
  intentMap.set('Tradutor', tradutor)
  intentMap.set('love_calc', love_calc)
  intentMap.set('Donate', Donate)
  intentMap.set('Olypay_Netflix', olypay_account)
  intentMap.set('Olypay_Netflix - no - yes', olypay_account_create)
  intentMap.set('Olypay.Login', olypay_account_login)
  intentMap.set('OlyPay_Menu_Netlix', OlyPay_Menu_Netlix)
  intentMap.set('OlyPay_Netflix_Pagamentos', olyPay_netflix_pagamentos)
  intentMap.set('Movies_Upcoming', Movies_Upcoming)
  intentMap.set('Movies_Popular', Movies_Popular)
  intentMap.set('Movie_Recommend', Movie_Recommend)
  intentMap.set('Vagas', vagas)
  intentMap.set('Vagas - Details', Vagas_Details)
  intentMap.set('Vagas - Categoria', Vagas_Category)
  intentMap.set('Vagas - Categoria - Detail', Vagas_Category_Details)
  intentMap.set('Football - Standings', Football_Stands)
  intentMap.set('Football - Next Plays', Football_NextPlays)
  intentMap.set('Football - Results', Football_Results)
  intentMap.set('WhatIs - Search', WhatIs)

  agent.handleRequest(intentMap)
});

app.listen(process.env.PORT)