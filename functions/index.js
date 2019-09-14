function wantContinue(conv) {
	var suggestions = new Suggestions('Sí', 'No');
	var name = conv.user.storage.userName;
	
	if (name) {
		conv.ask(`\n¿Quieres seguir preguntándome ${name}?`);
		conv.ask(suggestions);
	} else {
		conv.ask('\n¿Quieres seguir preguntándome?');
		conv.ask(suggestions);
	}
}

'use strict';

const {
  dialogflow,
  Permission,
  Suggestions
} = require('actions-on-google');

const functions = require('firebase-functions');
const https = require('https');

const app = dialogflow({debug: true});

app.intent('Welcome intent', (conv) => {
	const name = conv.user.storage.userName;
	
	if(name) {
		conv.ask(`Hola de nuevo ${name} ¿Qué te gustaría saber de la empresa?`);
	} else {
		conv.ask(new Permission({
			context: 'Hola, para conocerte mejor',
			permissions: 'NAME'
		}));
	}
});

app.intent('Action intent permission', (conv, params, permissionGranted) => {
	var suggestions = new Suggestions('Próximos webinars programados', '¿Cuántos empleados tiene?', '¿Qué significa el nombre?', '¿Qué sedes tiene?');
  
	if (!permissionGranted) {
		conv.ask('Entendido, no hay problema. ¿Qué te gustaría saber de la empresa?');
		conv.ask(suggestions);
	} else {
		conv.user.storage.userName = conv.user.name.display;
		conv.ask(`Gracias, ${conv.user.storage.userName}. ¿Qué te gustaría saber de la empresa?`);
		conv.ask(suggestions);
	}
});

app.intent('Employees', (conv, {numeroEmpleados}) => {
	conv.ask('atSistemas ya tiene más de 1301 empleados.');
	wantContinue(conv);
});

app.intent('Name meaning', (conv, {significado}) => {
	conv.close('atSistemas quiere decir \'Aplicaciones y tratamientos de sistemas\'');
	wantContinue(conv);
});

app.intent('Headquarters', (conv, {any, ciudad}) => {
	if(ciudad) {
		switch (ciudad.toLowerCase()) {
			case "las rozas":
			case "rozas":
				conv.ask("Calle Valle de Alcudia número 3, edificio 2, planta 1.");
				break;
			case "madrid":
				conv.ask("Calle Acanto número 22, planta 3. Y otra en calle Retama número 7, planta 1");
				break;
			case "barcelona":
				conv.ask("Plaça Cde Catalunya 21, Planta 2.");
				break;
			case "cádiz":
			case "cadiz":
				conv.ask("Calle del Desarrollo número 2, oficina 12, planta 1.");
				break;
			case "a coruña":
			case "coruña":
				conv.ask("Rúa Ferrol número 1, planta 6.");
				break;
			case "zaragoza":
				conv.ask("Calle Bari número 57, planta baja, puerta 5.");
				break;
			case "palma de mallorca":
			case "palma":
			case "mallorca":
				conv.ask("Calle Gremis de Sabaters número 21, polígino de Son Castello.");
				break;
			case "huelva":
				conv.ask("Calle Caucho número 1, polígono La Raya.");
				break;
			case "milán":
			case "milan":
				conv.ask("Via Mauro Macchi número 8.");
				break;
			case "sevilla":
				conv.ask("Calle José de la Cámara número 5, planta 4.");
				break;
			default:
				conv.ask(`Actualmente no hay ninguna oficina en ${ciudad}`);
				break;
		}
	} else {
		conv.ask("Actualmente atSistemas tiene 11 oficinas repartidas entre Las Rozas, Madrid, Barcelona, Cádiz, A Coruña, Zaragoza, Palma de Mallorca, Huelva, Milán y Sevilla.");
	}
	
	wantContinue(conv);
});

app.intent('Webinars', (conv, {any}) => {
	var output = "";
	try {
		(async () => {
			console.log("Starting sended");
			await https.get('https://api.rss2json.com/v1/api.json?rss_url=https://www.atsistemas.com/rss/?feedPath=/webinars-atsistemas', (resp) => {
				let data = '';

				resp.on('data', (chunk) => {
					data += chunk;
				});

				resp.on('end', () => {
					var feed = JSON.parse(data);
					console.log("Data:" + feed);
					for(var item in feed.items) {
						var feedDate = new Date(item.pubDate);
						var currentDate = new Date();
						
						if(feedDate >= currentDate) {
							output += item.title + ' - > Disponible el ' + date + '. Más información en ' + item.link + '\n';
						} else {
							break;
						}
					}
					
					if(output) {
						conv.ask(`Los webinars programados son:\n${output}`);
					} else {
						conv.ask("Parece que no hay ningún webinar programado.");
					}
				});

			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		})();
	} catch (err) {
		output = "Error!";
		conv.close(output);
	}
	
	conv.ask("Funcionalidad no implementada pero sí programada, requiere pago en firebase :(");
	wantContinue(conv);
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);